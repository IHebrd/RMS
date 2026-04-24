const db = require('../config/database');
const Employer = require('../models/Employer');
const PaymentItem = require('../models/PaymentItem');

// Mettre à jour le solde d'un employé
const updateEmployerBalance = async (employerId, amount) => {
    const employer = await Employer.findById(employerId);
    
    if (!employer) {
        throw new Error(`Employé non trouvé: ${employerId}`);
    }
    
    const newBalance = parseFloat(employer.balance) + parseFloat(amount);
    
    const updated = await Employer.updateBalance(employerId, amount);
    
    return {
        employer_id: employerId,
        old_balance: parseFloat(employer.balance),
        amount_changed: parseFloat(amount),
        new_balance: parseFloat(updated.balance)
    };
};

// Recalculer le solde d'un employé depuis l'historique
const recalculateEmployerBalance = async (employerId) => {
    const totalEarned = await PaymentItem.getTotalByEmployer(employerId);
    
    const updated = await Employer.update(employerId, { balance: totalEarned });
    
    return {
        employer_id: employerId,
        recalculated_balance: totalEarned,
        previous_balance: updated.balance
    };
};

// Obtenir le solde avec détails
const getBalanceWithDetails = async (employerId) => {
    const employer = await Employer.findById(employerId);
    
    if (!employer) {
        throw new Error(`Employé non trouvé: ${employerId}`);
    }
    
    const payments = await PaymentItem.findByEmployer(employerId);
    const totalEarned = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    
    // Dernier paiement
    const lastPayment = payments.length > 0 ? payments[0] : null;
    
    // Statistiques par mois
    const monthlyStats = await db.query(`
        SELECT 
            DATE_TRUNC('month', created_at) as month,
            SUM(amount) as total
        FROM payment_items
        WHERE employer_id = $1
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month DESC
    `, [employerId]);
    
    return {
        employer_id: employerId,
        name: `${employer.first_name} ${employer.last_name}`,
        email: employer.email,
        organization: employer.organization_name,
        current_balance: parseFloat(employer.balance),
        total_earned: totalEarned,
        last_payment: lastPayment ? {
            amount: parseFloat(lastPayment.amount),
            date: lastPayment.distributed_at || lastPayment.created_at,
            reclamation_reference: lastPayment.reference,
            task_description: lastPayment.task_description
        } : null,
        monthly_statistics: monthlyStats.rows.map(row => ({
            month: row.month,
            total: parseFloat(row.total)
        })),
        payment_history: payments.map(p => ({
            id: p.id,
            amount: parseFloat(p.amount),
            date: p.distributed_at || p.created_at,
            reclamation_reference: p.reference,
            reclamation_title: p.title,
            task_description: p.task_description
        }))
    };
};

// Vérifier et corriger les soldes de tous les employés d'une organisation
const reconcileOrganizationBalances = async (organizationId) => {
    const employers = await Employer.findAll({ organization_id: organizationId });
    const results = [];
    
    for (const employer of employers) {
        const recalculated = await recalculateEmployerBalance(employer.id);
        results.push({
            employer_id: employer.id,
            name: `${employer.first_name} ${employer.last_name}`,
            was_correct: employer.balance === recalculated.recalculated_balance,
            old_balance: employer.balance,
            new_balance: recalculated.recalculated_balance
        });
    }
    
    return results;
};

// Transfert de solde entre employés (pour correction)
const transferBalance = async (fromEmployerId, toEmployerId, amount, reason) => {
    const client = await db.getClient();
    
    try {
        await client.query('BEGIN');
        
        const fromEmployer = await Employer.findById(fromEmployerId);
        const toEmployer = await Employer.findById(toEmployerId);
        
        if (!fromEmployer || !toEmployer) {
            throw new Error('Employé non trouvé');
        }
        
        if (parseFloat(fromEmployer.balance) < amount) {
            throw new Error('Solde insuffisant');
        }
        
        // Débiter l'employé source
        await Employer.updateBalance(fromEmployerId, -amount);
        
        // Créditer l'employé destination
        await Employer.updateBalance(toEmployerId, amount);
        
        // Enregistrer la transaction de transfert
        await client.query(
            `INSERT INTO payment_items (payment_distribution_id, employer_id, amount, task_id, transfer_reference, transfer_reason)
             VALUES (NULL, $1, $2, NULL, $3, $4)`,
            [toEmployerId, amount, `TRANSFER_${Date.now()}`, reason]
        );
        
        await client.query('COMMIT');
        
        return {
            success: true,
            from_employer: fromEmployerId,
            to_employer: toEmployerId,
            amount: amount,
            reason: reason,
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

// Export des soldes pour rapports
const exportBalances = async (organizationId = null) => {
    let query = `
        SELECT 
            e.id,
            e.first_name || ' ' || e.last_name as name,
            e.email,
            o.name as organization_name,
            e.balance,
            COALESCE(SUM(pi.amount), 0) as total_earned,
            COUNT(DISTINCT pi.id) as payment_count
        FROM employer e
        LEFT JOIN organizations o ON e.organization_id = o.id
        LEFT JOIN payment_items pi ON e.id = pi.employer_id
    `;
    
    const values = [];
    
    if (organizationId) {
        query += ` WHERE e.organization_id = $1`;
        values.push(organizationId);
    }
    
    query += ` GROUP BY e.id, o.name ORDER BY e.balance DESC`;
    
    const result = await db.query(query, values);
    
    return result.rows;
};

module.exports = {
    updateEmployerBalance,
    recalculateEmployerBalance,
    getBalanceWithDetails,
    reconcileOrganizationBalances,
    transferBalance,
    exportBalances
};