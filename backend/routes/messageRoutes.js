const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');

// Vérifier que les contrôleurs existent
let getAllMessages, deleteMessage, getMessagesByReclamation;

try {
    const messageController = require('../controllers/messageController');
    getAllMessages = messageController.getAllMessages;
    deleteMessage = messageController.deleteMessage;
    getMessagesByReclamation = messageController.getMessagesByReclamation;
} catch (error) {
    console.warn('⚠️ messageController non trouvé, création de fonctions temporaires');
    getAllMessages = (req, res) => res.status(501).json({ success: false, message: 'Non implémenté' });
    deleteMessage = (req, res) => res.status(501).json({ success: false, message: 'Non implémenté' });
    getMessagesByReclamation = (req, res) => res.status(501).json({ success: false, message: 'Non implémenté' });
}

// Routes protégées (admin uniquement)
router.use(protect);
router.use(authorize('admin'));

router.get('/', getAllMessages);
router.get('/reclamation/:reclamationId', getMessagesByReclamation);
router.delete('/:id', deleteMessage);

module.exports = router;