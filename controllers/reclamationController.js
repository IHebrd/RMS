const db = require('../config/database');
const Reclamation = require('../models/Reclamation');
const ReclamationOrganization = require('../models/ReclamationOrganization');
const StatusHistory = require('../models/StatusHistory');
const { sendEmail, emailTemplates } = require('../services/emailService');

// ==================== ADMIN - GESTION GLOBALE ====================

// @desc    Liste de toutes les réclamations (admin)
// @route   GET /api/reclamations
// @access  Private (Admin only)
const getAllReclamations = async (req, res) => {
    try {
        const { status, type, urgency, user_id, start_date, end_date, page = 1, limit = 20 } = req.query;
        
        const filters = {
            status,
            type,
            urgency,
            user_id,
            start_date,
            end_date,
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit)
        };
        
        const reclamations = await Reclamation.findAll(filters);
        const total = await Reclamation.count(filters);
        
        res.status(200).json({
            success: true,
            data: {
                reclamations,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });
        
    } catch (error) {
        console.error('Get all reclamations error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la récupération des réclamations'
            }
        });
    }
};

// @desc    Détail d'une réclamation (admin)
// @route   GET /api/reclamations/:id
// @access  Private (Admin only)
const getReclamationById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const reclamation = await Reclamation.findById(id);
        
        if (!reclamation) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Réclamation non trouvée'
                }
            });
        }
        
        const organizations = await ReclamationOrganization.findByReclamation(id);
        const history = await StatusHistory.findByReclamation(id);
        
        res.status(200).json({
            success: true,
            data: {
                ...reclamation,
                organizations,
                status_history: history
            }
        });
        
    } catch (error) {
        console.error('Get reclamation by id error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la récupération de la réclamation'
            }
        });
    }
};

// @desc    Supprimer une réclamation (admin)
// @route   DELETE /api/reclamations/:id
// @access  Private (Admin only)
const deleteReclamation = async (req, res) => {
    try {
        const { id } = req.params;
        
        const reclamation = await Reclamation.findById(id);
        
        if (!reclamation) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Réclamation non trouvée'
                }
            });
        }
        
        await Reclamation.delete(id);
        
        res.status(200).json({
            success: true,
            message: 'Réclamation supprimée avec succès'
        });
        
    } catch (error) {
        console.error('Delete reclamation error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la suppression de la réclamation'
            }
        });
    }
};

// @desc    Statistiques des réclamations
// @route   GET /api/reclamations/stats
// @access  Private (Admin only)
const getReclamationStats = async (req, res) => {
    try {
        const [statsResult, byTypeResult] = await Promise.all([
            db.query(`
                SELECT
                    COUNT(*) as total,
                    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
                    COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
                    COUNT(CASE WHEN status = 'validated' THEN 1 END) as validated,
                    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
                    COUNT(CASE WHEN status = 'archived' THEN 1 END) as archived
                FROM reclamations
            `),
            db.query(`
                SELECT type, COUNT(*) as count
                FROM reclamations
                GROUP BY type
                ORDER BY count DESC
            `)
        ]);

        res.status(200).json({
            success: true,
            data: {
                ...statsResult.rows[0],
                by_type: byTypeResult.rows
            }
        });
        
    } catch (error) {
        console.error('Get reclamation stats error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la récupération des statistiques'
            }
        });
    }
};

module.exports = {
    getAllReclamations,
    getReclamationById,
    deleteReclamation,
    getReclamationStats
};