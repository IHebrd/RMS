const db = require('../config/database');
const Task = require('../models/Task');
const Proof = require('../models/Proof');
const StatusHistory = require('../models/StatusHistory');
const PaymentItem = require('../models/PaymentItem');
const Employer = require('../models/Employer');
const { sendEmail, emailTemplates } = require('../services/emailService');

// ==================== TABLEAU DE BORD ====================

// @desc    Dashboard employé
// @route   GET /api/employer/dashboard
// @access  Private (Employer only)
const getDashboard = async (req, res) => {
    try {
        const employerId = req.userId;
        
        const stats = await Task.getStatsByEmployer(employerId);
        const currentTasks = await Task.findByEmployer(employerId, { status: ['assigned', 'in_progress'], limit: 5 });
        
        res.status(200).json({
            success: true,
            data: {
                profile: {
                    id: req.user.id,
                    name: `${req.user.first_name} ${req.user.last_name}`,
                    organization: req.user.organization_name,
                    balance: req.user.balance,
                    skills: req.user.skills
                },
                stats,
                current_tasks: currentTasks
            }
        });
        
    } catch (error) {
        console.error('Get dashboard error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la récupération du tableau de bord'
            }
        });
    }
};

// ==================== GESTION DES TÂCHES ====================

// @desc    Liste des tâches assignées
// @route   GET /api/employer/tasks
// @access  Private (Employer only)
const getTasks = async (req, res) => {
    try {
        const employerId = req.userId;
        const { status, page = 1, limit = 20 } = req.query;
        
        const tasks = await Task.findByEmployer(employerId, { 
            status, 
            limit: parseInt(limit), 
            offset: (parseInt(page) - 1) * parseInt(limit) 
        });
        
        const total = await Task.countByEmployer(employerId, status);
        
        res.status(200).json({
            success: true,
            data: {
                tasks,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });
        
    } catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la récupération des tâches'
            }
        });
    }
};

// @desc    Détail d'une tâche
// @route   GET /api/employer/tasks/:id
// @access  Private (Employer only)
const getTaskById = async (req, res) => {
    try {
        const { id } = req.params;
        const employerId = req.userId;
        
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
        
        if (task.employer_id !== employerId) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Cette tâche ne vous est pas assignée'
                }
            });
        }
        
        const proofs = await Proof.findByTask(id);
        
        res.status(200).json({
            success: true,
            data: {
                ...task,
                proofs
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

// @desc    Démarrer une tâche
// @route   PUT /api/employer/tasks/:id/start
// @access  Private (Employer only)
const startTask = async (req, res) => {
    try {
        const { id } = req.params;
        const employerId = req.userId;
        
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
        
        if (task.employer_id !== employerId) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Cette tâche ne vous est pas assignée'
                }
            });
        }
        
        if (task.status !== 'assigned') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_STATUS',
                    message: `La tâche est déjà ${task.status}. Impossible de la démarrer.`
                }
            });
        }
        
        const updated = await Task.updateStatus(id, 'in_progress');
        
        // Enregistrer dans l'historique
        await StatusHistory.create({
            task_id: parseInt(id),
            old_status: 'assigned',
            new_status: 'in_progress',
            changed_by_type: 'employer',
            changed_by_id: employerId,
            comment: 'Tâche démarrée par l\'employé'
        });
        
        res.status(200).json({
            success: true,
            message: 'Tâche démarrée',
            data: updated
        });
        
    } catch (error) {
        console.error('Start task error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors du démarrage de la tâche'
            }
        });
    }
};

// @desc    Terminer une tâche
// @route   PUT /api/employer/tasks/:id/complete
// @access  Private (Employer only)
const completeTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { notes } = req.body;
        const employerId = req.userId;
        
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
        
        if (task.employer_id !== employerId) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Cette tâche ne vous est pas assignée'
                }
            });
        }
        
        if (task.status !== 'in_progress' && task.status !== 'assigned') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_STATUS',
                    message: `La tâche est ${task.status}. Seules les tâches en cours ou assignées peuvent être terminées.`
                }
            });
        }
        
        const completedAt = new Date();
        const updated = await Task.updateStatus(id, 'completed', completedAt);
        
        // Enregistrer dans l'historique
        await StatusHistory.create({
            task_id: parseInt(id),
            old_status: task.status,
            new_status: 'completed',
            changed_by_type: 'employer',
            changed_by_id: employerId,
            comment: notes || 'Tâche terminée par l\'employé'
        });
        
        // Notifier le responsable par email (fire-and-forget — n'échoue pas si SMTP indisponible)
        try {
            const reclamationOrg = await db.query(
                `SELECT ro.*, r.reference, r.title, resp.email as responsable_email, resp.first_name as resp_first_name, resp.last_name as resp_last_name
                 FROM tasks t
                 JOIN reclamation_organizations ro ON t.reclamation_org_id = ro.id
                 JOIN reclamations r ON ro.reclamation_id = r.id
                 JOIN responsable resp ON ro.organization_id = resp.organization_id
                 WHERE t.id = $1
                 LIMIT 1`,
                [id]
            );
            if (reclamationOrg.rows[0] && reclamationOrg.rows[0].responsable_email) {
                const resp = reclamationOrg.rows[0];
                await sendEmail(
                    resp.responsable_email,
                    `Tâche terminée - ${resp.reference}`,
                    emailTemplates.taskCompletedByEmployer(
                        resp.resp_first_name,
                        task.description,
                        resp.reference,
                        `${req.user.first_name} ${req.user.last_name}`
                    ),
                    'responsable',
                    null,
                    'task_completed',
                    null,
                    id
                );
            }
        } catch (emailErr) {
            console.error('Email notification failed (task complete):', emailErr.message);
        }

        res.status(200).json({
            success: true,
            message: 'Tâche terminée, en attente de validation par le responsable',
            data: updated
        });
        
    } catch (error) {
        console.error('Complete task error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la finalisation de la tâche'
            }
        });
    }
};

