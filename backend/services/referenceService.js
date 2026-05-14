const db = require('../config/database');

// Générer une référence pour une réclamation (format: REC-YYYY-XXXXXX)
const generateReclamationReference = async () => {
    const year = new Date().getFullYear();
    const yearPrefix = `REC-${year}-`;
    
    // Récupérer le dernier numéro de séquence pour l'année en cours
    const result = await db.query(
        `SELECT MAX(CAST(SUBSTRING(reference FROM 10) AS INTEGER)) as last_num
         FROM reclamations
         WHERE reference LIKE $1`,
        [`${yearPrefix}%`]
    );
    
    const lastNum = result.rows[0].last_num || 0;
    const newNum = lastNum + 1;
    const sequence = newNum.toString().padStart(6, '0');
    
    return `${yearPrefix}${sequence}`;
};

// Générer une référence pour une tâche (format: TSK-YYYY-XXXXXX)
const generateTaskReference = async () => {
    const year = new Date().getFullYear();
    const yearPrefix = `TSK-${year}-`;
    
    const result = await db.query(
        `SELECT MAX(CAST(SUBSTRING(reference FROM 9) AS INTEGER)) as last_num
         FROM tasks
         WHERE reference LIKE $1`,
        [`${yearPrefix}%`]
    );
    
    const lastNum = result.rows[0].last_num || 0;
    const newNum = lastNum + 1;
    const sequence = newNum.toString().padStart(6, '0');
    
    return `${yearPrefix}${sequence}`;
};

// Générer une référence pour un paiement (format: PAY-YYYY-XXXXXX)
const generatePaymentReference = async () => {
    const year = new Date().getFullYear();
    const yearPrefix = `PAY-${year}-`;
    
    const result = await db.query(
        `SELECT MAX(CAST(SUBSTRING(reference FROM 9) AS INTEGER)) as last_num
         FROM payment_distributions
         WHERE reference LIKE $1`,
        [`${yearPrefix}%`]
    );
    
    const lastNum = result.rows[0].last_num || 0;
    const newNum = lastNum + 1;
    const sequence = newNum.toString().padStart(6, '0');
    
    return `${yearPrefix}${sequence}`;
};

// Valider le format d'une référence
const validateReference = (reference, type) => {
    const patterns = {
        reclamation: /^REC-\d{4}-\d{6}$/,
        task: /^TSK-\d{4}-\d{6}$/,
        payment: /^PAY-\d{4}-\d{6}$/
    };
    
    const pattern = patterns[type];
    if (!pattern) return false;
    
    return pattern.test(reference);
};

// Extraire l'année et le numéro d'une référence
const parseReference = (reference) => {
    const match = reference.match(/^([A-Z]+)-(\d{4})-(\d{6})$/);
    if (!match) return null;
    
    return {
        prefix: match[1],
        year: parseInt(match[2]),
        sequence: parseInt(match[3]),
        full: reference
    };
};

module.exports = {
    generateReclamationReference,
    generateTaskReference,
    generatePaymentReference,
    validateReference,
    parseReference
};