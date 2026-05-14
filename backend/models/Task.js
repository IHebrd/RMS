const db = require('../config/database');

class Task {
    static table = 'tasks';

    static async findAll(filters = {}) {
        let query = `
            SELECT t.id, t.description, t.status, t.payment_amount, t.payment_status,
                   t.scheduled_date, t.completed_at, t.created_at, t.updated_at,
                   e.id as employer_id, e.first_name, e.last_name, e.phone,
                   r.reference, r.title as reclamation_title,
                   o.name as organization_name
            FROM tasks t
            LEFT JOIN employer e ON t.employer_id = e.id
            LEFT JOIN reclamation_organizations ro ON t.reclamation_org_id = ro.id
            LEFT JOIN reclamations r ON ro.reclamation_id = r.id
            LEFT JOIN organizations o ON ro.organization_id = o.id
            WHERE 1=1
        `;
        const values = [];
        let idx = 1;

        if (filters.employer_id) {
            query += ` AND t.employer_id = $${idx++}`;
            values.push(filters.employer_id);
        }
        if (filters.reclamation_org_id) {
            query += ` AND t.reclamation_org_id = $${idx++}`;
            values.push(filters.reclamation_org_id);
        }
        if (filters.status) {
            query += ` AND t.status = $${idx++}`;
            values.push(filters.status);
        }
        if (filters.payment_status) {
            query += ` AND t.payment_status = $${idx++}`;
            values.push(filters.payment_status);
        }
        if (filters.scheduled_from) {
            query += ` AND t.scheduled_date >= $${idx++}`;
            values.push(filters.scheduled_from);
        }
        if (filters.scheduled_to) {
            query += ` AND t.scheduled_date <= $${idx++}`;
            values.push(filters.scheduled_to);
        }

        query += ` ORDER BY t.scheduled_date ASC NULLS LAST, t.created_at DESC`;

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
            `SELECT t.*, 
                    e.id as employer_id, e.first_name, e.last_name, e.email, e.phone,
                    r.reference, r.title, r.description, r.type, r.urgency,
                    u.id as user_id, u.first_name as user_first_name, u.last_name as user_last_name, u.phone as user_phone, u.address
             FROM tasks t
             LEFT JOIN employer e ON t.employer_id = e.id
             LEFT JOIN reclamation_organizations ro ON t.reclamation_org_id = ro.id
             LEFT JOIN reclamations r ON ro.reclamation_id = r.id
             LEFT JOIN "user" u ON r.user_id = u.id
             WHERE t.id = $1`,
            [id]
        );
        return result.rows[0];
    }

    static async findByEmployer(employerId, filters = {}) {
        let query = `
            SELECT t.id, t.description, t.status, t.payment_amount, t.scheduled_date, t.completed_at, t.created_at,
                   r.reference, r.title, r.type, r.urgency,
                   o.name as organization_name
            FROM tasks t
            LEFT JOIN reclamation_organizations ro ON t.reclamation_org_id = ro.id
            LEFT JOIN reclamations r ON ro.reclamation_id = r.id
            LEFT JOIN organizations o ON ro.organization_id = o.id
            WHERE t.employer_id = $1
        `;
        const values = [employerId];
        let idx = 2;

        if (filters.status) {
            if (Array.isArray(filters.status)) {
                const placeholders = filters.status.map((_, i) => `$${idx + i}`).join(', ');
                query += ` AND t.status IN (${placeholders})`;
                filters.status.forEach(s => values.push(s));
                idx += filters.status.length;
            } else {
                query += ` AND t.status = $${idx++}`;
                values.push(filters.status);
            }
        }

        query += ` ORDER BY t.status = 'assigned' DESC, t.status = 'in_progress' DESC, t.scheduled_date ASC`;

        if (filters.limit) {
            query += ` LIMIT $${idx++}`;
            values.push(filters.limit);
        }

        const result = await db.query(query, values);
        return result.rows;
    }

    static async findByReclamationOrg(reclamationOrgId) {
        const result = await db.query(
            `SELECT t.*, e.first_name, e.last_name
             FROM ${this.table} t
             LEFT JOIN employer e ON t.employer_id = e.id
             WHERE t.reclamation_org_id = $1
             ORDER BY t.created_at ASC`,
            [reclamationOrgId]
        );
        return result.rows;
    }

    static async create(data) {
        const { reclamation_org_id, employer_id, description, status = 'assigned', payment_amount = 0, payment_status = 'pending', scheduled_date = null } = data;
        const result = await db.query(
            `INSERT INTO ${this.table} (reclamation_org_id, employer_id, description, status, payment_amount, payment_status, scheduled_date) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) 
             RETURNING *`,
            [reclamation_org_id, employer_id, description, status, payment_amount, payment_status, scheduled_date]
        );
        return result.rows[0];
    }

    static async createMultiple(reclamationOrgId, tasksData) {
        const results = [];
        for (const taskData of tasksData) {
            const result = await this.create({
                reclamation_org_id: reclamationOrgId,
                ...taskData
            });
            results.push(result);
        }
        return results;
    }

    static async update(id, data) {
        const fields = [];
        const values = [];
        let idx = 1;

        const allowedFields = ['description', 'status', 'payment_amount', 'payment_status', 'scheduled_date', 'completed_at'];
        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                fields.push(`${field} = $${idx++}`);
                values.push(data[field]);
            }
        }

        if (fields.length === 0) return null;

        values.push(id);
        const result = await db.query(
            `UPDATE ${this.table} SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $${idx} RETURNING *`,
            values
        );
        return result.rows[0];
    }

    static async updateStatus(id, status, completedAt = null) {
        const updateData = { status };
        if (status === 'completed' && completedAt) {
            updateData.completed_at = completedAt;
        }
        return this.update(id, updateData);
    }

    static async updatePaymentStatus(id, payment_status) {
        return this.update(id, { payment_status });
    }

    static async delete(id) {
        const result = await db.query(
            `DELETE FROM ${this.table} WHERE id = $1 RETURNING id`,
            [id]
        );
        return result.rows[0];
    }

    static async countByEmployer(employerId, status = null) {
        let query = `SELECT COUNT(*) FROM ${this.table} WHERE employer_id = $1`;
        const values = [employerId];
        
        if (status) {
            query += ` AND status = $2`;
            values.push(status);
        }
        
        const result = await db.query(query, values);
        return parseInt(result.rows[0].count);
    }

    static async getStatsByEmployer(employerId) {
        const result = await db.query(
            `SELECT 
                COUNT(CASE WHEN status = 'assigned' THEN 1 END) as assigned,
                COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
                COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
                COALESCE(SUM(payment_amount), 0) as total_pending_payment
             FROM tasks
             WHERE employer_id = $1`,
            [employerId]
        );
        return result.rows[0];
    }
}

module.exports = Task;