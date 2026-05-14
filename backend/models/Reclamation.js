const db = require('../config/database');
const { generateReclamationReference } = require('../services/referenceService');

class Reclamation {
    static table = 'reclamations';

    static async findAll(filters = {}) {
        let query = `
            SELECT r.id, r.reference, r.title, r.description, r.type, r.urgency, r.amount, 
                   r.status, r.created_at, r.updated_at, r.location_lat, r.location_lng,
                   u.id as user_id, u.first_name, u.last_name, u.email, u.phone
            FROM reclamations r
            LEFT JOIN "user" u ON r.user_id = u.id
            WHERE 1=1
        `;
        const values = [];
        let idx = 1;

        if (filters.user_id) {
            query += ` AND r.user_id = $${idx++}`;
            values.push(filters.user_id);
        }
        if (filters.status) {
            query += ` AND r.status = $${idx++}`;
            values.push(filters.status);
        }
        if (filters.type) {
            query += ` AND r.type = $${idx++}`;
            values.push(filters.type);
        }
        if (filters.urgency) {
            query += ` AND r.urgency = $${idx++}`;
            values.push(filters.urgency);
        }
        if (filters.start_date) {
            query += ` AND r.created_at >= $${idx++}`;
            values.push(filters.start_date);
        }
        if (filters.end_date) {
            query += ` AND r.created_at <= $${idx++}`;
            values.push(filters.end_date);
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
            `SELECT r.*, u.first_name, u.last_name, u.email, u.phone
             FROM reclamations r
             LEFT JOIN "user" u ON r.user_id = u.id
             WHERE r.id = $1`,
            [id]
        );
        return result.rows[0];
    }

    static async findByReference(reference) {
        const result = await db.query(
            `SELECT * FROM ${this.table} WHERE reference = $1`,
            [reference]
        );
        return result.rows[0];
    }

    static async findByUser(userId) {
        const result = await db.query(
            `SELECT id, reference, title, type, urgency, status, amount, created_at 
             FROM ${this.table} WHERE user_id = $1 ORDER BY created_at DESC`,
            [userId]
        );
        return result.rows;
    }

    static async findByOrganization(organizationId, filters = {}) {
        let query = `
            SELECT ro.id, r.id as reclamation_id, r.reference, r.title, r.description, r.type, r.urgency, r.amount, 
                   r.status, r.created_at, ro.status as org_status, ro.responsable_notes,
                   u.first_name, u.last_name, u.email, u.phone, u.address
            FROM reclamations r
            JOIN reclamation_organizations ro ON r.id = ro.reclamation_id
            JOIN "user" u ON r.user_id = u.id
            WHERE ro.organization_id = $1
        `;
        const values = [organizationId];
        let idx = 2;

        if (filters.status) {
            query += ` AND ro.status = $${idx++}`;
            values.push(filters.status);
        }
        if (filters.type) {
            query += ` AND r.type = $${idx++}`;
            values.push(filters.type);
        }
        if (filters.urgency) {
            query += ` AND r.urgency = $${idx++}`;
            values.push(filters.urgency);
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

    static async create(data) {
        const { user_id, title, description, type, urgency, amount = 0, status = 'pending', location_lat, location_lng } = data;
        const reference = await generateReclamationReference();
        
        const result = await db.query(
            `INSERT INTO ${this.table} (reference, user_id, title, description, type, urgency, amount, status, location_lat, location_lng) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
             RETURNING *`,
            [reference, user_id, title, description, type, urgency, amount, status, location_lat, location_lng]
        );
        return result.rows[0];
    }

    static async update(id, data) {
        const fields = [];
        const values = [];
        let idx = 1;

        const allowedFields = ['title', 'description', 'type', 'urgency', 'amount', 'status', 'location_lat', 'location_lng'];
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

    static async updateStatus(id, status) {
        const result = await db.query(
            `UPDATE ${this.table} SET status = $1, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2 RETURNING id, status`,
            [status, id]
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

    static async count(filters = {}) {
        let query = `SELECT COUNT(*) FROM ${this.table} WHERE 1=1`;
        const values = [];
        let idx = 1;

        if (filters.user_id) {
            query += ` AND user_id = $${idx++}`;
            values.push(filters.user_id);
        }
        if (filters.status) {
            query += ` AND status = $${idx++}`;
            values.push(filters.status);
        }

        const result = await db.query(query, values);
        return parseInt(result.rows[0].count);
    }

    static async getTracking(id) {
        const result = await db.query(
            `SELECT * FROM v_reclamations_complete WHERE id = $1`,
            [id]
        );
        return result.rows[0];
    }
}

module.exports = Reclamation;