// @desc    Signaler un échec de tâche
// @route   PUT /api/employer/tasks/:id/fail
// @access  Private (Employer only)
const failTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const employerId = req.userId;
        
        if (!reason) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_REASON',
                    message: 'Veuillez fournir une raison pour l\'échec'
                }
            });
        }
        
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
        
        if (task.employer_id !== employerId) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Cette tâche ne vous est pas assignée'
                }
            });
        }
        
        if (task.status === 'completed') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_STATUS',
                    message: 'La tâche est déjà terminée. Impossible de la marquer comme échouée.'
                }
            });
        }
        
        const updated = await Task.updateStatus(id, 'failed');
        
        // Enregistrer dans l'historique
        await StatusHistory.create({
            task_id: parseInt(id),
            old_status: task.status,
            new_status: 'failed',
            changed_by_type: 'employer',
            changed_by_id: employerId,
            comment: reason
        });
        
        // Notifier le responsable par email (fire-and-forget — n'échoue pas si SMTP indisponible)
        try {
            const reclamationOrg = await db.query(
                `SELECT ro.*, r.reference, r.title, resp.email as responsable_email, resp.first_name as resp_first_name, resp.last_name as resp_last_name
                 FROM tasks t
                 JOIN reclamation_organizations ro ON t.reclamation_org_id = ro.id
                 JOIN reclamations r ON ro.reclamation_id = r.id
                 JOIN responsable resp ON ro.organization_id = resp.organization_id
                 WHERE t.id = $1
                 LIMIT 1`,
                [id]
            );
            if (reclamationOrg.rows[0] && reclamationOrg.rows[0].responsable_email) {
                const resp = reclamationOrg.rows[0];
                await sendEmail(
                    resp.responsable_email,
                    `Tâche en échec - ${resp.reference}`,
                    emailTemplates.taskFailedByEmployer(
                        resp.resp_first_name,
                        task.description,
                        resp.reference,
                        `${req.user.first_name} ${req.user.last_name}`,
                        reason
                    ),
                    'responsable',
                    null,
                    'task_failed',
                    null,
                    id
                );
            }
        } catch (emailErr) {
            console.error('Email notification failed (task fail):', emailErr.message);
        }

        res.status(200).json({
            success: true,
            message: 'Tâche marquée comme échouée',
            data: updated
        });
        
    } catch (error) {
        console.error('Fail task error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors du signalement de l\'échec'
            }
        });
    }
};

// ==================== GESTION DES PREUVES ====================

// @desc    Upload de preuves pour une tâche
// @route   POST /api/employer/tasks/:id/proofs
// @access  Private (Employer only)
const uploadProofs = async (req, res) => {
    try {
        const { id } = req.params;
        const { description } = req.body;
        const employerId = req.userId;
        
        // Vérifier que la tâche appartient à l'employé
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
        
        // Créer les preuves
        const proofsData = req.files.map(file => ({
            path: file.path,
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
            message: 'Preuves ajoutées avec succès',
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

// @desc    Supprimer une preuve
// @route   DELETE /api/employer/proofs/:id
// @access  Private (Employer only)
const deleteProof = async (req, res) => {
    try {
        const { id } = req.params;
        const employerId = req.userId;
        
        const proof = await Proof.findById(id);
        
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
        
        const deleted = await Proof.delete(id);
        
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

// ==================== GESTION DU SOLDE ====================

// @desc    Voir mon solde et historique des paiements
// @route   GET /api/employer/balance
// @access  Private (Employer only)
const getBalance = async (req, res) => {
    try {
        const employerId = req.userId;
        
        const employer = await Employer.findById(employerId);
        
        if (!employer) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Employé non trouvé'
                }
            });
        }
        
        const paymentHistory = await PaymentItem.findByEmployer(employerId);
        const totalEarned = await PaymentItem.getTotalByEmployer(employerId);
        
        // Dernier paiement
        const lastPayment = paymentHistory.length > 0 ? paymentHistory[0] : null;
        
        res.status(200).json({
            success: true,
            data: {
                balance: parseFloat(employer.balance),
                total_earned: totalEarned,
                last_payment: lastPayment ? {
                    amount: parseFloat(lastPayment.amount),
                    date: lastPayment.distributed_at || lastPayment.created_at,
                    reclamation_reference: lastPayment.reference
                } : null,
                payment_history: paymentHistory.map(p => ({
                    id: p.id,
                    amount: parseFloat(p.amount),
                    date: p.distributed_at || p.created_at,
                    reclamation_reference: p.reference,
                    task_description: p.task_description
                }))
            }
        });
        
    } catch (error) {
        console.error('Get balance error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la récupération du solde'
            }
        });
    }
};

// ==================== GESTION DU PROFIL ====================

// @desc    Voir mon profil
// @route   GET /api/employer/profile
// @access  Private (Employer only)
const getProfile = async (req, res) => {
    try {
        const employerId = req.userId;
        
        const employer = await Employer.findById(employerId);
        
        if (!employer) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Profil non trouvé'
                }
            });
        }
        
        // Ne pas renvoyer le mot de passe
        delete employer.password_hash;
        
        res.status(200).json({
            success: true,
            data: employer
        });
        
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la récupération du profil'
            }
        });
    }
};

