const db = require('../config/database');

class Organization {
    static table = 'organizations';

    static async findAll(filters = {}) {
        let query = `
            SELECT id, name, type, description, logo, governorate, delegation, postal_code, address, phone, email, website, is_active, created_at
            FROM ${this.table}
            WHERE 1=1
        `;
        const values = [];
        let idx = 1;

        if (filters.type) {
            query += ` AND type = $${idx++}`;
            values.push(filters.type);
        }
        if (filters.governorate) {
            query += ` AND governorate = $${idx++}`;
            values.push(filters.governorate);
        }
        if (filters.is_active !== undefined) {
            query += ` AND is_active = $${idx++}`;
            values.push(filters.is_active);
        }
        if (filters.search) {
            query += ` AND (name ILIKE $${idx++} OR email ILIKE $${idx++})`;
            values.push(`%${filters.search}%`, `%${filters.search}%`);
        }

        query += ` ORDER BY name ASC`;

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
            `SELECT * FROM ${this.table} WHERE id = $1`,
            [id]
        );
        return result.rows[0];
    }

    static async findByType(type) {
        const result = await db.query(
            `SELECT id, name, type, governorate, phone, email FROM ${this.table} WHERE type = $1 AND is_active = true`,
            [type]
        );
        return result.rows;
    }

    static async create(data) {
        const { name, type, description, logo, governorate, delegation, postal_code, address, phone, email, website } = data;
        const result = await db.query(
            `INSERT INTO ${this.table} (name, type, description, logo, governorate, delegation, postal_code, address, phone, email, website) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
             RETURNING id, name, type, governorate, is_active, created_at`,
            [name, type, description, logo, governorate, delegation, postal_code, address, phone, email, website]
        );
        return result.rows[0];
    }

    static async update(id, data) {
        const fields = [];
        const values = [];
        let idx = 1;

        const allowedFields = ['name', 'type', 'description', 'logo', 'governorate', 'delegation', 'postal_code', 'address', 'phone', 'email', 'website', 'is_active'];
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
            `SELECT * FROM v_organization_stats WHERE id = $1`,
            [id]
        );
        return result.rows[0];
    }

    static async count(filters = {}) {
        let query = `SELECT COUNT(*) FROM ${this.table} WHERE 1=1`;
        const values = [];
        let idx = 1;

        if (filters.type) {
            query += ` AND type = $${idx++}`;
            values.push(filters.type);
        }
        if (filters.is_active !== undefined) {
            query += ` AND is_active = $${idx++}`;
            values.push(filters.is_active);
        }

        const result = await db.query(query, values);
        return parseInt(result.rows[0].count);
    }
}

module.exports = Organization;