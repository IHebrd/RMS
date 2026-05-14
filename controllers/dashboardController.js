const db = require('../config/database');

// ==================== ADMIN DASHBOARD ====================

// @desc    Dashboard administrateur
// @route   GET /api/dashboard/admin
// @access  Private (Admin only)
const getAdminDashboard = async (req, res) => {
    try {
        // Statistiques globales
        const globalStats = await db.query(`
            SELECT 
                (SELECT COUNT(*) FROM "user") as total_users,
                (SELECT COUNT(*) FROM responsable) as total_responsables,
                (SELECT COUNT(*) FROM employer) as total_employers,
                (SELECT COUNT(*) FROM organizations) as total_organizations,
                (SELECT COUNT(*) FROM reclamations) as total_reclamations,
                (SELECT COUNT(*) FROM reclamations WHERE status = 'validated') as validated_reclamations,
                (SELECT COUNT(*) FROM reclamations WHERE status = 'pending') as pending_reclamations,
                (SELECT COUNT(*) FROM reclamations WHERE status = 'in_progress') as in_progress_reclamations
        `);
        
        // Réclamations par type
        const reclamationsByType = await db.query(`
            SELECT type, COUNT(*) as count
            FROM reclamations
            GROUP BY type
            ORDER BY count DESC
        `);
        
        // Réclamations par gouvernorat
        const reclamationsByGovernorate = await db.query(`
            SELECT u.governorate, COUNT(*) as count
            FROM reclamations r
            JOIN "user" u ON r.user_id = u.id
            WHERE u.governorate IS NOT NULL
            GROUP BY u.governorate
            ORDER BY count DESC
            LIMIT 10
        `);
        
        // Top organisations
        const topOrganizations = await db.query(`
            SELECT o.name, COUNT(ro.reclamation_id) as reclamations
            FROM organizations o
            LEFT JOIN reclamation_organizations ro ON o.id = ro.organization_id
            GROUP BY o.id
            ORDER BY reclamations DESC
            LIMIT 10
        `);
        
        // Activités récentes
        const recentActivities = await db.query(`
            SELECT 
                'Réclamation créée' as action,
                u.first_name || ' ' || u.last_name as user_name,
                r.reference,
                r.created_at as timestamp
            FROM reclamations r
            JOIN "user" u ON r.user_id = u.id
            ORDER BY r.created_at DESC
            LIMIT 10
        `);
        
        res.status(200).json({
            success: true,
            data: {
                global_stats: globalStats.rows[0],
                reclamations_by_type: reclamationsByType.rows,
                reclamations_by_governorate: reclamationsByGovernorate.rows,
                top_organizations: topOrganizations.rows,
                recent_activities: recentActivities.rows
            }
        });
        
    } catch (error) {
        console.error('Get admin dashboard error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la récupération du tableau de bord'
            }
        });
    }
};

// ==================== STATISTIQUES GLOBALES ====================

