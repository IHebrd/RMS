const db = require('../config/database');

class Responsable {
    static table = 'responsable';

    static async findAll(filters = {}) {
        let query = `
            SELECT r.id, r.email, r.first_name, r.last_name, r.phone, r.avatar, r.cin, 
                   r.position, r.is_active, r.last_login, r.created_at,
                   o.id as organization_id, o.name as organization_name, o.type as organization_type
            FROM responsable r
            LEFT JOIN organizations o ON r.organization_id = o.id
            WHERE 1=1
        `;
        const values = [];
        let idx = 1;

        if (filters.organization_id) {
            query += ` AND r.organization_id = $${idx++}`;
            values.push(filters.organization_id);
        }
        if (filters.is_active !== undefined) {
            query += ` AND r.is_active = $${idx++}`;
            values.push(filters.is_active);
        }
        if (filters.search) {
            query += ` AND (r.first_name ILIKE $${idx++} OR r.last_name ILIKE $${idx++} OR r.email ILIKE $${idx++})`;
            values.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
        }

        query += ` ORDER BY r.created_at DESC`;

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
            `SELECT r.*, o.name as organization_name, o.type as organization_type
             FROM ${this.table} r
             LEFT JOIN organizations o ON r.organization_id = o.id
             WHERE r.id = $1`,
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
            `SELECT id, email, first_name, last_name, phone, avatar, position, is_active 
             FROM ${this.table} WHERE organization_id = $1 AND is_active = true`,
            [organizationId]
        );
        return result.rows;
    }

    static async create(data) {
        const { email, password_hash, first_name, last_name, phone, avatar, cin, organization_id, position } = data;
        const result = await db.query(
            `INSERT INTO ${this.table} (email, password_hash, first_name, last_name, phone, avatar, cin, organization_id, position) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
             RETURNING id, email, first_name, last_name, phone, avatar, cin, organization_id, position, is_active, created_at`,
            [email, password_hash, first_name, last_name, phone, avatar, cin, organization_id, position]
        );
        return result.rows[0];
    }

    static async update(id, data) {
        const fields = [];
        const values = [];
        let idx = 1;

        const allowedFields = ['email', 'password_hash', 'first_name', 'last_name', 'phone', 'avatar', 'cin', 'organization_id', 'position', 'is_active', 'last_login'];
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
                COUNT(DISTINCT ro.reclamation_id) as total_reclamations,
                COUNT(DISTINCT t.id) as total_tasks,
                COUNT(DISTINCT e.id) as total_employees,
                COALESCE(SUM(t.payment_amount), 0) as total_payments
             FROM responsable r
             LEFT JOIN organizations o ON r.organization_id = o.id
             LEFT JOIN reclamation_organizations ro ON o.id = ro.organization_id
             LEFT JOIN tasks t ON ro.id = t.reclamation_org_id
             LEFT JOIN employer e ON o.id = e.organization_id
             WHERE r.id = $1`,
            [id]
        );
        return result.rows[0];
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

module.exports = Responsable;