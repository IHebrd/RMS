const db = require('../config/database');
const Proof = require('../models/Proof');
const Task = require('../models/Task');
const Employer = require('../models/Employer');
const ReclamationOrganization = require('../models/ReclamationOrganization');

// ==================== ADMIN - GESTION GLOBALE ====================

// @desc    Liste de toutes les preuves (admin)
// @route   GET /api/proofs
// @access  Private (Admin only)
const getAllProofs = async (req, res) => {
    try {
        const { task_id, file_type, page = 1, limit = 20 } = req.query;
        
        const filters = {
            task_id: task_id ? parseInt(task_id) : undefined,
            file_type,
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit)
        };
        
        const proofs = await Proof.findAll(filters);
        
        // Compter le total
        let countQuery = `SELECT COUNT(*) FROM proofs WHERE 1=1`;
        const countValues = [];
        let idx = 1;
        
        if (task_id) {
            countQuery += ` AND task_id = $${idx++}`;
            countValues.push(parseInt(task_id));
        }
        if (file_type) {
            countQuery += ` AND file_type = $${idx++}`;
            countValues.push(file_type);
        }
        
        const totalResult = await db.query(countQuery, countValues);
        const total = parseInt(totalResult.rows[0].count);
        
        res.status(200).json({
            success: true,
            data: {
                proofs,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });
        
    } catch (error) {
        console.error('Get all proofs error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la récupération des preuves'
            }
        });
    }
};

// @desc    Détail d'une preuve
// @route   GET /api/proofs/:id
// @access  Private (Admin only)
const getProofById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const proof = await Proof.findById(parseInt(id));
        
        if (!proof) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Preuve non trouvée'
                }
            });
        }
        
        res.status(200).json({
            success: true,
            data: proof
        });
        
    } catch (error) {
        console.error('Get proof by id error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la récupération de la preuve'
            }
        });
    }
};

// @desc    Supprimer une preuve (admin)
// @route   DELETE /api/proofs/:id
// @access  Private (Admin only)
const deleteProof = async (req, res) => {
    try {
        const { id } = req.params;
        
        const proof = await Proof.findById(parseInt(id));
        
        if (!proof) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Preuve non trouvée'
                }
            });
        }
        
        await Proof.delete(parseInt(id));
        
        res.status(200).json({
            success: true,
            message: 'Preuve supprimée avec succès'
        });
        
    } catch (error) {
        console.error('Delete proof error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la suppression de la preuve'
            }
        });
    }
};

// @desc    Preuves par tâche
// @route   GET /api/proofs/task/:taskId
// @access  Private (Admin/Responsable)
const getProofsByTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        
        // Vérifier que la tâche existe
        const task = await Task.findById(parseInt(taskId));
        
        if (!task) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Tâche non trouvée'
                }
            });
        }
        
        // Vérifier les droits d'accès
        if (req.userRole === 'responsable') {
            const employer = await Employer.findById(task.employer_id);
            if (employer && employer.organization_id !== req.user.organization_id) {
                return res.status(403).json({
                    success: false,
                    error: {
                        code: 'FORBIDDEN',
                        message: 'Vous n\'avez pas accès à cette tâche'
                    }
                });
            }
        }
        
        if (req.userRole === 'employer' && task.employer_id !== req.userId) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Vous n\'avez pas accès à cette tâche'
                }
            });
        }
        
        const proofs = await Proof.findByTask(parseInt(taskId));
        
        res.status(200).json({
            success: true,
            data: { proofs }
        });
        
    } catch (error) {
        console.error('Get proofs by task error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la récupération des preuves'
            }
        });
    }
};

// ==================== RESPONSABLE - GESTION ====================