// @desc    Modifier mon profil
// @route   PUT /api/employer/profile
// @access  Private (Employer only)
const updateProfile = async (req, res) => {
    try {
        const employerId = req.userId;
        const { phone, skills } = req.body;
        
        const updateData = {};
        if (phone !== undefined) updateData.phone = phone;
        if (skills !== undefined) updateData.skills = skills;
        
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'NO_DATA',
                    message: 'Aucune donnée à mettre à jour'
                }
            });
        }
        
        const updated = await Employer.update(employerId, updateData);
        
        delete updated.password_hash;
        
        res.status(200).json({
            success: true,
            message: 'Profil mis à jour',
            data: updated
        });
        
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la mise à jour du profil'
            }
        });
    }
};

// @desc    Upload avatar
// @route   POST /api/employer/profile/avatar
// @access  Private (Employer only)
const uploadAvatar = async (req, res) => {
    try {
        const employerId = req.userId;
        
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'NO_FILE',
                    message: 'Aucun fichier uploadé'
                }
            });
        }
        
        const avatarPath = req.file.path.replace(/\\/g, '/');

        const updated = await Employer.update(employerId, { avatar: avatarPath });

        res.status(200).json({
            success: true,
            message: 'Avatar mis à jour',
            data: { avatar_url: avatarPath }
        });
        
    } catch (error) {
        console.error('Upload avatar error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de l\'upload de l\'avatar'
            }
        });
    }
};

// ==================== GESTION DES MESSAGES ====================

// @desc    Envoyer un message pour une tâche
// @route   POST /api/employer/tasks/:id/messages
// @access  Private (Employer only)
const sendMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { message } = req.body;
        const employerId = req.userId;
        
        if (!message || message.trim() === '') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_MESSAGE',
                    message: 'Le message ne peut pas être vide'
                }
            });
        }
        
        // Vérifier que la tâche appartient à l'employé
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
        
        if (task.employer_id !== employerId) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Vous ne pouvez pas envoyer de message pour cette tâche'
                }
            });
        }
        
        const ReclamationMessage = require('../models/ReclamationMessage');
        
        const newMessage = await ReclamationMessage.create({
            reclamation_org_id: task.reclamation_org_id,
            sender_type: 'employer',
            sender_id: employerId,
            message: message.trim()
        });
        
        res.status(201).json({
            success: true,
            message: 'Message envoyé',
            data: {
                id: newMessage.id,
                message: newMessage.message,
                created_at: newMessage.created_at
            }
        });
        
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de l\'envoi du message'
            }
        });
    }
};

// @desc    Voir les messages d'une tâche
// @route   GET /api/employer/tasks/:id/messages
// @access  Private (Employer only)
const getMessages = async (req, res) => {
    try {
        const { id } = req.params;
        const employerId = req.userId;
        
        // Vérifier que la tâche appartient à l'employé
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
        
        if (task.employer_id !== employerId) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Vous ne pouvez pas voir les messages de cette tâche'
                }
            });
        }
        
        const ReclamationMessage = require('../models/ReclamationMessage');
        
        const messages = await ReclamationMessage.findByReclamationOrg(task.reclamation_org_id);
        
        // Marquer les messages comme lus
        await ReclamationMessage.markAllAsRead(task.reclamation_org_id, 'employer', employerId);
        
        res.status(200).json({
            success: true,
            data: { messages }
        });
        
    } catch (error) {
        console.error('Get messages error:', error);
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
    // Dashboard
    getDashboard,
    // Tasks
    getTasks,
    getTaskById,
    startTask,
    completeTask,
    failTask,
    // Proofs
    uploadProofs,
    deleteProof,
    // Balance
    getBalance,
    // Profile
    getProfile,
    updateProfile,
    uploadAvatar,
    // Messages
    sendMessage,
    getMessages
};