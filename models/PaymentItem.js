const db = require('../config/database');

class PaymentItem {
    static table = 'payment_items';

    static async findAll(filters = {}) {
        let query = `
            SELECT pi.id, pi.amount, pi.created_at,
                   pd.id as distribution_id, pd.total_amount, pd.distributed_at,
                   e.id as employer_id, e.first_name, e.last_name, e.email,
                   t.id as task_id, t.description as task_description,
                   r.reference as reclamation_reference
            FROM payment_items pi
            LEFT JOIN payment_distributions pd ON pi.payment_distribution_id = pd.id
            LEFT JOIN employer e ON pi.employer_id = e.id
            LEFT JOIN tasks t ON pi.task_id = t.id
            LEFT JOIN reclamation_organizations ro ON t.reclamation_org_id = ro.id
            LEFT JOIN reclamations r ON ro.reclamation_id = r.id
            WHERE 1=1
        `;
        const values = [];
        let idx = 1;

        if (filters.employer_id) {
            query += ` AND pi.employer_id = $${idx++}`;
            values.push(filters.employer_id);
        }
        if (filters.payment_distribution_id) {
            query += ` AND pi.payment_distribution_id = $${idx++}`;
            values.push(filters.payment_distribution_id);
        }
        if (filters.start_date) {
            query += ` AND pi.created_at >= $${idx++}`;
            values.push(filters.start_date);
        }
        if (filters.end_date) {
            query += ` AND pi.created_at <= $${idx++}`;
            values.push(filters.end_date);
        }

        query += ` ORDER BY pi.created_at DESC`;

        if (filters.limit) {
            query += ` LIMIT $${idx++}`;
            values.push(filters.limit);
            if (filters.offset) {
                query += ` OFFSET $${idx++}`;
                values.push(filters.offset);
            }
        }

        const result = await db.query(query, values);
        return result.rows;
    }

    static async findById(id) {
        const result = await db.query(
            `SELECT pi.*, 
                    e.first_name, e.last_name, e.email,
                    t.description as task_description
             FROM ${this.table} pi
             LEFT JOIN employer e ON pi.employer_id = e.id
             LEFT JOIN tasks t ON pi.task_id = t.id
             WHERE pi.id = $1`,
            [id]
        );
        return result.rows[0];
    }

    static async findByEmployer(employerId) {
        const result = await db.query(
            `SELECT pi.id, pi.amount, pi.created_at,
                    pd.distributed_at,
                    r.reference, r.title,
                    t.description as task_description
             FROM payment_items pi
             LEFT JOIN payment_distributions pd ON pi.payment_distribution_id = pd.id
             LEFT JOIN tasks t ON pi.task_id = t.id
             LEFT JOIN reclamation_organizations ro ON t.reclamation_org_id = ro.id
             LEFT JOIN reclamations r ON ro.reclamation_id = r.id
             WHERE pi.employer_id = $1
             ORDER BY pi.created_at DESC`,
            [employerId]
        );
        return result.rows;
    }

    static async findByDistribution(paymentDistributionId) {
        const result = await db.query(
            `SELECT pi.*, e.first_name, e.last_name, e.email
             FROM ${this.table} pi
             LEFT JOIN employer e ON pi.employer_id = e.id
             WHERE pi.payment_distribution_id = $1
             ORDER BY pi.created_at ASC`,
            [paymentDistributionId]
        );
        return result.rows;
    }

    static async create(data) {
        const { payment_distribution_id, employer_id, amount, task_id = null } = data;
        const result = await db.query(
            `INSERT INTO ${this.table} (payment_distribution_id, employer_id, amount, task_id) 
             VALUES ($1, $2, $3, $4) 
             RETURNING *`,
            [payment_distribution_id, employer_id, amount, task_id]
        );
        
        // Mettre à jour le payment_status de la tâche
        if (task_id) {
            await db.query(
                `UPDATE tasks SET payment_status = 'paid', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
                [task_id]
            );
        }
        
        return result.rows[0];
    }

    static async createMultiple(paymentDistributionId, items) {
        const results = [];
        for (const item of items) {
            const result = await this.create({
                payment_distribution_id: paymentDistributionId,
                employer_id: item.employer_id,
                amount: item.amount,
                task_id: item.task_id
            });
            results.push(result);
        }
        return results;
    }

    static async delete(id) {
        const result = await db.query(
            `DELETE FROM ${this.table} WHERE id = $1 RETURNING id`,
            [id]
        );
        return result.rows[0];
    }

    static async deleteByDistribution(paymentDistributionId) {
        const result = await db.query(
            `DELETE FROM ${this.table} WHERE payment_distribution_id = $1 RETURNING id`,
            [paymentDistributionId]
        );
        return result.rows;
    }

    static async getTotalByEmployer(employerId) {
        const result = await db.query(
            `SELECT COALESCE(SUM(amount), 0) as total
             FROM ${this.table}
             WHERE employer_id = $1`,
            [employerId]
        );
        return parseFloat(result.rows[0].total);
    }

    static async verifyTotal(paymentDistributionId) {
        const result = await db.query(
            `SELECT 
                pd.total_amount as expected_total,
                COALESCE(SUM(pi.amount), 0) as actual_total,
                CASE WHEN pd.total_amount = COALESCE(SUM(pi.amount), 0) THEN 'OK' ELSE 'MISMATCH' END as status
             FROM payment_distributions pd
             LEFT JOIN payment_items pi ON pd.id = pi.payment_distribution_id
             WHERE pd.id = $1
             GROUP BY pd.id`,
            [paymentDistributionId]
        );
        return result.rows[0];
    }
}

module.exports = PaymentItem;