// @desc    Preuves par réclamation (pour responsable)
// @route   GET /api/proofs/reclamation/:reclamationId
// @access  Private (Responsable only)
const getProofsByReclamation = async (req, res) => {
    try {
        const { reclamationId } = req.params;
        const organizationId = req.user.organization_id;
        
        // Vérifier que la réclamation appartient à l'organisation
        const orgs = await ReclamationOrganization.findAll({
            reclamation_id: reclamationId,
            organization_id: organizationId
        });
        const reclamationOrg = orgs[0] || null;

        if (!reclamationOrg && req.userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Vous n\'avez pas accès à cette réclamation'
                }
            });
        }
        
        // Récupérer toutes les tâches de la réclamation et leurs preuves
        const result = await db.query(
            `SELECT t.id as task_id, t.description, 
                    json_agg(jsonb_build_object('id', p.id, 'file_path', p.file_path, 'file_type', p.file_type, 'description', p.description, 'uploaded_at', p.uploaded_at)) as proofs
             FROM tasks t
             LEFT JOIN proofs p ON t.id = p.task_id
             JOIN reclamation_organizations ro ON t.reclamation_org_id = ro.id
             WHERE ro.reclamation_id = $1 AND ro.organization_id = $2
             GROUP BY t.id
             ORDER BY t.created_at ASC`,
            [reclamationId, organizationId]
        );
        
        res.status(200).json({
            success: true,
            data: { tasks: result.rows }
        });
        
    } catch (error) {
        console.error('Get proofs by reclamation error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la récupération des preuves'
            }
        });
    }
};

// ==================== EMPLOYÉ - GESTION ====================

// @desc    Upload de preuves pour une tâche (employé)
// @route   POST /api/employer/tasks/:id/proofs
// @access  Private (Employer only)
const uploadTaskProofs = async (req, res) => {
    try {
        const { id } = req.params;
        const { description } = req.body;
        const employerId = req.userId;
        
        // Vérifier que la tâche appartient à l'employé
        const task = await Task.findById(parseInt(id));
        
        if (!task) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Tâche non trouvée'
                }
            });
        }
        
        if (task.employer_id !== employerId) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Cette tâche ne vous est pas assignée'
                }
            });
        }
        
        // Vérifier que des fichiers ont été uploadés
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'NO_FILES',
                    message: 'Aucun fichier uploadé'
                }
            });
        }
        
        // Limiter le nombre de preuves par tâche
        const existingProofsCount = await Proof.countByTask(parseInt(id));
        const maxProofs = parseInt(process.env.MAX_PROOFS_PER_TASK) || 10;
        
        if (existingProofsCount + req.files.length > maxProofs) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'TOO_MANY_PROOFS',
                    message: `Nombre maximum de preuves par tâche: ${maxProofs}`
                }
            });
        }
        
        // Créer les preuves
        const proofsData = req.files.map(file => ({
            path: file.path.replace(/\\/g, '/'),
            type: file.mimetype.startsWith('image/') ? 'image' : 'video',
            description: description || null
        }));
        
        const proofs = await Proof.createMultiple(
            parseInt(id),
            proofsData,
            employerId,
            'employer'
        );
        
        res.status(201).json({
            success: true,
            message: `${proofs.length} preuve(s) ajoutée(s) avec succès`,
            data: { proofs }
        });
        
    } catch (error) {
        console.error('Upload proofs error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de l\'upload des preuves'
            }
        });
    }
};

// @desc    Supprimer une preuve (employé)
// @route   DELETE /api/employer/proofs/:id
// @access  Private (Employer only)
const deleteEmployerProof = async (req, res) => {
    try {
        const { id } = req.params;
        const employerId = req.userId;
        
        const proof = await Proof.findById(parseInt(id));
        
        if (!proof) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Preuve non trouvée'
                }
            });
        }
        
        // Vérifier que la preuve appartient à l'employé
        if (proof.uploaded_by !== employerId || proof.uploaded_by_type !== 'employer') {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Vous ne pouvez pas supprimer cette preuve'
                }
            });
        }
        
        // Vérifier que la tâche n'est pas déjà terminée
        const task = await Task.findById(proof.task_id);
        if (task && task.status === 'completed') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'TASK_COMPLETED',
                    message: 'Impossible de supprimer une preuve d\'une tâche terminée'
                }
            });
        }
        
        const deleted = await Proof.delete(parseInt(id));
        
        res.status(200).json({
            success: true,
            message: 'Preuve supprimée',
            data: deleted
        });
        
    } catch (error) {
        console.error('Delete proof error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la suppression de la preuve'
            }
        });
    }
};

// ==================== RESPONSABLE - VALIDATION ====================

