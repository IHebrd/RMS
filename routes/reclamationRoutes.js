const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');

// Vérifier que les contrôleurs existent
let getAllReclamations, getReclamationById, deleteReclamation, getReclamationStats;

try {
    const reclamationController = require('../controllers/reclamationController');
    getAllReclamations = reclamationController.getAllReclamations;
    getReclamationById = reclamationController.getReclamationById;
    deleteReclamation = reclamationController.deleteReclamation;
    getReclamationStats = reclamationController.getReclamationStats;
} catch (error) {
    console.warn('⚠️ reclamationController non trouvé, création de fonctions temporaires');
    getAllReclamations = (req, res) => res.status(501).json({ success: false, message: 'Non implémenté' });
    getReclamationById = (req, res) => res.status(501).json({ success: false, message: 'Non implémenté' });
    deleteReclamation = (req, res) => res.status(501).json({ success: false, message: 'Non implémenté' });
    getReclamationStats = (req, res) => res.status(501).json({ success: false, message: 'Non implémenté' });
}

// Routes publiques (stats uniquement)
router.get('/stats', getReclamationStats);

// Routes protégées (admin uniquement)
router.use(protect);
router.use(authorize('admin'));

router.get('/', getAllReclamations);
router.get('/:id', getReclamationById);
router.delete('/:id', deleteReclamation);

module.exports = router;