// @desc    Statistiques globales avec filtres
// @route   GET /api/dashboard/stats
// @access  Private (Admin/Responsable)
const getGlobalStats = async (req, res) => {
    try {
        const { start_date, end_date, organization_id } = req.query;
        
        let dateFilter = '';
        let orgFilter = '';
        const values = [];
        let idx = 1;
        
        if (start_date && end_date) {
            dateFilter = ` AND r.created_at BETWEEN $${idx} AND $${idx + 1}`;
            values.push(start_date, end_date);
            idx += 2;
        }
        
        if (organization_id) {
            orgFilter = ` AND ro.organization_id = $${idx}`;
            values.push(organization_id);
            idx++;
        }
        
        // Réclamations par jour
        const timeline = await db.query(`
            SELECT DATE(r.created_at) as date, COUNT(*) as count
            FROM reclamations r
            LEFT JOIN reclamation_organizations ro ON r.id = ro.reclamation_id
            WHERE 1=1 ${dateFilter} ${orgFilter}
            GROUP BY DATE(r.created_at)
            ORDER BY date ASC
        `, values);
        
        // Temps moyen de résolution
        const avgResolution = await db.query(`
            SELECT AVG(EXTRACT(EPOCH FROM (sh.changed_at - r.created_at))/3600) as avg_hours
            FROM status_history sh
            JOIN reclamations r ON sh.reclamation_id = r.id
            WHERE sh.new_status = 'validated'
            AND sh.reclamation_id IS NOT NULL
            ${start_date && end_date ? `AND r.created_at BETWEEN $1 AND $2` : ''}
        `, start_date && end_date ? [start_date, end_date] : []);
        
        // Taux de satisfaction (basé sur les validations)
        const satisfaction = await db.query(`
            SELECT 
                COUNT(CASE WHEN status = 'validated' THEN 1 END) as validated,
                COUNT(*) as total,
                ROUND(COUNT(CASE WHEN status = 'validated' THEN 1 END)::numeric / NULLIF(COUNT(*), 0) * 100, 2) as rate
            FROM reclamations
            WHERE status != 'archived'
            ${start_date && end_date ? `AND created_at BETWEEN $1 AND $2` : ''}
        `, start_date && end_date ? [start_date, end_date] : []);
        
        res.status(200).json({
            success: true,
            data: {
                period: { start: start_date || null, end: end_date || null },
                reclamations_timeline: timeline.rows,
                average_resolution_time: avgResolution.rows[0]?.avg_hours ? `${parseFloat(avgResolution.rows[0].avg_hours).toFixed(1)} hours` : 'N/A',
                satisfaction_rate: parseFloat(satisfaction.rows[0]?.rate || 0),
                urgent_reclamations: 0 // À calculer
            }
        });
        
    } catch (error) {
        console.error('Get global stats error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la récupération des statistiques'
            }
        });
    }
};

// ==================== PERFORMANCE DES ÉQUIPES ====================

// @desc    Performance des équipes
// @route   GET /api/dashboard/performance
// @access  Private (Responsable)
const getTeamPerformance = async (req, res) => {
    try {
        const organizationId = req.user?.organization_id;
        
        if (!organizationId) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Accès réservé aux responsables'
                }
            });
        }
        
        // Performance par employé
        const employeePerformance = await db.query(`
            SELECT 
                e.id,
                e.first_name || ' ' || e.last_name as name,
                COUNT(t.id) as total_tasks,
                COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
                COUNT(CASE WHEN t.status = 'failed' THEN 1 END) as failed_tasks,
                ROUND(COUNT(CASE WHEN t.status = 'completed' THEN 1 END)::numeric / NULLIF(COUNT(t.id), 0) * 100, 2) as completion_rate,
                COALESCE(SUM(pi.amount), 0) as total_earned
            FROM employer e
            LEFT JOIN tasks t ON e.id = t.employer_id
            LEFT JOIN payment_items pi ON e.id = pi.employer_id
            WHERE e.organization_id = $1
            GROUP BY e.id
            ORDER BY completion_rate DESC
        `, [organizationId]);
        
        // Temps moyen de complétion des tâches
        const avgCompletionTime = await db.query(`
            SELECT 
                AVG(EXTRACT(EPOCH FROM (t.completed_at - t.created_at))/3600) as avg_hours
            FROM tasks t
            JOIN employer e ON t.employer_id = e.id
            WHERE e.organization_id = $1
            AND t.status = 'completed'
            AND t.completed_at IS NOT NULL
        `, [organizationId]);
        
        res.status(200).json({
            success: true,
            data: {
                employee_performance: employeePerformance.rows,
                average_completion_time: avgCompletionTime.rows[0]?.avg_hours ? `${parseFloat(avgCompletionTime.rows[0].avg_hours).toFixed(1)} hours` : 'N/A'
            }
        });
        
    } catch (error) {
        console.error('Get team performance error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la récupération des performances'
            }
        });
    }
};

module.exports = {
    getAdminDashboard,
    getGlobalStats,
    getTeamPerformance
};