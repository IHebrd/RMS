const Joi = require('joi');

// Schéma de validation pour la connexion
const loginSchema = Joi.object({
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
        })
});

// Schéma de validation pour l'inscription
const registerSchema = Joi.object({
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
    confirm_password: Joi.string()
        .valid(Joi.ref('password'))
        .required()
        .messages({
            'any.only': 'Les mots de passe ne correspondent pas',
            'any.required': 'La confirmation du mot de passe est requise'
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
        .allow('', null)
        .messages({
            'string.pattern.base': 'Le numéro de téléphone doit contenir exactement 8 chiffres'
        }),
    cin: Joi.string()
        .pattern(/^[0-9]{8}$/)
        .optional()
        .allow('', null)
        .messages({
            'string.pattern.base': 'Le CIN doit contenir exactement 8 chiffres'
        }),
    address: Joi.string()
        .max(500)
        .optional()
        .allow('', null)
        .messages({
            'string.max': 'L\'adresse ne peut pas dépasser 500 caractères'
        }),
    governorate: Joi.string()
        .valid(
            'Tunis', 'Ariana', 'Ben Arous', 'Manouba',
            'Nabeul', 'Zaghouan', 'Bizerte', 'Béja',
            'Jendouba', 'Le Kef', 'Siliana', 'Sousse',
            'Monastir', 'Mahdia', 'Sfax', 'Kairouan',
            'Kasserine', 'Sidi Bouzid', 'Gabès', 'Médenine',
            'Tataouine', 'Gafsa', 'Tozeur', 'Kébili'
        )
        .optional()
        .allow('', null)
        .messages({
            'any.only': 'Le gouvernorat doit être un gouvernorat tunisien valide'
        })
});

// Schéma de validation pour le changement de mot de passe
const changePasswordSchema = Joi.object({
    current_password: Joi.string()
        .required()
        .messages({
            'any.required': 'Le mot de passe actuel est requis'
        }),
    new_password: Joi.string()
        .min(6)
        .required()
        .messages({
            'string.min': 'Le nouveau mot de passe doit contenir au moins 6 caractères',
            'any.required': 'Le nouveau mot de passe est requis'
        }),
    confirm_password: Joi.string()
        .valid(Joi.ref('new_password'))
        .required()
        .messages({
            'any.only': 'Les nouveaux mots de passe ne correspondent pas',
            'any.required': 'La confirmation du nouveau mot de passe est requise'
        })
});

// Schéma de validation pour la réinitialisation de mot de passe (oublie)
const forgotPasswordSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'L\'email doit être valide',
            'any.required': 'L\'email est requis'
        })
});

// Schéma de validation pour la réinitialisation avec token
const resetPasswordSchema = Joi.object({
    token: Joi.string()
        .required()
        .messages({
            'any.required': 'Le token est requis'
        }),
    new_password: Joi.string()
        .min(6)
        .required()
        .messages({
            'string.min': 'Le nouveau mot de passe doit contenir au moins 6 caractères',
            'any.required': 'Le nouveau mot de passe est requis'
        }),
    confirm_password: Joi.string()
        .valid(Joi.ref('new_password'))
        .required()
        .messages({
            'any.only': 'Les mots de passe ne correspondent pas',
            'any.required': 'La confirmation du mot de passe est requise'
        })
});

// Middleware de validation
const validateLogin = (req, res, next) => {
    const { error } = loginSchema.validate(req.body, { abortEarly: false });
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

const validateRegister = (req, res, next) => {
    const { error } = registerSchema.validate(req.body, { abortEarly: false });
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

const validateChangePassword = (req, res, next) => {
    const { error } = changePasswordSchema.validate(req.body, { abortEarly: false });
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

const validateForgotPassword = (req, res, next) => {
    const { error } = forgotPasswordSchema.validate(req.body, { abortEarly: false });
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

const validateResetPassword = (req, res, next) => {
    const { error } = resetPasswordSchema.validate(req.body, { abortEarly: false });
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

module.exports = {
    validateLogin,
    validateRegister,
    validateChangePassword,
    validateForgotPassword,
    validateResetPassword,
    // Export des schémas pour réutilisation
    schemas: {
        loginSchema,
        registerSchema,
        changePasswordSchema,
        forgotPasswordSchema,
        resetPasswordSchema
    }
};