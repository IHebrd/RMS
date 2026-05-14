const db = require('../config/database');
const Task = require('../models/Task');
const Proof = require('../models/Proof');
const StatusHistory = require('../models/StatusHistory');

// ==================== ADMIN - GESTION GLOBALE ====================

// @desc    Liste de toutes les tâches (admin)
// @route   GET /api/tasks
// @access  Private (Admin only)
const getAllTasks = async (req, res) => {
    try {
        const { status, employer_id, reclamation_id, page = 1, limit = 20 } = req.query;
        
        const filters = {
            status,
            employer_id,
            reclamation_id,
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit)
        };
        
        const tasks = await Task.findAll(filters);
        const total = await db.query('SELECT COUNT(*) FROM tasks');
        
        res.status(200).json({
            success: true,
            data: {
                tasks,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: parseInt(total.rows[0].count),
                    pages: Math.ceil(parseInt(total.rows[0].count) / parseInt(limit))
                }
            }
        });
        
    } catch (error) {
        console.error('Get all tasks error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la récupération des tâches'
            }
        });
    }
};

// @desc    Détail d'une tâche (admin)
// @route   GET /api/tasks/:id
// @access  Private (Admin only)
const getTaskById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const task = await Task.findById(id);
        
        if (!task) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Tâche non trouvée'
                }
            });
        }
        
        const proofs = await Proof.findByTask(id);
        const history = await StatusHistory.findByTask(id);
        
        res.status(200).json({
            success: true,
            data: {
                ...task,
                proofs,
                status_history: history
            }
        });
        
    } catch (error) {
        console.error('Get task by id error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la récupération de la tâche'
            }
        });
    }
};

// @desc    Supprimer une tâche (admin)
// @route   DELETE /api/tasks/:id
// @access  Private (Admin only)
const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        
        const task = await Task.findById(id);
        
        if (!task) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Tâche non trouvée'
                }
            });
        }
        
        await Task.delete(id);
        
        res.status(200).json({
            success: true,
            message: 'Tâche supprimée avec succès'
        });
        
    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la suppression de la tâche'
            }
        });
    }
};

module.exports = {
    getAllTasks,
    getTaskById,
    deleteTask
};