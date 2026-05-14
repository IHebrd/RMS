const db = require('../config/database');
const User = require('../models/User');
const Organization = require('../models/Organization');
const Reclamation = require('../models/Reclamation');
const ReclamationOrganization = require('../models/ReclamationOrganization');
const ReclamationMessage = require('../models/ReclamationMessage');
const StatusHistory = require('../models/StatusHistory');
const Proof = require('../models/Proof');
const { sendEmail, emailTemplates } = require('../services/emailService');

// ==================== GESTION DU PROFIL ====================

// @desc    Liste des organisations disponibles pour l'utilisateur
// @route   GET /api/user/organizations
// @access  Private (User only)
const getAvailableOrganizations = async (req, res) => {
    try {
        const { governorate, type, search } = req.query;

        const organizations = await Organization.findAll({
            governorate,
            type,
            search,
            is_active: true
        });

        res.status(200).json({
            success: true,
            data: {
                organizations
            }
        });

    } catch (error) {
        console.error('Get available organizations error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la recuperation des organisations'
            }
        });
    }
};

// @desc    Obtenir mon profil
// @route   GET /api/user/profile
// @access  Private (User only)
const getProfile = async (req, res) => {
    try {
        const userId = req.userId;
        
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Utilisateur non trouvé'
                }
            });
        }
        
        const stats = await User.getStats(userId);
        
        // Supprimer le mot de passe
        delete user.password_hash;
        
        res.status(200).json({
            success: true,
            data: {
                ...user,
                stats
            }
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
// @route   PUT /api/user/profile
// @access  Private (User only)
const updateProfile = async (req, res) => {
    try {
        const userId = req.userId;
        const { phone, address, governorate, first_name, last_name } = req.body;
        
        const updateData = {};
        if (phone !== undefined) updateData.phone = phone;
        if (address !== undefined) updateData.address = address;
        if (governorate !== undefined) updateData.governorate = governorate;
        if (first_name !== undefined) updateData.first_name = first_name;
        if (last_name !== undefined) updateData.last_name = last_name;
        
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'NO_DATA',
                    message: 'Aucune donnée à mettre à jour'
                }
            });
        }
        
        const updated = await User.update(userId, updateData);
        
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
// @route   POST /api/user/profile/avatar
// @access  Private (User only)
const uploadAvatar = async (req, res) => {
    try {
        const userId = req.userId;
        
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

        const updated = await User.update(userId, { avatar: avatarPath });

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

// ==================== GESTION DES RÉCLAMATIONS ====================

// @desc    Créer une réclamation
// @route   POST /api/user/reclamations
// @access  Private (User only)
const createReclamation = async (req, res) => {
    try {
        const userId = req.userId;
        const { title, description, type, urgency, organization_ids, amount = 0, location_lat, location_lng } = req.body;
        
        // Validation
        if (!title || !description || !type || !urgency || !organization_ids || organization_ids.length === 0) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_FIELDS',
                    message: 'Titre, description, type, urgence et au moins une organisation sont requis'
                }
            });
        }

        if (req.files && req.files.length > 0) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INITIAL_PROOFS_NOT_SUPPORTED',
                    message: 'Les preuves initiales ne sont pas encore supportees a la creation de reclamation. Merci de creer la reclamation sans fichiers.'
                }
            });
        }
        
        // Créer la réclamation
        const newReclamation = await Reclamation.create({
            user_id: userId,
            title,
            description,
            type,
            urgency,
            amount: parseFloat(amount),
            location_lat: location_lat || null,
            location_lng: location_lng || null
        });
        
        // Lier aux organisations
        const reclamationOrgs = await ReclamationOrganization.createMultiple(newReclamation.id, organization_ids);
        
        // Enregistrer dans l'historique
        await StatusHistory.create({
            reclamation_id: newReclamation.id,
            old_status: null,
            new_status: 'pending',
            changed_by_type: 'user',
            changed_by_id: userId,
            comment: 'Réclamation créée par l\'utilisateur'
        });
        
        // Upload des preuves si présentes
        if (req.files && req.files.length > 0) {
            // Récupérer la première liaison reclamation_org
            const firstOrg = reclamationOrgs[0];
            
            // Créer une tâche temporaire pour les preuves
            const Task = require('../models/Task');
            const tempTask = await Task.create({
                reclamation_org_id: firstOrg.id,
                employer_id: null,
                description: 'Preuves initiales',
                status: 'assigned'
            });
            
            const proofsData = req.files.map(file => ({
                path: file.path,
                type: file.mimetype.startsWith('image/') ? 'image' : 'video',
                description: 'Preuve jointe à la réclamation'
            }));
            
            await Proof.createMultiple(tempTask.id, proofsData, userId, 'user');
        }
        
        // Envoyer email de confirmation (fire-and-forget)
        try {
            const user = await User.findById(userId);
            if (user && user.email) {
                await sendEmail(
                    user.email,
                    `Confirmation de votre réclamation ${newReclamation.reference}`,
                    emailTemplates.reclamationCreated(user.first_name, newReclamation.reference, title),
                    'user',
                    userId,
                    'creation',
                    newReclamation.id
                );
            }
        } catch (emailErr) {
            console.error('Confirmation email failed (reclamation):', emailErr.message);
        }
        
        res.status(201).json({
            success: true,
            message: 'Réclamation créée avec succès',
            data: {
                id: newReclamation.id,
                reference: newReclamation.reference,
                status: newReclamation.status,
                created_at: newReclamation.created_at,
                organizations: reclamationOrgs.map(ro => ({
                    id: ro.organization_id,
                    status: ro.status
                }))
            }
        });
        
    } catch (error) {
        console.error('Create reclamation error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la création de la réclamation'
            }
        });
    }
};

