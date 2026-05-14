const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DATE_FORMATS, REGEX } = require('./constants');

// ==================== FORMATAGE ====================

// Formater une date
const formatDate = (date, format = DATE_FORMATS.DATETIME_FR) => {
    if (!date) return null;
    const d = new Date(date);
    
    if (format === DATE_FORMATS.DATE_ONLY) {
        return d.toISOString().split('T')[0];
    }
    if (format === DATE_FORMATS.DATETIME_FR) {
        return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    }
    if (format === DATE_FORMATS.DATE_FR) {
        return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    }
    return d.toISOString();
};

// Formater un nombre en devise tunisienne
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-TN', {
        style: 'currency',
        currency: 'TND',
        minimumFractionDigits: 3,
        maximumFractionDigits: 3
    }).format(amount);
};

// Formater un numéro de téléphone tunisien
const formatPhoneNumber = (phone) => {
    if (!phone) return null;
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 8) {
        return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)}`;
    }
    return phone;
};

// Formater un CIN
const formatCIN = (cin) => {
    if (!cin) return null;
    return cin.toString().padStart(8, '0');
};

// Tronquer un texte
const truncateText = (text, maxLength = 100, suffix = '...') => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - suffix.length) + suffix;
};

// Capitaliser la première lettre
const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// ==================== VALIDATION ====================

// Valider un email
const isValidEmail = (email) => {
    return REGEX.EMAIL.test(email);
};

// Valider un téléphone tunisien
const isValidPhone = (phone) => {
    if (!phone) return true;
    return REGEX.PHONE_TUNISIA.test(phone.replace(/\s/g, ''));
};

// Valider un CIN tunisien
const isValidCIN = (cin) => {
    if (!cin) return true;
    return REGEX.CIN_TUNISIA.test(cin);
};

// Valider un code postal tunisien
const isValidPostalCode = (postalCode) => {
    if (!postalCode) return true;
    return REGEX.POSTAL_CODE_TUNISIA.test(postalCode);
};

// Valider un nom
const isValidName = (name) => {
    if (!name) return false;
    return REGEX.NAME.test(name);
};

// Valider une référence
const isValidReference = (reference) => {
    return REGEX.REFERENCE.test(reference);
};

// Valider des coordonnées GPS
const isValidCoordinates = (lat, lng) => {
    if (lat === null || lng === null) return true;
    return REGEX.LATITUDE.test(lat.toString()) && REGEX.LONGITUDE.test(lng.toString());
};

// ==================== GÉNÉRATION ====================

// Générer un ID unique
const generateUniqueId = (prefix = '') => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
};

// Générer un token aléatoire
const generateRandomToken = (length = 32) => {
    return crypto.randomBytes(length).toString('hex');
};

// Générer un code de vérification (6 chiffres)
const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Générer un slug à partir d'un texte
const generateSlug = (text) => {
    if (!text) return '';
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
};

// ==================== MANIPULATION DE DONNÉES ====================

// Grouper un tableau par clé
const groupBy = (array, key) => {
    return array.reduce((result, item) => {
        const groupKey = item[key];
        if (!result[groupKey]) {
            result[groupKey] = [];
        }
        result[groupKey].push(item);
        return result;
    }, {});
};

// Calculer la moyenne d'un tableau
const average = (array) => {
    if (!array.length) return 0;
    return array.reduce((a, b) => a + b, 0) / array.length;
};

// Calculer le pourcentage
const percentage = (value, total) => {
    if (total === 0) return 0;
    return (value / total) * 100;
};

// Nettoyer les valeurs null/undefined d'un objet
const cleanObject = (obj) => {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value !== null && value !== undefined && value !== '') {
            if (typeof value === 'object' && !Array.isArray(value)) {
                result[key] = cleanObject(value);
            } else {
                result[key] = value;
            }
        }
    }
    return result;
};

// Deep merge d'objets
const deepMerge = (target, source) => {
    const result = { ...target };
    for (const [key, value] of Object.entries(source)) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            result[key] = deepMerge(target[key] || {}, value);
        } else {
            result[key] = value;
        }
    }
    return result;
};

// ==================== FICHIERS ====================

// Supprimer un fichier
const deleteFile = (filePath) => {
    if (!filePath) return false;
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        return true;
    }
    return false;
};

// Obtenir l'extension d'un fichier
const getFileExtension = (filename) => {
    return path.extname(filename).toLowerCase();
};

// Obtenir le type MIME à partir de l'extension
const getMimeType = (extension) => {
    const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.mp4': 'video/mp4',
        '.mov': 'video/quicktime',
        '.avi': 'video/x-msvideo'
    };
    return mimeTypes[extension] || 'application/octet-stream';
};

// ==================== PAGINATION ====================

// Créer une réponse de pagination
const paginate = (data, total, page, limit) => {
    return {
        data,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: parseInt(total),
            pages: Math.ceil(total / limit),
            has_next: page * limit < total,
            has_prev: page > 1
        }
    };
};

// ==================== TEMPS ====================

// Obtenir le temps écoulé depuis une date
const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    const intervals = {
        an: 31536000,
        mois: 2592000,
        semaine: 604800,
        jour: 86400,
        heure: 3600,
        minute: 60,
        seconde: 1
    };
    
    for (const [unit, value] of Object.entries(intervals)) {
        const count = Math.floor(seconds / value);
        if (count >= 1) {
            const plural = count > 1 ? (unit === 'mois' ? 'mois' : unit + 's') : unit;
            return `il y a ${count} ${plural}`;
        }
    }
    return 'à l\'instant';
};

// Calculer la durée entre deux dates (en heures)
const getDurationInHours = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return (end - start) / (1000 * 60 * 60);
};

// ==================== SÉCURITÉ ====================

// Nettoyer une entrée utilisateur (XSS prevention)
const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};

// Masquer des données sensibles
const maskSensitiveData = (data, fields = ['password', 'password_hash', 'token']) => {
    const masked = { ...data };
    for (const field of fields) {
        if (masked[field]) {
            masked[field] = '********';
        }
    }
    return masked;
};

// ==================== EXPORT ====================

module.exports = {
    // Formatage
    formatDate,
    formatCurrency,
    formatPhoneNumber,
    formatCIN,
    truncateText,
    capitalize,
    
    // Validation
    isValidEmail,
    isValidPhone,
    isValidCIN,
    isValidPostalCode,
    isValidName,
    isValidReference,
    isValidCoordinates,
    
    // Génération
    generateUniqueId,
    generateRandomToken,
    generateVerificationCode,
    generateSlug,
    
    // Manipulation de données
    groupBy,
    average,
    percentage,
    cleanObject,
    deepMerge,
    
    // Fichiers
    deleteFile,
    getFileExtension,
    getMimeType,
    
    // Pagination
    paginate,
    
    // Temps
    timeAgo,
    getDurationInHours,
    
    // Sécurité
    sanitizeInput,
    maskSensitiveData
};