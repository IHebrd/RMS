const db = require('../config/database');

class ReclamationOrganization {
    static table = 'reclamation_organizations';

    static async findAll(filters = {}) {
        let query = `
            SELECT ro.id, ro.reclamation_id, ro.organization_id, ro.status, ro.responsable_notes, 
                   ro.validated_at, ro.created_at, ro.updated_at,
                   r.reference, r.title, r.type, r.urgency,
                   o.name as organization_name
            FROM reclamation_organizations ro
            LEFT JOIN reclamations r ON ro.reclamation_id = r.id
            LEFT JOIN organizations o ON ro.organization_id = o.id
            WHERE 1=1
        `;
        const values = [];
        let idx = 1;

        if (filters.reclamation_id) {
            query += ` AND ro.reclamation_id = $${idx++}`;
            values.push(filters.reclamation_id);
        }
        if (filters.organization_id) {
            query += ` AND ro.organization_id = $${idx++}`;
            values.push(filters.organization_id);
        }
        if (filters.status) {
            query += ` AND ro.status = $${idx++}`;
            values.push(filters.status);
        }

        query += ` ORDER BY ro.created_at DESC`;

        const result = await db.query(query, values);
        return result.rows;
    }

    static async findById(id) {
        const result = await db.query(
            `SELECT ro.*, r.reference, r.title, r.description, r.type, r.urgency, r.amount,
                    o.name as organization_name, o.type as organization_type
             FROM ${this.table} ro
             LEFT JOIN reclamations r ON ro.reclamation_id = r.id
             LEFT JOIN organizations o ON ro.organization_id = o.id
             WHERE ro.id = $1`,
            [id]
        );
        return result.rows[0];
    }

    static async findByReclamation(reclamationId) {
        const result = await db.query(
            `SELECT ro.*, o.name as organization_name, o.type as organization_type
             FROM ${this.table} ro
             LEFT JOIN organizations o ON ro.organization_id = o.id
             WHERE ro.reclamation_id = $1`,
            [reclamationId]
        );
        return result.rows;
    }

    static async findByOrganization(organizationId) {
        const result = await db.query(
            `SELECT ro.*, r.reference, r.title, r.type, r.urgency
             FROM ${this.table} ro
             LEFT JOIN reclamations r ON ro.reclamation_id = r.id
             WHERE ro.organization_id = $1
             ORDER BY ro.created_at DESC`,
            [organizationId]
        );
        return result.rows;
    }

    static async create(data) {
        const { reclamation_id, organization_id, status = 'pending', responsable_notes = null } = data;
        const result = await db.query(
            `INSERT INTO ${this.table} (reclamation_id, organization_id, status, responsable_notes) 
             VALUES ($1, $2, $3, $4) 
             RETURNING *`,
            [reclamation_id, organization_id, status, responsable_notes]
        );
        return result.rows[0];
    }

    static async createMultiple(reclamationId, organizationIds) {
        const results = [];
        for (const orgId of organizationIds) {
            const result = await this.create({ reclamation_id: reclamationId, organization_id: orgId });
            results.push(result);
        }
        return results;
    }

    static async update(id, data) {
        const fields = [];
        const values = [];
        let idx = 1;

        const allowedFields = ['status', 'responsable_notes', 'validated_at'];
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

    static async updateStatus(id, status, notes = null) {
        const updateData = { status };
        if (notes) updateData.responsable_notes = notes;
        if (status === 'validated') updateData.validated_at = new Date();
        return this.update(id, updateData);
    }

    static async delete(id) {
        const result = await db.query(
            `DELETE FROM ${this.table} WHERE id = $1 RETURNING id`,
            [id]
        );
        return result.rows[0];
    }

    static async getWithDetails(id) {
        const result = await db.query(
            `SELECT ro.*, 
                    r.reference, r.title, r.description, r.type, r.urgency, r.amount, r.location_lat, r.location_lng,
                    u.id as user_id, u.first_name, u.last_name, u.email, u.phone, u.address,
                    o.id as organization_id, o.name as organization_name, o.type as organization_type,
                    json_agg(DISTINCT jsonb_build_object('id', t.id, 'description', t.description, 'status', t.status, 'employer_name', e.first_name || ' ' || e.last_name)) as tasks
             FROM ${this.table} ro
             LEFT JOIN reclamations r ON ro.reclamation_id = r.id
             LEFT JOIN "user" u ON r.user_id = u.id
             LEFT JOIN organizations o ON ro.organization_id = o.id
             LEFT JOIN tasks t ON ro.id = t.reclamation_org_id
             LEFT JOIN employer e ON t.employer_id = e.id
             WHERE ro.id = $1
             GROUP BY ro.id, r.id, u.id, o.id`,
            [id]
        );
        return result.rows[0];
    }

    static async countByOrganization(organizationId, status = null) {
        let query = `SELECT COUNT(*) FROM ${this.table} WHERE organization_id = $1`;
        const values = [organizationId];
        
        if (status) {
            query += ` AND status = $2`;
            values.push(status);
        }
        
        const result = await db.query(query, values);
        return parseInt(result.rows[0].count);
    }
}

module.exports = ReclamationOrganization;