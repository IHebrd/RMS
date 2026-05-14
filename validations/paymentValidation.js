const Joi = require('joi');

// Types d'organisations autorisés pour les paiements
const allowedPaymentOrgTypes = ['private', 'association'];

// Schéma de validation pour la distribution de paiement
const distributePaymentSchema = Joi.object({
    reclamation_org_id: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
            'number.base': 'L\'ID de la réclamation doit être un nombre',
            'any.required': 'L\'ID de la réclamation est requis'
        }),
    distributions: Joi.array()
        .items(
            Joi.object({
                employer_id: Joi.number()
                    .integer()
                    .positive()
                    .required()
                    .messages({
                        'any.required': 'L\'ID de l\'employé est requis'
                    }),
                amount: Joi.number()
                    .positive()
                    .required()
                    .messages({
                        'number.positive': 'Le montant doit être positif',
                        'any.required': 'Le montant est requis'
                    }),
                task_id: Joi.number()
                    .integer()
                    .positive()
                    .optional()
                    .allow(null)
            })
        )
        .min(1)
        .required()
        .messages({
            'array.min': 'Au moins une distribution est requise',
            'any.required': 'La liste des distributions est requise'
        })
});

// Schéma de validation pour le paiement externe (utilisateur)
const externalPaymentSchema = Joi.object({
    reclamation_id: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
            'any.required': 'L\'ID de la réclamation est requis'
        }),
    amount: Joi.number()
        .positive()
        .required()
        .messages({
            'number.positive': 'Le montant doit être positif',
            'any.required': 'Le montant est requis'
        }),
    payment_method: Joi.string()
        .valid('card', 'bank_transfer', 'cash', 'mobile_payment')
        .required()
        .messages({
            'any.only': 'Le mode de paiement doit être parmi: card, bank_transfer, cash, mobile_payment',
            'any.required': 'Le mode de paiement est requis'
        }),
    card_token: Joi.string()
        .when('payment_method', {
            is: 'card',
            then: Joi.required(),
            otherwise: Joi.optional()
        })
        .messages({
            'any.required': 'Le token de carte est requis pour le paiement par carte'
        })
});

// Schéma de validation pour les filtres de paiement
const paymentFiltersSchema = Joi.object({
    reclamation_org_id: Joi.number()
        .integer()
        .positive()
        .optional(),
    responsable_id: Joi.number()
        .integer()
        .positive()
        .optional(),
    employer_id: Joi.number()
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

// Schéma de validation pour la vérification de solde
const checkBalanceSchema = Joi.object({
    employer_id: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
            'any.required': 'L\'ID de l\'employé est requis'
        })
});

// Schéma de validation pour le transfert de solde (admin)
const transferBalanceSchema = Joi.object({
    from_employer_id: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
            'any.required': 'L\'ID de l\'employé source est requis'
        }),
    to_employer_id: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
            'any.required': 'L\'ID de l\'employé destination est requis'
        }),
    amount: Joi.number()
        .positive()
        .required()
        .messages({
            'number.positive': 'Le montant doit être positif',
            'any.required': 'Le montant est requis'
        }),
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

// Schéma de validation pour la demande de paiement (employé)
const withdrawalRequestSchema = Joi.object({
    amount: Joi.number()
        .positive()
        .required()
        .messages({
            'number.positive': 'Le montant doit être positif',
            'any.required': 'Le montant est requis'
        }),
    bank_account: Joi.string()
        .required()
        .messages({
            'any.required': 'Le numéro de compte bancaire est requis'
        }),
    bank_name: Joi.string()
        .required()
        .messages({
            'any.required': 'Le nom de la banque est requis'
        })
});

// Middlewares de validation
const validateDistributePayment = (req, res, next) => {
    const { error } = distributePaymentSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Erreur de validation de la distribution de paiement',
                details: error.details.map(d => ({
                    field: d.path.join('.'),
                    message: d.message
                }))
            }
        });
    }
    
    // Vérification supplémentaire: somme des montants
    const totalAmount = req.body.distributions.reduce((sum, d) => sum + d.amount, 0);
    if (totalAmount <= 0) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Le montant total distribué doit être supérieur à 0',
                details: [{
                    field: 'distributions',
                    message: 'La somme des montants doit être positive'
                }]
            }
        });
    }
    
    next();
};

const validateExternalPayment = (req, res, next) => {
    const { error } = externalPaymentSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Erreur de validation du paiement',
                details: error.details.map(d => ({
                    field: d.path.join('.'),
                    message: d.message
                }))
            }
        });
    }
    next();
};

const validatePaymentFilters = (req, res, next) => {
    const { error } = paymentFiltersSchema.validate(req.query, { abortEarly: false });
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

const validateCheckBalance = (req, res, next) => {
    const { error } = checkBalanceSchema.validate(req.params, { abortEarly: false });
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

const validateTransferBalance = (req, res, next) => {
    const { error } = transferBalanceSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Erreur de validation du transfert',
                details: error.details.map(d => ({
                    field: d.path.join('.'),
                    message: d.message
                }))
            }
        });
    }
    
    // Vérifier que les employés sont différents
    if (req.body.from_employer_id === req.body.to_employer_id) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Les employés source et destination doivent être différents',
                details: [{
                    field: 'to_employer_id',
                    message: 'Impossible de transférer à soi-même'
                }]
            }
        });
    }
    
    next();
};

const validateWithdrawalRequest = (req, res, next) => {
    const { error } = withdrawalRequestSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Erreur de validation de la demande de retrait',
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
    validateDistributePayment,
    validateExternalPayment,
    validatePaymentFilters,
    validateCheckBalance,
    validateTransferBalance,
    validateWithdrawalRequest,
    constants: {
        allowedPaymentOrgTypes
    }
};