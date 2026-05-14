const Joi = require('joi');

// Types de réclamations autorisés
const reclamationTypes = ['electrique', 'numerique', 'securite', 'voirie', 'plomberie', 'autre'];

// Niveaux d'urgence autorisés
const urgencyLevels = ['normal', 'urgent', 'tres_urgent'];

// Statuts autorisés
const statuses = ['pending', 'in_progress', 'validated', 'failed', 'archived'];

// Schéma de validation pour la création d'une réclamation
const createReclamationSchema = Joi.object({
    title: Joi.string()
        .min(5)
        .max(200)
        .required()
        .messages({
            'string.min': 'Le titre doit contenir au moins 5 caractères',
            'string.max': 'Le titre ne peut pas dépasser 200 caractères',
            'any.required': 'Le titre est requis'
        }),
    description: Joi.string()
        .min(10)
        .max(5000)
        .required()
        .messages({
            'string.min': 'La description doit contenir au moins 10 caractères',
            'string.max': 'La description ne peut pas dépasser 5000 caractères',
            'any.required': 'La description est requise'
        }),
    type: Joi.string()
        .valid(...reclamationTypes)
        .required()
        .messages({
            'any.only': `Le type doit être parmi: ${reclamationTypes.join(', ')}`,
            'any.required': 'Le type est requis'
        }),
    urgency: Joi.string()
        .valid(...urgencyLevels)
        .required()
        .messages({
            'any.only': `L'urgence doit être parmi: ${urgencyLevels.join(', ')}`,
            'any.required': 'Le niveau d\'urgence est requis'
        }),
    organization_ids: Joi.array()
        .items(Joi.number().integer().positive())
        .min(1)
        .required()
        .messages({
            'array.min': 'Au moins une organisation doit être sélectionnée',
            'any.required': 'Les organisations sont requises'
        }),
    amount: Joi.number()
        .min(0)
        .max(100000)
        .default(0)
        .messages({
            'number.min': 'Le montant ne peut pas être négatif',
            'number.max': 'Le montant ne peut pas dépasser 100000 DT'
        }),
    location_lat: Joi.number()
        .min(-90)
        .max(90)
        .optional()
        .allow(null)
        .messages({
            'number.min': 'La latitude doit être comprise entre -90 et 90',
            'number.max': 'La latitude doit être comprise entre -90 et 90'
        }),
    location_lng: Joi.number()
        .min(-180)
        .max(180)
        .optional()
        .allow(null)
        .messages({
            'number.min': 'La longitude doit être comprise entre -180 et 180',
            'number.max': 'La longitude doit être comprise entre -180 et 180'
        })
});

// Schéma de validation pour la mise à jour d'une réclamation
const updateReclamationSchema = Joi.object({
    title: Joi.string()
        .min(5)
        .max(200)
        .optional(),
    description: Joi.string()
        .min(10)
        .max(5000)
        .optional(),
    type: Joi.string()
        .valid(...reclamationTypes)
        .optional(),
    urgency: Joi.string()
        .valid(...urgencyLevels)
        .optional(),
    amount: Joi.number()
        .min(0)
        .max(100000)
        .optional(),
    location_lat: Joi.number()
        .min(-90)
        .max(90)
        .optional()
        .allow(null),
    location_lng: Joi.number()
        .min(-180)
        .max(180)
        .optional()
        .allow(null)
}).min(1);

// Schéma de validation pour le changement de statut
const updateStatusSchema = Joi.object({
    status: Joi.string()
        .valid(...statuses)
        .required()
        .messages({
            'any.only': `Le statut doit être parmi: ${statuses.join(', ')}`,
            'any.required': 'Le statut est requis'
        }),
    notes: Joi.string()
        .max(500)
        .optional()
        .allow('', null)
        .messages({
            'string.max': 'Les notes ne peuvent pas dépasser 500 caractères'
        })
});

// Schéma de validation pour l'annulation d'une réclamation
const cancelReclamationSchema = Joi.object({
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

// Schéma de validation pour les filtres de réclamation
const reclamationFiltersSchema = Joi.object({
    status: Joi.string()
        .valid(...statuses)
        .optional(),
    type: Joi.string()
        .valid(...reclamationTypes)
        .optional(),
    urgency: Joi.string()
        .valid(...urgencyLevels)
        .optional(),
    user_id: Joi.number()
        .integer()
        .positive()
        .optional(),
    organization_id: Joi.number()
        .integer()
        .positive()
        .optional(),
    start_date: Joi.date()
        .iso()
        .optional(),
    end_date: Joi.date()
        .iso()
        .min(Joi.ref('start_date'))
        .optional()
        .messages({
            'date.min': 'La date de fin doit être postérieure à la date de début'
        }),
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
const validateCreateReclamation = (req, res, next) => {
    const { error } = createReclamationSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Erreur de validation de la réclamation',
                details: error.details.map(d => ({
                    field: d.path.join('.'),
                    message: d.message
                }))
            }
        });
    }
    next();
};

const validateUpdateReclamation = (req, res, next) => {
    const { error } = updateReclamationSchema.validate(req.body, { abortEarly: false });
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

const validateUpdateStatus = (req, res, next) => {
    const { error } = updateStatusSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Erreur de validation du statut',
                details: error.details.map(d => ({
                    field: d.path.join('.'),
                    message: d.message
                }))
            }
        });
    }
    next();
};

const validateCancelReclamation = (req, res, next) => {
    const { error } = cancelReclamationSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Erreur de validation de l\'annulation',
                details: error.details.map(d => ({
                    field: d.path.join('.'),
                    message: d.message
                }))
            }
        });
    }
    next();
};

const validateReclamationFilters = (req, res, next) => {
    const { error } = reclamationFiltersSchema.validate(req.query, { abortEarly: false });
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
    validateCreateReclamation,
    validateUpdateReclamation,
    validateUpdateStatus,
    validateCancelReclamation,
    validateReclamationFilters,
    constants: {
        reclamationTypes,
        urgencyLevels,
        statuses
    }
};