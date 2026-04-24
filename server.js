// =====================================================
// RMS BACKEND - SERVER.JS
// Reclamation Management System API
// =====================================================

require('express-async-errors');
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

// Import des configurations
const { testConnection, getDatabaseStats } = require('./config/database');
const { initTransporter } = require('./config/email');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

// Import des routes
const routes = require('./routes');

// Initialisation de l'application Express
const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// =====================================================
// MIDDLEWARES DE SÉCURITÉ ET PERFORMANCE
// =====================================================

// Helmet - Sécurité des headers HTTP
app.use(helmet({
    contentSecurityPolicy: isProduction,
    crossOriginEmbedderPolicy: isProduction,
}));

// CORS - Cross-Origin Resource Sharing
const corsOptions = {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
    credentials: process.env.CORS_CREDENTIALS === 'true',
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Compression - Gzip compression
app.use(compression());

// Morgan - Logging HTTP
if (!isProduction) {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined', {
        stream: fs.createWriteStream(path.join(__dirname, 'logs', 'access.log'), { flags: 'a' })
    }));
}

// Rate Limiting - Protection contre les attaques par force brute
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limite par IP
    message: {
        success: false,
        error: {
            code: 'TOO_MANY_REQUESTS',
            message: 'Trop de requêtes, veuillez réessayer plus tard.'
        }
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', limiter);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Fichiers statiques (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// =====================================================
// HEADERS PERSONNALISÉS
// =====================================================

app.use((req, res, next) => {
    res.setHeader('X-Powered-By', 'RMS API');
    res.setHeader('X-API-Version', process.env.API_VERSION || '1.0.0');
    next();
});

// =====================================================
// MAINTENANCE MODE
// =====================================================

app.use((req, res, next) => {
    if (process.env.MAINTENANCE_MODE === 'true') {
        return res.status(503).json({
            success: false,
            error: {
                code: 'MAINTENANCE_MODE',
                message: process.env.MAINTENANCE_MESSAGE || 'Le système est en maintenance. Veuillez réessayer plus tard.'
            }
        });
    }
    next();
});

// =====================================================
// ROUTES API
// =====================================================

// Route de santé (health check)
app.get('/health', async (req, res) => {
    const dbConnected = await testConnection();
    
    res.status(200).json({
        success: true,
        message: 'RMS API is running',
        version: process.env.API_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        database: {
            connected: dbConnected,
            name: process.env.DB_NAME
        },
        uptime: process.uptime()
    });
});

// Route d'information (sans authentification)
app.get('/api/info', (req, res) => {
    res.status(200).json({
        success: true,
        data: {
            name: process.env.APP_NAME || 'RMS Backend',
            version: process.env.API_VERSION || '1.0.0',
            description: 'Reclamation Management System API',
            endpoints: {
                auth: '/api/auth',
                admin: '/api/admin',
                responsable: '/api/responsable',
                employer: '/api/employer',
                user: '/api/user',
                dashboard: '/api/dashboard'
            },
            documentation: '/api/docs'
        }
    });
});

// Routes principales
app.use('/api', routes);

// Route 404 pour les routes non trouvées
app.use(notFound);

// Middleware de gestion d'erreurs (doit être le dernier)
app.use(errorHandler);

// =====================================================
// DÉMARRAGE DU SERVEUR
// =====================================================

const startServer = async () => {
    try {
        // Tester la connexion à la base de données
        console.log('🔌 Vérification de la connexion à la base de données...');
        const dbConnected = await testConnection();
        
        if (!dbConnected) {
            console.error('❌ Impossible de se connecter à la base de données. Arrêt du serveur.');
            process.exit(1);
        }
        
        // Afficher les statistiques de la base
        if (!isProduction) {
            const stats = await getDatabaseStats();
            console.log('📊 Statistiques base de données:');
            console.log(`   - Tables: ${Object.keys(stats.tables).length}`);
            console.log(`   - Taille totale: ${stats.totalSizePretty}`);
            console.log(`   - Utilisateurs: ${stats.counts?.users || 0}`);
            console.log(`   - Réclamations: ${stats.counts?.reclamations || 0}`);
        }
        
        // Initialiser le service email
        console.log('📧 Initialisation du service email...');
        initTransporter();
        
        // Démarrer le serveur
        app.listen(PORT, () => {
            console.log('='.repeat(60));
            console.log(`🚀 Serveur RMS démarré avec succès !`);
            console.log(`📡 Environnement: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🌐 URL: http://localhost:${PORT}`);
            console.log(`📚 API: http://localhost:${PORT}/api`);
            console.log(`❤️  Health: http://localhost:${PORT}/health`);
            console.log('='.repeat(60));
        });
        
    } catch (error) {
        console.error('❌ Erreur lors du démarrage du serveur:', error.message);
        process.exit(1);
    }
};

// Gestion des signaux d'arrêt
process.on('SIGINT', () => {
    console.log('🛑 Arrêt du serveur...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('🛑 Arrêt du serveur...');
    process.exit(0);
});

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
    console.error('❌ Erreur non capturée:', error);
    process.exit(1);
});

process.on('unhandledRejection', (error) => {
    console.error('❌ Promesse rejetée non gérée:', error);
    process.exit(1);
});

// Démarrer le serveur
startServer();

// Export pour les tests
module.exports = app;