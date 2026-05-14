const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Configuration du hachage
const SALT_ROUNDS = 10;

// ==================== HACHAGE BCrypt ====================

// Hacher un mot de passe avec bcrypt
const hashPassword = async (password) => {
    if (!password) {
        throw new Error('Le mot de passe est requis');
    }
    
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hash = await bcrypt.hash(password, salt);
    return hash;
};

// Vérifier un mot de passe avec bcrypt
const verifyPassword = async (password, hashedPassword) => {
    if (!password || !hashedPassword) {
        return false;
    }
    return await bcrypt.compare(password, hashedPassword);
};

// ==================== HACHAGE SHA256 ====================

// Hacher une chaîne avec SHA256
const hashSHA256 = (text) => {
    return crypto.createHash('sha256').update(text).digest('hex');
};

// Vérifier une chaîne hachée avec SHA256
const verifySHA256 = (text, hash) => {
    return hashSHA256(text) === hash;
};

// ==================== HACHAGE MD5 (non sécurisé, pour compatibilité) ====================

// Hacher une chaîne avec MD5 (à utiliser uniquement pour des données non sensibles)
const hashMD5 = (text) => {
    return crypto.createHash('md5').update(text).digest('hex');
};

// Vérifier une chaîne hachée avec MD5
const verifyMD5 = (text, hash) => {
    return hashMD5(text) === hash;
};

// ==================== GÉNÉRATION DE TOKENS ====================

// Générer un token sécurisé
const generateSecureToken = (length = 32) => {
    return crypto.randomBytes(length).toString('hex');
};

// Générer un token de réinitialisation de mot de passe
const generateResetToken = () => {
    return generateSecureToken(32);
};

// Générer un token d'API
const generateApiToken = () => {
    return `rms_${generateSecureToken(24)}`;
};

// ==================== HACHAGE AVEC SEL PERSONNALISÉ ====================

// Hacher avec un sel personnalisé
const hashWithCustomSalt = async (password, customSalt) => {
    if (!customSalt) {
        return hashPassword(password);
    }
    return await bcrypt.hash(password, customSalt);
};

// Générer un sel personnalisé
const generateCustomSalt = async () => {
    return await bcrypt.genSalt(SALT_ROUNDS);
};

// ==================== VALIDATION DE FORCE ====================

// Vérifier la force d'un mot de passe (critères avancés)
const checkPasswordStrength = (password) => {
    const checks = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    const score = Object.values(checks).filter(Boolean).length;
    
    let strength = 'weak';
    if (score >= 5) strength = 'very_strong';
    else if (score >= 4) strength = 'strong';
    else if (score >= 3) strength = 'medium';
    
    return {
        score,
        strength,
        checks,
        isValid: score >= 3
    };
};

// Obtenir des suggestions pour améliorer le mot de passe
const getPasswordSuggestions = (password) => {
    const suggestions = [];
    
    if (password.length < 8) {
        suggestions.push('Utilisez au moins 8 caractères');
    }
    if (!/[A-Z]/.test(password)) {
        suggestions.push('Ajoutez au moins une majuscule');
    }
    if (!/[a-z]/.test(password)) {
        suggestions.push('Ajoutez au moins une minuscule');
    }
    if (!/\d/.test(password)) {
        suggestions.push('Ajoutez au moins un chiffre');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        suggestions.push('Ajoutez au moins un caractère spécial (!@#$%^&* etc.)');
    }
    
    return suggestions;
};

// ==================== CHIFFREMENT/DÉCHIFFREMENT (AES) ====================

// Chiffrer des données sensibles avec AES-256-CBC
const encryptData = (text, secretKey) => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(secretKey, 'hex'), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return {
        iv: iv.toString('hex'),
        encryptedData: encrypted
    };
};

// Déchiffrer des données
const decryptData = (encryptedData, iv, secretKey) => {
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secretKey, 'hex'), Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};

// Générer une clé secrète AES
const generateAESKey = () => {
    return crypto.randomBytes(32).toString('hex');
};

// ==================== COMPARAISON SÉCURISÉE ====================

// Comparaison sécurisée de chaînes (timing attack safe)
const secureCompare = (a, b) => {
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
};

// ==================== EXPORT ====================

module.exports = {
    // BCrypt
    hashPassword,
    verifyPassword,
    
    // SHA256
    hashSHA256,
    verifySHA256,
    
    // MD5 (non sécurisé)
    hashMD5,
    verifyMD5,
    
    // Tokens
    generateSecureToken,
    generateResetToken,
    generateApiToken,
    
    // Sel personnalisé
    hashWithCustomSalt,
    generateCustomSalt,
    
    // Validation de force
    checkPasswordStrength,
    getPasswordSuggestions,
    
    // AES
    encryptData,
    decryptData,
    generateAESKey,
    
    // Comparaison sécurisée
    secureCompare,
    
    // Constantes
    SALT_ROUNDS
};