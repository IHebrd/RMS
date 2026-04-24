const db = require('../config/database');
const PaymentDistribution = require('../models/PaymentDistribution');
const PaymentItem = require('../models/PaymentItem');
const Employer = require('../models/Employer');
const { sendEmail, emailTemplates } = require('./emailService');

// Créer une distribution de paiement complète
const createPaymentDistribution = async (reclamationOrgId, responsableId, distributions) => {
    const client = await db.getClient();
    
    try {
        await client.query('BEGIN');
        
        // Récupérer le montant total de la réclamation
        const reclamationResult = await client.query(
            `SELECT r.amount, r.reference, r.title, u.email as user_email, u.first_name as user_first_name
             FROM reclamation_organizations ro
             JOIN reclamations r ON ro.reclamation_id = r.id
             JOIN "user" u ON r.user_id = u.id
             WHERE ro.id = $1`,
            [reclamationOrgId]
        );
        
        const totalAmount = parseFloat(reclamationResult.rows[0].amount);
        
        // Vérifier la cohérence des montants
        const distributedAmount = distributions.reduce((sum, d) => sum + parseFloat(d.amount), 0);
        
        if (Math.abs(distributedAmount - totalAmount) > 0.01) {
            throw new Error(`Montant distribué (${distributedAmount}) != montant réclamation (${totalAmount})`);
        }
        
        // Créer la distribution
        const paymentDistribution = await PaymentDistribution.create({
            reclamation_org_id: reclamationOrgId,
            responsable_id: responsableId,
            total_amount: totalAmount
        });
        
        // Créer les items et mettre à jour les soldes
        const paymentItems = [];
        for (const dist of distributions) {
            const item = await PaymentItem.create({
                payment_distribution_id: paymentDistribution.id,
                employer_id: dist.employer_id,
                amount: parseFloat(dist.amount),
                task_id: dist.task_id
            });
            paymentItems.push(item);
        }
        
        await client.query('COMMIT');
        
        // Envoyer les emails aux employés
        for (const dist of distributions) {
            const employer = await Employer.findById(dist.employer_id);
            if (employer && employer.email) {
                await sendEmail(
                    employer.email,
                    'Paiement reçu sur votre compte RMS',
                    emailTemplates.paymentReceived(employer.first_name, dist.amount),
                    'employer',
                    employer.id,
                    'payment_received',
                    null,
                    dist.task_id
                );
            }
        }
        
        return {
            success: true,
            distribution: paymentDistribution,
            items: paymentItems
        };
        
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

// Vérifier la cohérence des paiements d'une réclamation
const verifyPaymentConsistency = async (reclamationOrgId) => {
    const result = await db.query(
        `SELECT 
            pd.id,
            pd.total_amount as expected_total,
            COALESCE(SUM(pi.amount), 0) as actual_total,
            CASE WHEN pd.total_amount = COALESCE(SUM(pi.amount), 0) THEN 'OK' ELSE 'MISMATCH' END as status
         FROM payment_distributions pd
         LEFT JOIN payment_items pi ON pd.id = pi.payment_distribution_id
         WHERE pd.reclamation_org_id = $1
         GROUP BY pd.id`,
        [reclamationOrgId]
    );
    
    return result.rows;
};

// Obtenir le solde d'un employé avec détails
const getEmployerBalanceDetails = async (employerId) => {
    const employer = await Employer.findById(employerId);
    const payments = await PaymentItem.findByEmployer(employerId);
    
    const totalEarned = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    
    return {
        employer_id: employerId,
        name: `${employer.first_name} ${employer.last_name}`,
        current_balance: parseFloat(employer.balance),
        total_earned: totalEarned,
        payment_history: payments.map(p => ({
            id: p.id,
            amount: parseFloat(p.amount),
            date: p.distributed_at || p.created_at,
            reclamation_reference: p.reference,
            task_description: p.task_description
        }))
    };
};

// Distribuer un paiement depuis un compte externe (simulation)
const processExternalPayment = async (reclamationId, amount, paymentMethod) => {
    // Simulation de traitement de paiement externe
    // Dans un vrai système, intégrer Stripe, PayPal, etc.
    
    const paymentResult = {
        success: true,
        transaction_id: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount: amount,
        method: paymentMethod,
        timestamp: new Date().toISOString()
    };
    
    // Mettre à jour le statut de paiement de la réclamation
    await db.query(
        `UPDATE reclamations 
         SET payment_status = 'paid', 
             payment_transaction_id = $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [paymentResult.transaction_id, reclamationId]
    );
    
    return paymentResult;
};

// Statistiques globales des paiements
const getPaymentStatistics = async (organizationId = null) => {
    let query = `
        SELECT 
            COUNT(DISTINCT pd.id) as total_distributions,
            COALESCE(SUM(pd.total_amount), 0) as total_amount_distributed,
            COUNT(DISTINCT pi.employer_id) as total_employers_paid,
            AVG(pd.total_amount) as average_distribution_amount
        FROM payment_distributions pd
        LEFT JOIN payment_items pi ON pd.id = pi.payment_distribution_id
        LEFT JOIN reclamation_organizations ro ON pd.reclamation_org_id = ro.id
    `;
    
    const values = [];
    
    if (organizationId) {
        query += ` WHERE ro.organization_id = $1`;
        values.push(organizationId);
    }
    
    const result = await db.query(query, values);
    
    // Top 5 des employés les mieux payés
    const topEarners = await db.query(`
        SELECT 
            e.id,
            e.first_name || ' ' || e.last_name as name,
            COALESCE(SUM(pi.amount), 0) as total_earned
        FROM employer e
        LEFT JOIN payment_items pi ON e.id = pi.employer_id
        ${organizationId ? 'WHERE e.organization_id = $1' : ''}
        GROUP BY e.id
        ORDER BY total_earned DESC
        LIMIT 5
    `, organizationId ? [organizationId] : []);
    
    return {
        statistics: result.rows[0],
        top_earners: topEarners.rows
    };
};

module.exports = {
    createPaymentDistribution,
    verifyPaymentConsistency,
    getEmployerBalanceDetails,
    processExternalPayment,
    getPaymentStatistics
};