// @desc    Liste de mes réclamations
// @route   GET /api/user/reclamations
// @access  Private (User only)
const getReclamations = async (req, res) => {
    try {
        const userId = req.userId;
        const { status, type, page = 1, limit = 20 } = req.query;
        
        const filters = {
            user_id: userId,
            status,
            type,
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit)
        };
        
        const reclamations = await Reclamation.findAll(filters);
        const total = await Reclamation.count({ user_id: userId, status });
        
        // Ajouter les organisations pour chaque réclamation
        for (const rec of reclamations) {
            const orgs = await ReclamationOrganization.findByReclamation(rec.id);
            rec.organizations = orgs.map(o => ({ name: o.organization_name, status: o.status }));
        }
        
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
        console.error('Get reclamations error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la récupération des réclamations'
            }
        });
    }
};

// @desc    Détail d'une réclamation
// @route   GET /api/user/reclamations/:id
// @access  Private (User only)
const getReclamationById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        
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
        
        if (reclamation.user_id !== userId) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Vous n\'avez pas accès à cette réclamation'
                }
            });
        }
        
        // Récupérer les organisations
        const organizations = await ReclamationOrganization.findByReclamation(id);
        
        // Récupérer les tâches et preuves
        const tasks = [];
        for (const org of organizations) {
            const orgTasks = await db.query(
                `SELECT t.*, e.first_name, e.last_name,
                        json_agg(jsonb_build_object('id', p.id, 'file_path', p.file_path, 'file_type', p.file_type)) as proofs
                 FROM tasks t
                 LEFT JOIN employer e ON t.employer_id = e.id
                 LEFT JOIN proofs p ON t.id = p.task_id
                 WHERE t.reclamation_org_id = $1
                 GROUP BY t.id, e.first_name, e.last_name`,
                [org.id]
            );
            tasks.push(...orgTasks.rows);
        }
        
        // Récupérer l'historique
        const history = await StatusHistory.findByReclamation(id);
        
        res.status(200).json({
            success: true,
            data: {
                ...reclamation,
                organizations,
                tasks,
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

// @desc    Suivi d'une réclamation
// @route   GET /api/user/reclamations/:id/tracking
// @access  Private (User only)
const trackReclamation = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        
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
        
        if (reclamation.user_id !== userId) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Vous n\'avez pas accès à cette réclamation'
                }
            });
        }
        
        const history = await StatusHistory.findByReclamation(id);
        
        // Calculer le pourcentage d'avancement
        const statusOrder = ['pending', 'in_progress', 'validated'];
        const currentIndex = statusOrder.indexOf(reclamation.status);
        const progressPercentage = ((currentIndex + 1) / statusOrder.length) * 100;
        
        // Construire la timeline
        const timeline = history.map(h => ({
            step: h.new_status === 'pending' ? 'Création' :
                  h.new_status === 'in_progress' ? 'Prise en charge' :
                  h.new_status === 'validated' ? 'Résolution' : h.new_status,
            status: 'completed',
            date: h.changed_at,
            description: h.comment || `Statut changé vers ${h.new_status}`
        }));
        
        res.status(200).json({
            success: true,
            data: {
                reclamation_id: id,
                reference: reclamation.reference,
                current_status: reclamation.status,
                progress_percentage: progressPercentage,
                timeline
            }
        });
        
    } catch (error) {
        console.error('Track reclamation error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors du suivi de la réclamation'
            }
        });
    }
};

