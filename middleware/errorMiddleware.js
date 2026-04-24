const fs = require('fs');
const path = require('path');

// Logger les erreurs dans un fichier
const logError = (error, req) => {
    const logEntry = {
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url,
        ip: req.ip,
        userId: req.userId || 'anonymous',
        error: {
            name: error.name,
            message: error.message,
            stack: error.stack
        }
    };
    
    // Logger dans la console
    console.error(JSON.stringify(logEntry, null, 2));
    
    // Optionnel: écrire dans un fichier de log
    const logDir = path.join(__dirname, '../logs');
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
    
    const logFile = path.join(logDir, 'errors.log');
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
};

// Middleware pour les routes non trouvées
const notFound = (req, res, next) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: `Route ${req.method} ${req.url} non trouvée`
        }
    });
};

// Middleware principal de gestion des erreurs
const errorHandler = (err, req, res, next) => {
    // Logger l'erreur
    logError(err, req);
    
    // Erreur Joi (validation)
    if (err.name === 'ValidationError') {
        return res.status(422).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Erreur de validation des données',
                details: err.details
            }
        });
    }
    
    // Erreur JWT
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            error: {
                code: 'INVALID_TOKEN',
                message: 'Token invalide'
            }
        });
    }
    
    // Token expiré
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            error: {
                code: 'TOKEN_EXPIRED',
                message: 'Token expiré. Veuillez vous reconnecter.'
            }
        });
    }
    
    // Erreur PostgreSQL
    if (err.code && err.code.startsWith('23')) {
        // Violation de contrainte unique
        if (err.code === '23505') {
            const constraint = err.constraint || 'unique_violation';
            return res.status(409).json({
                success: false,
                error: {
                    code: 'DUPLICATE_ENTRY',
                    message: 'Une entrée avec ces informations existe déjà',
                    constraint
                }
            });
        }
        
        // Violation de clé étrangère
        if (err.code === '23503') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'FOREIGN_KEY_VIOLATION',
                    message: 'Référence à une ressource qui n\'existe pas'
                }
            });
        }
        
        // Autre erreur PostgreSQL
        return res.status(400).json({
            success: false,
            error: {
                code: 'DATABASE_ERROR',
                message: err.message
            }
        });
    }
    
    // Erreur Multer (upload)
    if (err.name === 'MulterError') {
        if (err.code === 'FILE_TOO_LARGE') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'FILE_TOO_LARGE',
                    message: 'Le fichier est trop volumineux'
                }
            });
        }
        return res.status(400).json({
            success: false,
            error: {
                code: 'UPLOAD_ERROR',
                message: err.message
            }
        });
    }
    
    // Erreur personnalisée
    if (err.isCustomError) {
        return res.status(err.statusCode || 400).json({
            success: false,
            error: {
                code: err.code || 'CUSTOM_ERROR',
                message: err.message
            }
        });
    }
    
    // Erreur par défaut
    const statusCode = err.statusCode || 500;
    const message = statusCode === 500 ? 'Erreur interne du serveur' : err.message;
    
    res.status(statusCode).json({
        success: false,
        error: {
            code: err.code || 'SERVER_ERROR',
            message: message,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        }
    });
};

// Classe d'erreur personnalisée
class AppError extends Error {
    constructor(message, statusCode, code = 'APP_ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isCustomError = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

// Fonction pour créer des erreurs asynchrones
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Middleware pour les requêtes trop volumineuses
const requestSizeLimit = (limit = '10mb') => {
    return (err, req, res, next) => {
        if (err.type === 'entity.too.large') {
            return res.status(413).json({
                success: false,
                error: {
                    code: 'REQUEST_TOO_LARGE',
                    message: `La requête dépasse la limite de ${limit}`
                }
            });
        }
        next(err);
    };
};

// Middleware de rate limiting simple
const rateLimit = (windowMs = 60 * 1000, maxRequests = 100) => {
    const requests = new Map();
    
    return (req, res, next) => {
        const key = req.ip;
        const now = Date.now();
        const windowStart = now - windowMs;
        
        const userRequests = requests.get(key) || [];
        const recentRequests = userRequests.filter(timestamp => timestamp > windowStart);
        
        if (recentRequests.length >= maxRequests) {
            return res.status(429).json({
                success: false,
                error: {
                    code: 'RATE_LIMIT_EXCEEDED',
                    message: `Trop de requêtes. Limite: ${maxRequests} par ${windowMs / 1000} secondes.`
                }
            });
        }
        
        recentRequests.push(now);
        requests.set(key, recentRequests);
        
        next();
    };
};

module.exports = {
    notFound,
    errorHandler,
    AppError,
    asyncHandler,
    requestSizeLimit,
    rateLimit
};