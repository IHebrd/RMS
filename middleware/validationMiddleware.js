const Joi = require('joi');

// Middleware de validation générique
const validate = (schema, property = 'body') => {
    return (req, res, next) => {
        const { error } = schema.validate(req[property], {
            abortEarly: false,
            stripUnknown: true
        });
        
        if (error) {
            const details = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));
            
            return res.status(422).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Erreur de validation des données',
                    details
                }
            });
        }
        
        next();
    };
};

// Schémas de validation réutilisables
const schemas = {
    // Validation des IDs
    idParam: Joi.object({
        id: Joi.number().integer().positive().required()
    }),
    
    // Validation pagination
    pagination: Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(20)
    }),
    
    // Validation dates
    dateRange: Joi.object({
        start_date: Joi.date().iso(),
        end_date: Joi.date().iso().min(Joi.ref('start_date'))
    }),
    
    // Validation utilisateur
    user: Joi.object({
        email: Joi.string().email().required(),
        first_name: Joi.string().min(2).max(100).required(),
        last_name: Joi.string().min(2).max(100).required(),
        phone: Joi.string().pattern(/^[0-9]{8}$/),
        cin: Joi.string().pattern(/^[0-9]{8}$/),
        address: Joi.string().max(500),
        governorate: Joi.string()
    }),
    
    // Validation organisation
    organization: Joi.object({
        name: Joi.string().min(2).max(200).required(),
        type: Joi.string().valid('public', 'private', 'association').required(),
        governorate: Joi.string().required(),
        delegation: Joi.string(),
        postal_code: Joi.string().pattern(/^[0-9]{4}$/),
        address: Joi.string(),
        phone: Joi.string(),
        email: Joi.string().email(),
        website: Joi.string().uri()
    }),
    
    // Validation réclamation
    reclamation: Joi.object({
        title: Joi.string().min(5).max(200).required(),
        description: Joi.string().min(10).max(5000).required(),
        type: Joi.string().valid('electrique', 'numerique', 'securite', 'voirie', 'plomberie', 'autre').required(),
        urgency: Joi.string().valid('normal', 'urgent', 'tres_urgent').required(),
        organization_ids: Joi.array().items(Joi.number().integer().positive()).min(1).required(),
        amount: Joi.number().min(0).default(0),
        location_lat: Joi.number().min(-90).max(90),
        location_lng: Joi.number().min(-180).max(180)
    }),
    
    // Validation tâche
    task: Joi.object({
        reclamation_org_id: Joi.number().integer().positive().required(),
        employer_ids: Joi.array().items(Joi.number().integer().positive()).min(1).required(),
        description: Joi.string().min(10).max(1000).required(),
        scheduled_date: Joi.date().iso(),
        payment_amounts: Joi.array().items(Joi.number().min(0))
    }),
    
    // Validation statut
    statusUpdate: Joi.object({
        status: Joi.string().valid('pending', 'in_progress', 'validated', 'failed', 'archived').required(),
        notes: Joi.string().max(500)
    }),
    
    // Validation paiement
    paymentDistribution: Joi.object({
        reclamation_org_id: Joi.number().integer().positive().required(),
        distributions: Joi.array().items(Joi.object({
            employer_id: Joi.number().integer().positive().required(),
            amount: Joi.number().positive().required(),
            task_id: Joi.number().integer().positive()
        })).min(1).required()
    }),
    
    // Validation message
    message: Joi.object({
        message: Joi.string().min(1).max(2000).required()
    }),
    
    // Validation changement statut tâche
    taskStatusUpdate: Joi.object({
        status: Joi.string().valid('completed', 'failed').required(),
        comment: Joi.string().max(500)
    }),
    
    // Validation échec tâche
    taskFail: Joi.object({
        reason: Joi.string().min(5).max(500).required()
    })
};

// Middlewares de validation spécifiques
const validationMiddleware = {
    // Validation des paramètres
    validateId: validate(schemas.idParam, 'params'),
    
    // Validation pagination
    validatePagination: validate(schemas.pagination, 'query'),
    
    // Validation dates
    validateDateRange: validate(schemas.dateRange, 'query'),
    
    // Validation utilisateur
    validateUser: validate(schemas.user),
    
    // Validation organisation
    validateOrganization: validate(schemas.organization),
    
    // Validation réclamation
    validateReclamation: validate(schemas.reclamation),
    
    // Validation tâche
    validateTask: validate(schemas.task),
    
    // Validation statut
    validateStatusUpdate: validate(schemas.statusUpdate),
    
    // Validation paiement
    validatePaymentDistribution: validate(schemas.paymentDistribution),
    
    // Validation message
    validateMessage: validate(schemas.message),
    
    // Validation statut tâche
    validateTaskStatus: validate(schemas.taskStatusUpdate),
    
    // Validation échec tâche
    validateTaskFail: validate(schemas.taskFail),
    
    // Validation générique
    validate,
    schemas
};

module.exports = validationMiddleware;