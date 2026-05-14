const db = require('../config/database');
const ReclamationMessage = require('../models/ReclamationMessage');
const ReclamationOrganization = require('../models/ReclamationOrganization');

// ==================== ADMIN - GESTION GLOBALE ====================

// @desc    Liste de tous les messages
// @route   GET /api/messages
// @access  Private (Admin only)
const getAllMessages = async (req, res) => {
    try {
        const { reclamation_org_id, sender_type, page = 1, limit = 20 } = req.query;
        
        const filters = {
            reclamation_org_id,
            sender_type,
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit)
        };
        
        const messages = await ReclamationMessage.findAll(filters);
        const total = await db.query('SELECT COUNT(*) FROM reclamation_messages');
        
        res.status(200).json({
            success: true,
            data: {
                messages,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: parseInt(total.rows[0].count),
                    pages: Math.ceil(parseInt(total.rows[0].count) / parseInt(limit))
                }
            }
        });
        
    } catch (error) {
        console.error('Get all messages error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la récupération des messages'
            }
        });
    }
};

// @desc    Supprimer un message (admin)
// @route   DELETE /api/messages/:id
// @access  Private (Admin only)
const deleteMessage = async (req, res) => {
    try {
        const { id } = req.params;
        
        const message = await ReclamationMessage.findById(id);
        
        if (!message) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Message non trouvé'
                }
            });
        }
        
        await ReclamationMessage.delete(id);
        
        res.status(200).json({
            success: true,
            message: 'Message supprimé avec succès'
        });
        
    } catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la suppression du message'
            }
        });
    }
};

// @desc    Messages par réclamation
// @route   GET /api/messages/reclamation/:reclamationId
// @access  Private (Admin/Responsable)
const getMessagesByReclamation = async (req, res) => {
    try {
        const { reclamationId } = req.params;
        
        const reclamationOrgs = await ReclamationOrganization.findByReclamation(reclamationId);
        
        if (reclamationOrgs.length === 0) {
            return res.status(200).json({
                success: true,
                data: { messages: [] }
            });
        }
        
        const messages = await ReclamationMessage.findByReclamationOrg(reclamationOrgs[0].id);
        
        res.status(200).json({
            success: true,
            data: { messages }
        });
        
    } catch (error) {
        console.error('Get messages by reclamation error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la récupération des messages'
            }
        });
    }
};

module.exports = {
    getAllMessages,
    deleteMessage,
    getMessagesByReclamation
};