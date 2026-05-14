const db = require('../config/database');

class ReclamationMessage {
    static table = 'reclamation_messages';

    static async findAll(filters = {}) {
        let query = `
            SELECT rm.id, rm.message, rm.is_read, rm.created_at,
                   rm.sender_type, rm.sender_id,
                   ro.id as reclamation_org_id, r.reference, r.title,
                   CASE 
                       WHEN rm.sender_type = 'user' THEN u.first_name || ' ' || u.last_name
                       WHEN rm.sender_type = 'responsable' THEN resp.first_name || ' ' || resp.last_name
                       WHEN rm.sender_type = 'employer' THEN e.first_name || ' ' || e.last_name
                   END as sender_name
            FROM reclamation_messages rm
            LEFT JOIN reclamation_organizations ro ON rm.reclamation_org_id = ro.id
            LEFT JOIN reclamations r ON ro.reclamation_id = r.id
            LEFT JOIN "user" u ON rm.sender_type = 'user' AND rm.sender_id = u.id
            LEFT JOIN responsable resp ON rm.sender_type = 'responsable' AND rm.sender_id = resp.id
            LEFT JOIN employer e ON rm.sender_type = 'employer' AND rm.sender_id = e.id
            WHERE 1=1
        `;
        const values = [];
        let idx = 1;

        if (filters.reclamation_org_id) {
            query += ` AND rm.reclamation_org_id = $${idx++}`;
            values.push(filters.reclamation_org_id);
        }
        if (filters.sender_type) {
            query += ` AND rm.sender_type = $${idx++}`;
            values.push(filters.sender_type);
        }
        if (filters.sender_id) {
            query += ` AND rm.sender_id = $${idx++}`;
            values.push(filters.sender_id);
        }
        if (filters.is_read !== undefined) {
            query += ` AND rm.is_read = $${idx++}`;
            values.push(filters.is_read);
        }

        query += ` ORDER BY rm.created_at ASC`;

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
            `SELECT rm.*,
                    CASE 
                        WHEN rm.sender_type = 'user' THEN u.first_name || ' ' || u.last_name
                        WHEN rm.sender_type = 'responsable' THEN r.first_name || ' ' || r.last_name
                        WHEN rm.sender_type = 'employer' THEN e.first_name || ' ' || e.last_name
                    END as sender_name
             FROM ${this.table} rm
             LEFT JOIN "user" u ON rm.sender_type = 'user' AND rm.sender_id = u.id
             LEFT JOIN responsable r ON rm.sender_type = 'responsable' AND rm.sender_id = r.id
             LEFT JOIN employer e ON rm.sender_type = 'employer' AND rm.sender_id = e.id
             WHERE rm.id = $1`,
            [id]
        );
        return result.rows[0];
    }

    static async findByReclamationOrg(reclamationOrgId) {
        const result = await db.query(
            `SELECT rm.id, rm.message, rm.is_read, rm.created_at, rm.sender_type,
                    CASE 
                        WHEN rm.sender_type = 'user' THEN u.first_name || ' ' || u.last_name
                        WHEN rm.sender_type = 'responsable' THEN r.first_name || ' ' || r.last_name
                        WHEN rm.sender_type = 'employer' THEN e.first_name || ' ' || e.last_name
                    END as sender_name,
                    CASE 
                        WHEN rm.sender_type = 'user' THEN u.avatar
                        WHEN rm.sender_type = 'responsable' THEN r.avatar
                        WHEN rm.sender_type = 'employer' THEN e.avatar
                    END as sender_avatar
             FROM reclamation_messages rm
             LEFT JOIN "user" u ON rm.sender_type = 'user' AND rm.sender_id = u.id
             LEFT JOIN responsable r ON rm.sender_type = 'responsable' AND rm.sender_id = r.id
             LEFT JOIN employer e ON rm.sender_type = 'employer' AND rm.sender_id = e.id
             WHERE rm.reclamation_org_id = $1
             ORDER BY rm.created_at ASC`,
            [reclamationOrgId]
        );
        return result.rows;
    }

    static async create(data) {
        const { reclamation_org_id, sender_type, sender_id, message, is_read = false } = data;
        const result = await db.query(
            `INSERT INTO ${this.table} (reclamation_org_id, sender_type, sender_id, message, is_read) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING *`,
            [reclamation_org_id, sender_type, sender_id, message, is_read]
        );
        return result.rows[0];
    }

    static async markAsRead(id) {
        const result = await db.query(
            `UPDATE ${this.table} SET is_read = true WHERE id = $1 RETURNING *`,
            [id]
        );
        return result.rows[0];
    }

    static async markAllAsRead(reclamationOrgId, readerType, readerId) {
        // Marquer comme lus tous les messages qui ne sont pas de l'utilisateur actuel
        const result = await db.query(
            `UPDATE ${this.table} 
             SET is_read = true 
             WHERE reclamation_org_id = $1 
             AND NOT (sender_type = $2 AND sender_id = $3)
             AND is_read = false
             RETURNING id`,
            [reclamationOrgId, readerType, readerId]
        );
        return result.rows;
    }

    static async delete(id) {
        const result = await db.query(
            `DELETE FROM ${this.table} WHERE id = $1 RETURNING id`,
            [id]
        );
        return result.rows[0];
    }

    static async deleteByReclamationOrg(reclamationOrgId) {
        const result = await db.query(
            `DELETE FROM ${this.table} WHERE reclamation_org_id = $1 RETURNING id`,
            [reclamationOrgId]
        );
        return result.rows;
    }

    static async countUnread(reclamationOrgId, readerType, readerId) {
        const result = await db.query(
            `SELECT COUNT(*) as unread_count
             FROM ${this.table}
             WHERE reclamation_org_id = $1
             AND is_read = false
             AND NOT (sender_type = $2 AND sender_id = $3)`,
            [reclamationOrgId, readerType, readerId]
        );
        return parseInt(result.rows[0].unread_count);
    }

    static async getLastMessage(reclamationOrgId) {
        const result = await db.query(
            `SELECT rm.message, rm.created_at, rm.sender_type,
                    CASE 
                        WHEN rm.sender_type = 'user' THEN u.first_name || ' ' || u.last_name
                        WHEN rm.sender_type = 'responsable' THEN r.first_name || ' ' || r.last_name
                        WHEN rm.sender_type = 'employer' THEN e.first_name || ' ' || e.last_name
                    END as sender_name
             FROM reclamation_messages rm
             LEFT JOIN "user" u ON rm.sender_type = 'user' AND rm.sender_id = u.id
             LEFT JOIN responsable r ON rm.sender_type = 'responsable' AND rm.sender_id = r.id
             LEFT JOIN employer e ON rm.sender_type = 'employer' AND rm.sender_id = e.id
             WHERE rm.reclamation_org_id = $1
             ORDER BY rm.created_at DESC
             LIMIT 1`,
            [reclamationOrgId]
        );
        return result.rows[0];
    }
}

module.exports = ReclamationMessage;