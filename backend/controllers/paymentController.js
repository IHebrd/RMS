const db = require('../config/database');
const PaymentDistribution = require('../models/PaymentDistribution');
const PaymentItem = require('../models/PaymentItem');
const Employer = require('../models/Employer');
const Reclamation = require('../models/Reclamation');
const ReclamationOrganization = require('../models/ReclamationOrganization');

// ==================== ADMIN - GESTION GLOBALE ====================

// @desc    Liste de toutes les distributions de paiement
// @route   GET /api/payments/distributions
// @access  Private (Admin only)
const getAllDistributions = async (req, res) => {
    try {
        const { start_date, end_date, page = 1, limit = 20 } = req.query;
        
        const filters = {
            start_date,
            end_date,
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit)
        };
        
        const distributions = await PaymentDistribution.findAll(filters);
        const total = await db.query('SELECT COUNT(*) FROM payment_distributions');
        
        res.status(200).json({
            success: true,
            data: {
                distributions,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: parseInt(total.rows[0].count),
                    pages: Math.ceil(parseInt(total.rows[0].count) / parseInt(limit))
                }
            }
        });
        
    } catch (error) {
        console.error('Get all distributions error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la récupération des distributions'
            }
        });
    }
};

// @desc    Détail d'une distribution
// @route   GET /api/payments/distributions/:id
// @access  Private (Admin only)
const getDistributionById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const distribution = await PaymentDistribution.findById(id);
        
        if (!distribution) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Distribution non trouvée'
                }
            });
        }
        
        const items = await PaymentItem.findByDistribution(id);
        
        res.status(200).json({
            success: true,
            data: {
                ...distribution,
                items
            }
        });
        
    } catch (error) {
        console.error('Get distribution by id error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la récupération de la distribution'
            }
        });
    }
};

// @desc    Supprimer une distribution
// @route   DELETE /api/payments/distributions/:id
// @access  Private (Admin only)
const deleteDistribution = async (req, res) => {
    try {
        const { id } = req.params;
        
        const distribution = await PaymentDistribution.findById(id);
        
        if (!distribution) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Distribution non trouvée'
                }
            });
        }
        
        await PaymentDistribution.delete(id);
        
        res.status(200).json({
            success: true,
            message: 'Distribution supprimée avec succès'
        });
        
    } catch (error) {
        console.error('Delete distribution error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la suppression de la distribution'
            }
        });
    }
};

// @desc    Statistiques des paiements
// @route   GET /api/payments/stats
// @access  Private (Admin only)
const getPaymentStats = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                COUNT(DISTINCT pd.id) as total_distributions,
                COALESCE(SUM(pd.total_amount), 0) as total_amount_distributed,
                COUNT(DISTINCT pi.employer_id) as total_employers_paid,
                COUNT(DISTINCT ro.organization_id) as total_organizations
            FROM payment_distributions pd
            LEFT JOIN payment_items pi ON pd.id = pi.payment_distribution_id
            LEFT JOIN reclamation_organizations ro ON pd.reclamation_org_id = ro.id
        `);
        
        res.status(200).json({
            success: true,
            data: result.rows[0]
        });
        
    } catch (error) {
        console.error('Get payment stats error:', error);
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
    getAllDistributions,
    getDistributionById,
    deleteDistribution,
    getPaymentStats
};