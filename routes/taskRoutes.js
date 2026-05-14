const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');

// Vérifier que les contrôleurs existent
let getAllTasks, getTaskById, deleteTask;

try {
    const taskController = require('../controllers/taskController');
    getAllTasks = taskController.getAllTasks;
    getTaskById = taskController.getTaskById;
    deleteTask = taskController.deleteTask;
} catch (error) {
    console.warn('⚠️ taskController non trouvé, création de fonctions temporaires');
    getAllTasks = (req, res) => res.status(501).json({ success: false, message: 'Non implémenté' });
    getTaskById = (req, res) => res.status(501).json({ success: false, message: 'Non implémenté' });
    deleteTask = (req, res) => res.status(501).json({ success: false, message: 'Non implémenté' });
}

// Toutes les routes nécessitent authentification et rôle admin
router.use(protect);
router.use(authorize('admin'));

router.get('/', getAllTasks);
router.get('/:id', getTaskById);
router.delete('/:id', deleteTask);

module.exports = router;