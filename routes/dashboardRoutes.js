const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');

// Vérifier que les contrôleurs existent
let getAdminDashboard, getGlobalStats, getTeamPerformance;

try {
    const dashboardController = require('../controllers/dashboardController');
    getAdminDashboard = dashboardController.getAdminDashboard;
    getGlobalStats = dashboardController.getGlobalStats;
    getTeamPerformance = dashboardController.getTeamPerformance;
} catch (error) {
    console.warn('⚠️ dashboardController non trouvé, création de fonctions temporaires');
    getAdminDashboard = (req, res) => res.status(501).json({ success: false, message: 'Non implémenté' });
    getGlobalStats = (req, res) => res.status(501).json({ success: false, message: 'Non implémenté' });
    getTeamPerformance = (req, res) => res.status(501).json({ success: false, message: 'Non implémenté' });
}

// Routes publiques (stats globales)
router.get('/stats', getGlobalStats);

// Routes protégées (admin uniquement)
router.get('/admin', protect, authorize('admin'), getAdminDashboard);

// Routes protégées (responsable uniquement)
router.get('/performance', protect, authorize('responsable'), getTeamPerformance);

module.exports = router;