// @desc    Annuler une réclamation
// @route   PUT /api/user/reclamations/:id/cancel
// @access  Private (User only)
const cancelReclamation = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const userId = req.userId;
        
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
        
        if (reclamation.user_id !== userId) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Vous n\'avez pas accès à cette réclamation'
                }
            });
        }
        
        if (reclamation.status !== 'pending') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_STATUS',
                    message: 'Seules les réclamations en attente peuvent être annulées'
                }
            });
        }
        
        const updated = await Reclamation.updateStatus(id, 'archived');
        
        await StatusHistory.create({
            reclamation_id: parseInt(id),
            old_status: 'pending',
            new_status: 'archived',
            changed_by_type: 'user',
            changed_by_id: userId,
            comment: reason || 'Annulée par l\'utilisateur'
        });
        
        res.status(200).json({
            success: true,
            message: 'Réclamation annulée',
            data: updated
        });
        
    } catch (error) {
        console.error('Cancel reclamation error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de l\'annulation de la réclamation'
            }
        });
    }
};

// ==================== GESTION DES MESSAGES ====================

// @desc    Envoyer un message
// @route   POST /api/user/reclamations/:id/messages
// @access  Private (User only)
const sendMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { message } = req.body;
        const userId = req.userId;
        
        if (!message || message.trim() === '') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_MESSAGE',
                    message: 'Le message ne peut pas être vide'
                }
            });
        }
        
        // Vérifier que la réclamation appartient à l'utilisateur
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
        
        if (reclamation.user_id !== userId) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Vous ne pouvez pas envoyer de message pour cette réclamation'
                }
            });
        }
        
        // Récupérer la première organisation (ou toutes)
        const reclamationOrgs = await ReclamationOrganization.findByReclamation(id);
        
        if (reclamationOrgs.length === 0) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NO_ORGANIZATION',
                    message: 'Aucune organisation associée à cette réclamation'
                }
            });
        }
        
        const newMessage = await ReclamationMessage.create({
            reclamation_org_id: reclamationOrgs[0].id,
            sender_type: 'user',
            sender_id: userId,
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

// @desc    Voir les messages d'une réclamation
// @route   GET /api/user/reclamations/:id/messages
// @access  Private (User only)
const getMessages = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        
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
        
        if (reclamation.user_id !== userId) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Vous ne pouvez pas voir les messages de cette réclamation'
                }
            });
        }
        
        const reclamationOrgs = await ReclamationOrganization.findByReclamation(id);
        
        if (reclamationOrgs.length === 0) {
            return res.status(200).json({
                success: true,
                data: { messages: [] }
            });
        }
        
        const messages = await ReclamationMessage.findByReclamationOrg(reclamationOrgs[0].id);
        
        // Marquer les messages comme lus
        await ReclamationMessage.markAllAsRead(reclamationOrgs[0].id, 'user', userId);
        
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
    // Organizations
    getAvailableOrganizations,
    // Profile
    getProfile,
    updateProfile,
    uploadAvatar,
    // Reclamations
    createReclamation,
    getReclamations,
    getReclamationById,
    trackReclamation,
    cancelReclamation,
    // Messages
    sendMessage,
    getMessages
};
