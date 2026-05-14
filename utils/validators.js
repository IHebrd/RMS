const { REGEX, URGENCY_RESPONSE_TIMES } = require('./constants');

// ==================== VALIDATEURS SPÉCIFIQUES ====================

// Valider le format d'une réclamation
const validateReclamationData = (data) => {
    const errors = [];
    
    if (!data.title || data.title.length < 5) {
        errors.push('Le titre doit contenir au moins 5 caractères');
    }
    if (!data.description || data.description.length < 10) {
        errors.push('La description doit contenir au moins 10 caractères');
    }
    if (!data.type) {
        errors.push('Le type de réclamation est requis');
    }
    if (!data.urgency) {
        errors.push('Le niveau d\'urgence est requis');
    }
    if (!data.organization_ids || data.organization_ids.length === 0) {
        errors.push('Au moins une organisation doit être sélectionnée');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

// Valider le format d'une tâche
const validateTaskData = (data) => {
    const errors = [];
    
    if (!data.description || data.description.length < 10) {
        errors.push('La description doit contenir au moins 10 caractères');
    }
    if (!data.employer_ids || data.employer_ids.length === 0) {
        errors.push('Au moins un employé doit être assigné');
    }
    if (data.scheduled_date && new Date(data.scheduled_date) < new Date()) {
        errors.push('La date planifiée ne peut pas être dans le passé');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

// Valider le format d'un paiement
const validatePaymentData = (data) => {
    const errors = [];
    
    if (!data.distributions || data.distributions.length === 0) {
        errors.push('Au moins une distribution est requise');
    }
    
    if (data.distributions) {
        let totalAmount = 0;
        for (const dist of data.distributions) {
            if (dist.amount <= 0) {
                errors.push('Les montants de distribution doivent être positifs');
            }
            totalAmount += dist.amount;
        }
        
        // Vérification supplémentaire à faire avec le montant de la réclamation
        if (data.expected_amount && Math.abs(totalAmount - data.expected_amount) > 0.01) {
            errors.push(`Le montant distribué (${totalAmount}) ne correspond pas au montant attendu (${data.expected_amount})`);
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

// Valider le format d'un message
const validateMessageData = (data) => {
    const errors = [];
    
    if (!data.message || data.message.trim() === '') {
        errors.push('Le message ne peut pas être vide');
    }
    if (data.message && data.message.length > 2000) {
        errors.push('Le message ne peut pas dépasser 2000 caractères');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

// Valider le format d'une organisation
const validateOrganizationData = (data) => {
    const errors = [];
    
    if (!data.name || data.name.length < 2) {
        errors.push('Le nom de l\'organisation doit contenir au moins 2 caractères');
    }
    if (!data.type || !['public', 'private', 'association'].includes(data.type)) {
        errors.push('Le type d\'organisation est invalide');
    }
    if (!data.governorate) {
        errors.push('Le gouvernorat est requis');
    }
    if (data.email && !REGEX.EMAIL.test(data.email)) {
        errors.push('L\'email n\'est pas valide');
    }
    if (data.phone && !REGEX.PHONE_TUNISIA.test(data.phone.replace(/\s/g, ''))) {
        errors.push('Le numéro de téléphone n\'est pas valide');
    }
    if (data.postal_code && !REGEX.POSTAL_CODE_TUNISIA.test(data.postal_code)) {
        errors.push('Le code postal n\'est pas valide');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

// Valider le format d'un utilisateur
const validateUserData = (data) => {
    const errors = [];
    
    if (!data.email || !REGEX.EMAIL.test(data.email)) {
        errors.push('L\'email n\'est pas valide');
    }
    if (!data.first_name || data.first_name.length < 2) {
        errors.push('Le prénom doit contenir au moins 2 caractères');
    }
    if (!data.last_name || data.last_name.length < 2) {
        errors.push('Le nom doit contenir au moins 2 caractères');
    }
    if (data.password && data.password.length < 6) {
        errors.push('Le mot de passe doit contenir au moins 6 caractères');
    }
    if (data.phone && !REGEX.PHONE_TUNISIA.test(data.phone.replace(/\s/g, ''))) {
        errors.push('Le numéro de téléphone n\'est pas valide');
    }
    if (data.cin && !REGEX.CIN_TUNISIA.test(data.cin)) {
        errors.push('Le CIN doit contenir exactement 8 chiffres');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

// ==================== VALIDATEURS DE TRANSITION ====================

// Vérifier si une transition de statut est valide
const isValidStatusTransition = (currentStatus, newStatus, entityType) => {
    const transitions = {
        reclamation: {
            pending: ['in_progress', 'archived'],
            in_progress: ['validated', 'failed', 'pending'],
            validated: ['archived'],
            failed: ['pending', 'archived'],
            archived: []
        },
        task: {
            assigned: ['in_progress', 'failed'],
            in_progress: ['completed', 'failed', 'assigned'],
            completed: [],
            failed: ['assigned']
        }
    };
    
    const entityTransitions = transitions[entityType];
    if (!entityTransitions) return false;
    
    const allowedTransitions = entityTransitions[currentStatus];
    if (!allowedTransitions) return false;
    
    return allowedTransitions.includes(newStatus);
};

// Obtenir le délai de réponse selon l'urgence
const getResponseTimeByUrgency = (urgency) => {
    return URGENCY_RESPONSE_TIMES[urgency] || 72;
};

// Vérifier si une réclamation est en retard
const isReclamationOverdue = (reclamation) => {
    const responseTime = getResponseTimeByUrgency(reclamation.urgency);
    const deadline = new Date(reclamation.created_at);
    deadline.setHours(deadline.getHours() + responseTime);
    
    return new Date() > deadline && reclamation.status !== 'validated';
};

// ==================== VALIDATEURS DE SÉCURITÉ ====================

// Vérifier la force d'un mot de passe
const isStrongPassword = (password) => {
    if (!password || password.length < 6) return false;
    
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return hasLowerCase && hasNumbers && (hasUpperCase || hasSpecialChar);
};

// Vérifier si un email est valide
const isValidEmailFormat = (email) => {
    return REGEX.EMAIL.test(email);
};

// Vérifier si un téléphone tunisien est valide
const isValidTunisianPhone = (phone) => {
    if (!phone) return true;
    const cleaned = phone.replace(/\s/g, '');
    return REGEX.PHONE_TUNISIA.test(cleaned);
};

// Vérifier si un CIN tunisien est valide
const isValidTunisianCIN = (cin) => {
    if (!cin) return true;
    return REGEX.CIN_TUNISIA.test(cin);
};

// ==================== VALIDATEURS DE FICHIERS ====================

// Vérifier si un type de fichier est autorisé pour les preuves
const isValidProofFileType = (mimeType) => {
    const allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'
    ];
    return allowedTypes.includes(mimeType);
};

// Vérifier si un type de fichier est autorisé pour les avatars
const isValidAvatarFileType = (mimeType) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    return allowedTypes.includes(mimeType);
};

// Vérifier la taille d'un fichier
const isValidFileSize = (size, maxSize) => {
    return size <= maxSize;
};

// ==================== EXPORT ====================

module.exports = {
    // Validateurs de données
    validateReclamationData,
    validateTaskData,
    validatePaymentData,
    validateMessageData,
    validateOrganizationData,
    validateUserData,
    
    // Validateurs de transition
    isValidStatusTransition,
    getResponseTimeByUrgency,
    isReclamationOverdue,
    
    // Validateurs de sécurité
    isStrongPassword,
    isValidEmailFormat,
    isValidTunisianPhone,
    isValidTunisianCIN,
    
    // Validateurs de fichiers
    isValidProofFileType,
    isValidAvatarFileType,
    isValidFileSize
};