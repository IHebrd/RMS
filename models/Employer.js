const db = require('../config/database');

class Employer {
    static table = 'employer';

    static async findAll(filters = {}) {
        let query = `
            SELECT e.id, e.email, e.first_name, e.last_name, e.phone, e.avatar, e.cin, 
                   e.balance, e.skills, e.is_active, e.last_login, e.created_at,
                   o.id as organization_id, o.name as organization_name, o.type as organization_type
            FROM employer e
            LEFT JOIN organizations o ON e.organization_id = o.id
            WHERE 1=1
        `;
        const values = [];
        let idx = 1;

        if (filters.organization_id) {
            query += ` AND e.organization_id = $${idx++}`;
            values.push(filters.organization_id);
        }
        if (filters.is_active !== undefined) {
            query += ` AND e.is_active = $${idx++}`;
            values.push(filters.is_active);
        }
        if (filters.min_balance !== undefined) {
            query += ` AND e.balance >= $${idx++}`;
            values.push(filters.min_balance);
        }
        if (filters.search) {
            query += ` AND (e.first_name ILIKE $${idx++} OR e.last_name ILIKE $${idx++} OR e.email ILIKE $${idx++})`;
            values.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
        }
        if (filters.skill) {
            query += ` AND $${idx++} = ANY(e.skills)`;
            values.push(filters.skill);
        }

        query += ` ORDER BY e.created_at DESC`;

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
            `SELECT e.*, o.name as organization_name, o.type as organization_type
             FROM ${this.table} e
             LEFT JOIN organizations o ON e.organization_id = o.id
             WHERE e.id = $1`,
            [id]
        );
        return result.rows[0];
    }

    static async findByEmail(email) {
        const result = await db.query(
            `SELECT * FROM ${this.table} WHERE email = $1`,
            [email]
        );
        return result.rows[0];
    }

    static async findByCin(cin) {
        const result = await db.query(
            `SELECT * FROM ${this.table} WHERE cin = $1`,
            [cin]
        );
        return result.rows[0];
    }

    static async findByOrganization(organizationId) {
        const result = await db.query(
            `SELECT id, email, first_name, last_name, phone, avatar, balance, skills, is_active 
             FROM ${this.table} WHERE organization_id = $1`,
            [organizationId]
        );
        return result.rows;
    }

    static async create(data) {
        const { email, password_hash, first_name, last_name, phone, avatar, cin, organization_id, balance = 0, skills = [] } = data;
        const result = await db.query(
            `INSERT INTO ${this.table} (email, password_hash, first_name, last_name, phone, avatar, cin, organization_id, balance, skills) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
             RETURNING id, email, first_name, last_name, phone, avatar, cin, organization_id, balance, skills, is_active, created_at`,
            [email, password_hash, first_name, last_name, phone, avatar, cin, organization_id, balance, skills]
        );
        return result.rows[0];
    }

    static async update(id, data) {
        const fields = [];
        const values = [];
        let idx = 1;

        const allowedFields = ['email', 'password_hash', 'first_name', 'last_name', 'phone', 'avatar', 'cin', 'organization_id', 'balance', 'skills', 'is_active', 'last_login'];
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

    static async updateBalance(id, amount) {
        const result = await db.query(
            `UPDATE ${this.table} SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2 RETURNING id, balance`,
            [amount, id]
        );
        return result.rows[0];
    }

    static async delete(id) {
        const result = await db.query(
            `DELETE FROM ${this.table} WHERE id = $1 RETURNING id`,
            [id]
        );
        return result.rows[0];
    }

    static async getStats(id) {
        const result = await db.query(
            `SELECT 
                COUNT(CASE WHEN t.status = 'assigned' THEN 1 END) as assigned_tasks,
                COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) as in_progress_tasks,
                COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
                COUNT(CASE WHEN t.status = 'failed' THEN 1 END) as failed_tasks,
                COALESCE(SUM(pi.amount), 0) as total_earned
             FROM employer e
             LEFT JOIN tasks t ON e.id = t.employer_id
             LEFT JOIN payment_items pi ON e.id = pi.employer_id
             WHERE e.id = $1
             GROUP BY e.id`,
            [id]
        );
        return result.rows[0] || { assigned_tasks: 0, in_progress_tasks: 0, completed_tasks: 0, failed_tasks: 0, total_earned: 0 };
    }

    static async count(filters = {}) {
        let query = `SELECT COUNT(*) FROM ${this.table} WHERE 1=1`;
        const values = [];
        let idx = 1;

        if (filters.organization_id) {
            query += ` AND organization_id = $${idx++}`;
            values.push(filters.organization_id);
        }
        if (filters.is_active !== undefined) {
            query += ` AND is_active = $${idx++}`;
            values.push(filters.is_active);
        }

        const result = await db.query(query, values);
        return parseInt(result.rows[0].count);
    }
}

module.exports = Employer;