// @desc    Valider les preuves d'une tâche (responsable)
// @route   PUT /api/responsable/tasks/:id/proofs/validate
// @access  Private (Responsable only)
const validateTaskProofs = async (req, res) => {
    try {
        const { id } = req.params;
        const { isValid, comment } = req.body;
        const organizationId = req.user.organization_id;
        const responsableId = req.userId;
        
        // Vérifier que la tâche appartient à l'organisation
        const task = await Task.findById(parseInt(id));
        
        if (!task) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Tâche non trouvée'
                }
            });
        }
        
        const employer = await Employer.findById(task.employer_id);
        if (employer.organization_id !== organizationId) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Vous n\'avez pas accès à cette tâche'
                }
            });
        }
        
        // Récupérer les preuves
        const proofs = await Proof.findByTask(parseInt(id));
        
        if (proofs.length === 0 && !isValid) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'NO_PROOFS',
                    message: 'Aucune preuve à valider'
                }
            });
        }
        
        // Mettre à jour le statut de la tâche
        const StatusHistory = require('../models/StatusHistory');
        const status = isValid ? 'completed' : 'failed';
        const completedAt = isValid ? new Date() : null;
        
        const updatedTask = await Task.updateStatus(parseInt(id), status, completedAt);
        
        // Enregistrer dans l'historique
        await StatusHistory.create({
            task_id: parseInt(id),
            old_status: task.status,
            new_status: status,
            changed_by_type: 'responsable',
            changed_by_id: responsableId,
            comment: comment || (isValid ? 'Preuves validées' : 'Preuves rejetées')
        });
        
        // Vérifier si toutes les tâches de la réclamation sont terminées
        const allTasks = await Task.findByReclamationOrg(task.reclamation_org_id);
        const allCompleted = allTasks.every(t => t.status === 'completed');
        
        if (allCompleted) {
            const ReclamationOrganization = require('../models/ReclamationOrganization');
            await ReclamationOrganization.updateStatus(task.reclamation_org_id, 'validated');
            
            await StatusHistory.create({
                reclamation_org_id: task.reclamation_org_id,
                old_status: 'in_progress',
                new_status: 'validated',
                changed_by_type: 'responsable',
                changed_by_id: responsableId,
                comment: 'Toutes les tâches sont terminées'
            });
        }
        
        res.status(200).json({
            success: true,
            message: isValid ? 'Tâche validée avec succès' : 'Tâche rejetée',
            data: {
                task: updatedTask,
                proofs_validated: isValid,
                comment
            }
        });
        
    } catch (error) {
        console.error('Validate task proofs error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la validation des preuves'
            }
        });
    }
};

// ==================== STATISTIQUES ====================

// @desc    Statistiques des preuves
// @route   GET /api/proofs/stats
// @access  Private (Admin only)
const getProofStats = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                COUNT(*) as total_proofs,
                COUNT(CASE WHEN file_type = 'image' THEN 1 END) as total_images,
                COUNT(CASE WHEN file_type = 'video' THEN 1 END) as total_videos,
                COUNT(DISTINCT task_id) as tasks_with_proofs,
                COUNT(CASE WHEN uploaded_by_type = 'employer' THEN 1 END) as proofs_by_employers,
                COUNT(CASE WHEN uploaded_by_type = 'responsable' THEN 1 END) as proofs_by_responsables,
                DATE_TRUNC('month', uploaded_at) as month
            FROM proofs
            GROUP BY DATE_TRUNC('month', uploaded_at)
            ORDER BY month DESC
            LIMIT 12
        `);
        
        // Statistiques par organisation
        const orgStats = await db.query(`
            SELECT 
                o.name as organization_name,
                COUNT(p.id) as total_proofs
            FROM proofs p
            JOIN tasks t ON p.task_id = t.id
            JOIN reclamation_organizations ro ON t.reclamation_org_id = ro.id
            JOIN organizations o ON ro.organization_id = o.id
            GROUP BY o.id
            ORDER BY total_proofs DESC
        `);
        
        res.status(200).json({
            success: true,
            data: {
                monthly_stats: result.rows,
                organization_stats: orgStats.rows
            }
        });
        
    } catch (error) {
        console.error('Get proof stats error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la récupération des statistiques'
            }
        });
    }
};

// ==================== EXPORT ====================

module.exports = {
    // Admin
    getAllProofs,
    getProofById,
    deleteProof,
    getProofsByTask,
    getProofStats,
    // Responsable
    getProofsByReclamation,
    validateTaskProofs,
    // Employé
    uploadTaskProofs,
    deleteEmployerProof
};