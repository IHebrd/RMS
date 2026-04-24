const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Responsable = require('../models/Responsable');
const Employer = require('../models/Employer');
const User = require('../models/User');

// Map des tables vers leurs modèles et rôles
const modelMap = {
    admin: { model: Admin, role: 'admin' },
    responsable: { model: Responsable, role: 'responsable' },
    employer: { model: Employer, role: 'employer' },
    user: { model: User, role: 'user' }
};

// Middleware de protection - vérifie le token JWT
const protect = async (req, res, next) => {
    try {
        let token;

        // Vérifier si le token est dans le header Authorization
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'NO_TOKEN',
                    message: 'Accès non autorisé. Token manquant.'
                }
            });
        }

        // Vérifier le token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Récupérer l'utilisateur depuis la bonne table
        const userInfo = modelMap[decoded.role];
        if (!userInfo) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_ROLE',
                    message: 'Rôle utilisateur invalide'
                }
            });
        }

        const user = await userInfo.model.findById(decoded.id);

        if (!user) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'USER_NOT_FOUND',
                    message: 'Utilisateur non trouvé'
                }
            });
        }

        if (!user.is_active) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'ACCOUNT_INACTIVE',
                    message: 'Votre compte est désactivé. Veuillez contacter l\'administrateur.'
                }
            });
        }

        // Ajouter les informations utilisateur à la requête
        req.user = user;
        req.userId = user.id;
        req.userRole = decoded.role;
        req.userTable = decoded.table;

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_TOKEN',
                    message: 'Token invalide'
                }
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'TOKEN_EXPIRED',
                    message: 'Token expiré. Veuillez vous reconnecter.'
                }
            });
        }
        
        console.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de l\'authentification'
            }
        });
    }
};

// Middleware d'autorisation - vérifie le rôle
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.userRole)) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: `Accès refusé. Rôle ${req.userRole} non autorisé. Rôles requis: ${roles.join(', ')}`
                }
            });
        }
        next();
    };
};

// Middleware pour vérifier l'appartenance à une organisation
const checkOrganizationAccess = async (req, res, next) => {
    try {
        const { organizationId } = req.params;
        
        if (req.userRole === 'admin') {
            return next();
        }
        
        if (req.userRole === 'responsable' && req.user.organization_id != organizationId) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Vous n\'avez pas accès à cette organisation'
                }
            });
        }
        
        if (req.userRole === 'employer') {
            const employer = await Employer.findById(req.userId);
            if (employer.organization_id != organizationId) {
                return res.status(403).json({
                    success: false,
                    error: {
                        code: 'FORBIDDEN',
                        message: 'Vous n\'avez pas accès à cette organisation'
                    }
                });
            }
        }
        
        next();
    } catch (error) {
        console.error('Check organization access error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la vérification des droits'
            }
        });
    }
};

module.exports = {
    protect,
    authorize,
    checkOrganizationAccess
};