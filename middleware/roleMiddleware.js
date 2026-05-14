// Middleware de vérification de rôle spécifique
const roleMiddleware = {
    // Vérifier que l'utilisateur est un administrateur
    isAdmin: (req, res, next) => {
        if (req.userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'ADMIN_REQUIRED',
                    message: 'Cette action nécessite des droits administrateur'
                }
            });
        }
        next();
    },

    // Vérifier que l'utilisateur est un responsable
    isResponsable: (req, res, next) => {
        if (req.userRole !== 'responsable') {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'RESPONSABLE_REQUIRED',
                    message: 'Cette action nécessite des droits de responsable'
                }
            });
        }
        next();
    },

    // Vérifier que l'utilisateur est un employé
    isEmployer: (req, res, next) => {
        if (req.userRole !== 'employer') {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'EMPLOYER_REQUIRED',
                    message: 'Cette action nécessite des droits d\'employé'
                }
            });
        }
        next();
    },

    // Vérifier que l'utilisateur est un client
    isUser: (req, res, next) => {
        if (req.userRole !== 'user') {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'USER_REQUIRED',
                    message: 'Cette action nécessite un compte utilisateur'
                }
            });
        }
        next();
    },

    // Vérifier que l'utilisateur a accès à son propre profil
    isOwnProfile: (req, res, next) => {
        const requestedId = parseInt(req.params.id);
        if (req.userId !== requestedId && req.userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Vous ne pouvez accéder qu\'à votre propre profil'
                }
            });
        }
        next();
    },

    // Vérifier que l'utilisateur a accès à sa propre réclamation
    isOwnReclamation: async (req, res, next) => {
        try {
            const Reclamation = require('../models/Reclamation');
            const reclamationId = parseInt(req.params.id) || parseInt(req.params.reclamationId);
            
            if (!reclamationId) {
                return next();
            }
            
            const reclamation = await Reclamation.findById(reclamationId);
            
            if (!reclamation) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'NOT_FOUND',
                        message: 'Réclamation non trouvée'
                    }
                });
            }
            
            if (req.userRole === 'admin') {
                return next();
            }
            
            if (req.userRole === 'user' && reclamation.user_id !== req.userId) {
                return res.status(403).json({
                    success: false,
                    error: {
                        code: 'FORBIDDEN',
                        message: 'Vous ne pouvez accéder qu\'à vos propres réclamations'
                    }
                });
            }
            
            next();
        } catch (error) {
            console.error('Is own reclamation error:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'SERVER_ERROR',
                    message: 'Erreur lors de la vérification des droits'
                }
            });
        }
    },

    // Vérifier que l'utilisateur a accès à sa propre tâche
    isOwnTask: async (req, res, next) => {
        try {
            const Task = require('../models/Task');
            const taskId = parseInt(req.params.id) || parseInt(req.params.taskId);
            
            if (!taskId) {
                return next();
            }
            
            const task = await Task.findById(taskId);
            
            if (!task) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'NOT_FOUND',
                        message: 'Tâche non trouvée'
                    }
                });
            }
            
            if (req.userRole === 'admin') {
                return next();
            }
            
            if (req.userRole === 'employer' && task.employer_id !== req.userId) {
                return res.status(403).json({
                    success: false,
                    error: {
                        code: 'FORBIDDEN',
                        message: 'Vous ne pouvez accéder qu\'à vos propres tâches'
                    }
                });
            }
            
            if (req.userRole === 'responsable') {
                const Employer = require('../models/Employer');
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
            
            next();
        } catch (error) {
            console.error('Is own task error:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'SERVER_ERROR',
                    message: 'Erreur lors de la vérification des droits'
                }
            });
        }
    },

    // Vérifier que l'organisation peut gérer les paiements (privé/association)
    canManagePayments: (req, res, next) => {
        if (req.userRole === 'admin') {
            return next();
        }
        
        if (req.userRole === 'responsable') {
            const orgType = req.user.organization_type;
            if (orgType === 'public') {
                return res.status(403).json({
                    success: false,
                    error: {
                        code: 'PAYMENT_NOT_ALLOWED',
                        message: 'Les organisations publiques ne peuvent pas gérer de paiements'
                    }
                });
            }
            return next();
        }
        
        return res.status(403).json({
            success: false,
            error: {
                code: 'FORBIDDEN',
                message: 'Vous n\'avez pas les droits pour gérer les paiements'
            }
        });
    }
};

module.exports = roleMiddleware;