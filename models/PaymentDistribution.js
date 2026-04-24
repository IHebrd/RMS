const db = require('../config/database');

class PaymentDistribution {
    static table = 'payment_distributions';

    static async findAll(filters = {}) {
        let query = `
            SELECT pd.id, pd.total_amount, pd.distributed_at,
                   ro.id as reclamation_org_id, r.reference, r.title,
                   o.name as organization_name,
                   resp.first_name || ' ' || resp.last_name as responsable_name
            FROM payment_distributions pd
            LEFT JOIN reclamation_organizations ro ON pd.reclamation_org_id = ro.id
            LEFT JOIN reclamations r ON ro.reclamation_id = r.id
            LEFT JOIN organizations o ON ro.organization_id = o.id
            LEFT JOIN responsable resp ON pd.responsable_id = resp.id
            WHERE 1=1
        `;
        const values = [];
        let idx = 1;

        if (filters.reclamation_org_id) {
            query += ` AND pd.reclamation_org_id = $${idx++}`;
            values.push(filters.reclamation_org_id);
        }
        if (filters.responsable_id) {
            query += ` AND pd.responsable_id = $${idx++}`;
            values.push(filters.responsable_id);
        }
        if (filters.start_date) {
            query += ` AND pd.distributed_at >= $${idx++}`;
            values.push(filters.start_date);
        }
        if (filters.end_date) {
            query += ` AND pd.distributed_at <= $${idx++}`;
            values.push(filters.end_date);
        }

        query += ` ORDER BY pd.distributed_at DESC`;

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
            `SELECT pd.*, 
                    ro.id as reclamation_org_id, r.reference, r.title,
                    o.name as organization_name,
                    resp.id as responsable_id, resp.first_name, resp.last_name
             FROM ${this.table} pd
             LEFT JOIN reclamation_organizations ro ON pd.reclamation_org_id = ro.id
             LEFT JOIN reclamations r ON ro.reclamation_id = r.id
             LEFT JOIN organizations o ON ro.organization_id = o.id
             LEFT JOIN responsable resp ON pd.responsable_id = resp.id
             WHERE pd.id = $1`,
            [id]
        );
        return result.rows[0];
    }

    static async findByReclamationOrg(reclamationOrgId) {
        const result = await db.query(
            `SELECT pd.*, 
                    json_agg(jsonb_build_object('employer_id', pi.employer_id, 'amount', pi.amount, 'task_id', pi.task_id)) as items
             FROM ${this.table} pd
             LEFT JOIN payment_items pi ON pd.id = pi.payment_distribution_id
             WHERE pd.reclamation_org_id = $1
             GROUP BY pd.id
             ORDER BY pd.distributed_at DESC`,
            [reclamationOrgId]
        );
        return result.rows;
    }

    static async create(data) {
        const { reclamation_org_id, responsable_id, total_amount } = data;
        const result = await db.query(
            `INSERT INTO ${this.table} (reclamation_org_id, responsable_id, total_amount) 
             VALUES ($1, $2, $3) 
             RETURNING *`,
            [reclamation_org_id, responsable_id, total_amount]
        );
        return result.rows[0];
    }

    static async update(id, data) {
        const fields = [];
        const values = [];
        let idx = 1;

        const allowedFields = ['total_amount'];
        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                fields.push(`${field} = $${idx++}`);
                values.push(data[field]);
            }
        }

        if (fields.length === 0) return null;

        values.push(id);
        const result = await db.query(
            `UPDATE ${this.table} SET ${fields.join(', ')} 
             WHERE id = $${idx} RETURNING *`,
            values
        );
        return result.rows[0];
    }

    static async delete(id) {
        // D'abord supprimer les payment_items associés
        await db.query(`DELETE FROM payment_items WHERE payment_distribution_id = $1`, [id]);
        
        const result = await db.query(
            `DELETE FROM ${this.table} WHERE id = $1 RETURNING id`,
            [id]
        );
        return result.rows[0];
    }

    static async getTotalDistributedByResponsable(responsableId) {
        const result = await db.query(
            `SELECT COALESCE(SUM(total_amount), 0) as total
             FROM ${this.table}
             WHERE responsable_id = $1`,
            [responsableId]
        );
        return parseFloat(result.rows[0].total);
    }
}

module.exports = PaymentDistribution;