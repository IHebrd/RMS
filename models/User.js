const db = require('../config/database');

class User {
    static table = '"user"';  // Échappement car 'user' est un mot réservé PostgreSQL

    static async findAll(filters = {}) {
        let query = `
            SELECT id, email, first_name, last_name, phone, avatar, cin, address, governorate, is_active, last_login, created_at
            FROM ${this.table}
            WHERE 1=1
        `;
        const values = [];
        let idx = 1;

        if (filters.is_active !== undefined) {
            query += ` AND is_active = $${idx++}`;
            values.push(filters.is_active);
        }
        if (filters.governorate) {
            query += ` AND governorate = $${idx++}`;
            values.push(filters.governorate);
        }
        if (filters.search) {
            query += ` AND (first_name ILIKE $${idx++} OR last_name ILIKE $${idx++} OR email ILIKE $${idx++} OR cin ILIKE $${idx++})`;
            values.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
        }

        query += ` ORDER BY created_at DESC`;

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
            `SELECT id, email, password_hash, first_name, last_name, phone, avatar, cin, address, governorate, is_active, last_login, created_at, updated_at
             FROM ${this.table} WHERE id = $1`,
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

    static async create(data) {
        const { email, password_hash, first_name, last_name, phone, avatar, cin, address, governorate } = data;
        const result = await db.query(
            `INSERT INTO ${this.table} (email, password_hash, first_name, last_name, phone, avatar, cin, address, governorate) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
             RETURNING id, email, first_name, last_name, phone, avatar, cin, address, governorate, is_active, created_at`,
            [email, password_hash, first_name, last_name, phone, avatar, cin, address, governorate]
        );
        return result.rows[0];
    }

    static async update(id, data) {
        const fields = [];
        const values = [];
        let idx = 1;

        const allowedFields = ['email', 'password_hash', 'first_name', 'last_name', 'phone', 'avatar', 'cin', 'address', 'governorate', 'is_active', 'last_login'];
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
             WHERE id = $${idx} RETURNING id, email, first_name, last_name, phone, avatar, cin, address, governorate, is_active, updated_at`,
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
                COUNT(*) as total_reclamations,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
                COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_count,
                COUNT(CASE WHEN status = 'validated' THEN 1 END) as validated_count,
                COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
                COUNT(CASE WHEN status = 'archived' THEN 1 END) as archived_count
             FROM reclamations
             WHERE user_id = $1`,
            [id]
        );
        return result.rows[0];
    }

    static async count(filters = {}) {
        let query = `SELECT COUNT(*) FROM ${this.table} WHERE 1=1`;
        const values = [];
        let idx = 1;

        if (filters.is_active !== undefined) {
            query += ` AND is_active = $${idx++}`;
            values.push(filters.is_active);
        }
        if (filters.governorate) {
            query += ` AND governorate = $${idx++}`;
            values.push(filters.governorate);
        }

        const result = await db.query(query, values);
        return parseInt(result.rows[0].count);
    }
}

module.exports = User;