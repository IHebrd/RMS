const Joi = require('joi');

// Liste des gouvernorats tunisiens
const tunisianGovernorates = [
    'Tunis', 'Ariana', 'Ben Arous', 'Manouba',
    'Nabeul', 'Zaghouan', 'Bizerte', 'Béja',
    'Jendouba', 'Le Kef', 'Siliana', 'Sousse',
    'Monastir', 'Mahdia', 'Sfax', 'Kairouan',
    'Kasserine', 'Sidi Bouzid', 'Gabès', 'Médenine',
    'Tataouine', 'Gafsa', 'Tozeur', 'Kébili'
];

// Schéma de validation pour la mise à jour du profil utilisateur
const updateProfileSchema = Joi.object({
    first_name: Joi.string()
        .min(2)
        .max(100)
        .pattern(/^[a-zA-ZÀ-ÿ\s-]+$/)
        .optional()
        .messages({
            'string.min': 'Le prénom doit contenir au moins 2 caractères',
            'string.max': 'Le prénom ne peut pas dépasser 100 caractères',
            'string.pattern.base': 'Le prénom ne peut contenir que des lettres, espaces et tirets'
        }),
    last_name: Joi.string()
        .min(2)
        .max(100)
        .pattern(/^[a-zA-ZÀ-ÿ\s-]+$/)
        .optional()
        .messages({
            'string.min': 'Le nom doit contenir au moins 2 caractères',
            'string.max': 'Le nom ne peut pas dépasser 100 caractères',
            'string.pattern.base': 'Le nom ne peut contenir que des lettres, espaces et tirets'
        }),
    phone: Joi.string()
        .pattern(/^[0-9]{8}$/)
        .optional()
        .allow('', null)
        .messages({
            'string.pattern.base': 'Le numéro de téléphone doit contenir exactement 8 chiffres'
        }),
    address: Joi.string()
        .max(500)
        .optional()
        .allow('', null)
        .messages({
            'string.max': 'L\'adresse ne peut pas dépasser 500 caractères'
        }),
    governorate: Joi.string()
        .valid(...tunisianGovernorates)
        .optional()
        .allow('', null)
        .messages({
            'any.only': 'Le gouvernorat doit être un gouvernorat tunisien valide'
        }),
    email: Joi.string()
        .email()
        .optional()
        .messages({
            'string.email': 'L\'email doit être valide'
        })
}).min(1);

// Schéma de validation pour la création d'un utilisateur par admin
const createUserByAdminSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'L\'email doit être valide',
            'any.required': 'L\'email est requis'
        }),
    password: Joi.string()
        .min(6)
        .required()
        .messages({
            'string.min': 'Le mot de passe doit contenir au moins 6 caractères',
            'any.required': 'Le mot de passe est requis'
        }),
    first_name: Joi.string()
        .min(2)
        .max(100)
        .required()
        .pattern(/^[a-zA-ZÀ-ÿ\s-]+$/)
        .messages({
            'string.min': 'Le prénom doit contenir au moins 2 caractères',
            'string.max': 'Le prénom ne peut pas dépasser 100 caractères',
            'string.pattern.base': 'Le prénom ne peut contenir que des lettres, espaces et tirets',
            'any.required': 'Le prénom est requis'
        }),
    last_name: Joi.string()
        .min(2)
        .max(100)
        .required()
        .pattern(/^[a-zA-ZÀ-ÿ\s-]+$/)
        .messages({
            'string.min': 'Le nom doit contenir au moins 2 caractères',
            'string.max': 'Le nom ne peut pas dépasser 100 caractères',
            'string.pattern.base': 'Le nom ne peut contenir que des lettres, espaces et tirets',
            'any.required': 'Le nom est requis'
        }),
    phone: Joi.string()
        .pattern(/^[0-9]{8}$/)
        .optional()
        .allow('', null),
    cin: Joi.string()
        .pattern(/^[0-9]{8}$/)
        .optional()
        .allow('', null),
    address: Joi.string()
        .max(500)
        .optional()
        .allow('', null),
    governorate: Joi.string()
        .valid(...tunisianGovernorates)
        .optional()
        .allow('', null),
    is_active: Joi.boolean()
        .default(true)
});

// Schéma de validation pour la mise à jour d'un utilisateur par admin
const updateUserByAdminSchema = Joi.object({
    email: Joi.string()
        .email()
        .optional(),
    first_name: Joi.string()
        .min(2)
        .max(100)
        .pattern(/^[a-zA-ZÀ-ÿ\s-]+$/)
        .optional(),
    last_name: Joi.string()
        .min(2)
        .max(100)
        .pattern(/^[a-zA-ZÀ-ÿ\s-]+$/)
        .optional(),
    phone: Joi.string()
        .pattern(/^[0-9]{8}$/)
        .optional()
        .allow('', null),
    cin: Joi.string()
        .pattern(/^[0-9]{8}$/)
        .optional()
        .allow('', null),
    address: Joi.string()
        .max(500)
        .optional()
        .allow('', null),
    governorate: Joi.string()
        .valid(...tunisianGovernorates)
        .optional()
        .allow('', null),
    is_active: Joi.boolean()
        .optional()
}).min(1);

// Schéma de validation pour les filtres utilisateur
const userFiltersSchema = Joi.object({
    is_active: Joi.boolean().optional(),
    governorate: Joi.string()
        .valid(...tunisianGovernorates)
        .optional(),
    search: Joi.string()
        .max(100)
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

// Schéma de validation pour l'upload d'avatar
const avatarUploadSchema = Joi.object({
    avatar: Joi.any()
        .optional()
});

// Middlewares de validation
const validateUpdateProfile = (req, res, next) => {
    const { error } = updateProfileSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Erreur de validation du profil',
                details: error.details.map(d => ({
                    field: d.path.join('.'),
                    message: d.message
                }))
            }
        });
    }
    next();
};

const validateCreateUserByAdmin = (req, res, next) => {
    const { error } = createUserByAdminSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Erreur de validation des données utilisateur',
                details: error.details.map(d => ({
                    field: d.path.join('.'),
                    message: d.message
                }))
            }
        });
    }
    next();
};

const validateUpdateUserByAdmin = (req, res, next) => {
    const { error } = updateUserByAdminSchema.validate(req.body, { abortEarly: false });
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

const validateUserFilters = (req, res, next) => {
    const { error } = userFiltersSchema.validate(req.query, { abortEarly: false });
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
    validateUpdateProfile,
    validateCreateUserByAdmin,
    validateUpdateUserByAdmin,
    validateUserFilters,
    constants: {
        tunisianGovernorates
    }
};