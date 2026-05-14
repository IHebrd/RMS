const Joi = require('joi');

// Statuts des tâches
const taskStatuses = ['assigned', 'in_progress', 'completed', 'failed'];

// Statuts de paiement
const paymentStatuses = ['pending', 'paid'];

// Schéma de validation pour la création d'une tâche
const createTaskSchema = Joi.object({
    reclamation_org_id: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
            'number.base': 'L\'ID de la réclamation doit être un nombre',
            'any.required': 'L\'ID de la réclamation est requis'
        }),
    employer_ids: Joi.array()
        .items(Joi.number().integer().positive())
        .min(1)
        .required()
        .messages({
            'array.min': 'Au moins un employé doit être assigné',
            'any.required': 'La liste des employés est requise'
        }),
    description: Joi.string()
        .min(10)
        .max(1000)
        .required()
        .messages({
            'string.min': 'La description doit contenir au moins 10 caractères',
            'string.max': 'La description ne peut pas dépasser 1000 caractères',
            'any.required': 'La description est requise'
        }),
    scheduled_date: Joi.date()
        .iso()
        .min('now')
        .optional()
        .allow(null)
        .messages({
            'date.min': 'La date planifiée ne peut pas être dans le passé',
            'date.iso': 'La date doit être au format ISO'
        }),
    payment_amounts: Joi.array()
        .items(Joi.number().min(0))
        .optional()
        .messages({
            'number.min': 'Le montant de paiement ne peut pas être négatif'
        })
});

// Schéma de validation pour la mise à jour d'une tâche
const updateTaskSchema = Joi.object({
    description: Joi.string()
        .min(10)
        .max(1000)
        .optional(),
    scheduled_date: Joi.date()
        .iso()
        .optional()
        .allow(null),
    employer_id: Joi.number()
        .integer()
        .positive()
        .optional()
}).min(1);

// Schéma de validation pour la validation d'une tâche (responsable)
const validateTaskSchema = Joi.object({
    status: Joi.string()
        .valid('completed', 'failed')
        .required()
        .messages({
            'any.only': 'Le statut doit être "completed" ou "failed"',
            'any.required': 'Le statut est requis'
        }),
    comment: Joi.string()
        .max(500)
        .optional()
        .allow('', null)
        .messages({
            'string.max': 'Le commentaire ne peut pas dépasser 500 caractères'
        })
});

// Schéma de validation pour le démarrage d'une tâche (employé)
const startTaskSchema = Joi.object({
    // Pas de données requises, juste l'action
});

// Schéma de validation pour la complétion d'une tâche (employé)
const completeTaskSchema = Joi.object({
    notes: Joi.string()
        .max(500)
        .optional()
        .allow('', null)
        .messages({
            'string.max': 'Les notes ne peuvent pas dépasser 500 caractères'
        })
});

// Schéma de validation pour l'échec d'une tâche (employé)
const failTaskSchema = Joi.object({
    reason: Joi.string()
        .min(5)
        .max(500)
        .required()
        .messages({
            'string.min': 'La raison doit contenir au moins 5 caractères',
            'string.max': 'La raison ne peut pas dépasser 500 caractères',
            'any.required': 'La raison est requise'
        })
});

// Schéma de validation pour les filtres de tâche
const taskFiltersSchema = Joi.object({
    status: Joi.string()
        .valid(...taskStatuses)
        .optional(),
    employer_id: Joi.number()
        .integer()
        .positive()
        .optional(),
    reclamation_id: Joi.number()
        .integer()
        .positive()
        .optional(),
    payment_status: Joi.string()
        .valid(...paymentStatuses)
        .optional(),
    scheduled_from: Joi.date()
        .iso()
        .optional(),
    scheduled_to: Joi.date()
        .iso()
        .min(Joi.ref('scheduled_from'))
        .optional(),
    page: Joi.number()
        .integer()
        .min(1)
        .default(1),
    limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .default(20)
});

// Middlewares de validation
const validateCreateTask = (req, res, next) => {
    const { error } = createTaskSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Erreur de validation de la tâche',
                details: error.details.map(d => ({
                    field: d.path.join('.'),
                    message: d.message
                }))
            }
        });
    }
    
    // Vérification supplémentaire: payment_amounts doit avoir la même longueur que employer_ids
    if (req.body.payment_amounts && req.body.payment_amounts.length !== req.body.employer_ids.length) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Le nombre de montants de paiement doit correspondre au nombre d\'employés',
                details: [{
                    field: 'payment_amounts',
                    message: 'payment_amounts doit avoir la même longueur que employer_ids'
                }]
            }
        });
    }
    
    next();
};

const validateUpdateTask = (req, res, next) => {
    const { error } = updateTaskSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Erreur de validation de la mise à jour',
                details: error.details.map(d => ({
                    field: d.path.join('.'),
                    message: d.message
                }))
            }
        });
    }
    next();
};

const validateValidateTask = (req, res, next) => {
    const { error } = validateTaskSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Erreur de validation de la validation',
                details: error.details.map(d => ({
                    field: d.path.join('.'),
                    message: d.message
                }))
            }
        });
    }
    next();
};

const validateStartTask = (req, res, next) => {
    const { error } = startTaskSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Erreur de validation',
                details: error.details.map(d => ({
                    field: d.path.join('.'),
                    message: d.message
                }))
            }
        });
    }
    next();
};

const validateCompleteTask = (req, res, next) => {
    const { error } = completeTaskSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Erreur de validation',
                details: error.details.map(d => ({
                    field: d.path.join('.'),
                    message: d.message
                }))
            }
        });
    }
    next();
};

const validateFailTask = (req, res, next) => {
    const { error } = failTaskSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Erreur de validation de l\'échec',
                details: error.details.map(d => ({
                    field: d.path.join('.'),
                    message: d.message
                }))
            }
        });
    }
    next();
};

const validateTaskFilters = (req, res, next) => {
    const { error } = taskFiltersSchema.validate(req.query, { abortEarly: false });
    if (error) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Erreur de validation des filtres',
                details: error.details.map(d => ({
                    field: d.path.join('.'),
                    message: d.message
                }))
            }
        });
    }
    next();
};

module.exports = {
    validateCreateTask,
    validateUpdateTask,
    validateValidateTask,
    validateStartTask,
    validateCompleteTask,
    validateFailTask,
    validateTaskFilters,
    constants: {
        taskStatuses,
        paymentStatuses
    }
};