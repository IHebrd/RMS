const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');

// Vérifier que les contrôleurs existent
let getAllDistributions, getDistributionById, deleteDistribution, getPaymentStats;

try {
    const paymentController = require('../controllers/paymentController');
    getAllDistributions = paymentController.getAllDistributions;
    getDistributionById = paymentController.getDistributionById;
    deleteDistribution = paymentController.deleteDistribution;
    getPaymentStats = paymentController.getPaymentStats;
} catch (error) {
    console.warn('⚠️ paymentController non trouvé, création de fonctions temporaires');
    getAllDistributions = (req, res) => res.status(501).json({ success: false, message: 'Non implémenté' });
    getDistributionById = (req, res) => res.status(501).json({ success: false, message: 'Non implémenté' });
    deleteDistribution = (req, res) => res.status(501).json({ success: false, message: 'Non implémenté' });
    getPaymentStats = (req, res) => res.status(501).json({ success: false, message: 'Non implémenté' });
}

// Routes publiques (stats)
router.get('/stats', getPaymentStats);

// Routes protégées (admin uniquement)
router.use(protect);
router.use(authorize('admin'));

router.get('/distributions', getAllDistributions);
router.get('/distributions/:id', getDistributionById);
router.delete('/distributions/:id', deleteDistribution);

module.exports = router;