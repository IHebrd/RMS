const db = require('../config/database');

class StatusHistory {
    static table = 'status_history';

    static async findAll(filters = {}) {
        let query = `
            SELECT sh.id, sh.old_status, sh.new_status, sh.changed_by_type, sh.changed_by_id, 
                   sh.changed_at, sh.comment,
                   r.reference as reclamation_reference,
                   ro.id as reclamation_org_id,
                   t.id as task_id, t.description as task_description
            FROM status_history sh
            LEFT JOIN reclamations r ON sh.reclamation_id = r.id
            LEFT JOIN reclamation_organizations ro ON sh.reclamation_org_id = ro.id
            LEFT JOIN tasks t ON sh.task_id = t.id
            WHERE 1=1
        `;
        const values = [];
        let idx = 1;

        if (filters.reclamation_id) {
            query += ` AND sh.reclamation_id = $${idx++}`;
            values.push(filters.reclamation_id);
        }
        if (filters.reclamation_org_id) {
            query += ` AND sh.reclamation_org_id = $${idx++}`;
            values.push(filters.reclamation_org_id);
        }
        if (filters.task_id) {
            query += ` AND sh.task_id = $${idx++}`;
            values.push(filters.task_id);
        }
        if (filters.changed_by_type) {
            query += ` AND sh.changed_by_type = $${idx++}`;
            values.push(filters.changed_by_type);
        }
        if (filters.start_date) {
            query += ` AND sh.changed_at >= $${idx++}`;
            values.push(filters.start_date);
        }
        if (filters.end_date) {
            query += ` AND sh.changed_at <= $${idx++}`;
            values.push(filters.end_date);
        }

        query += ` ORDER BY sh.changed_at DESC`;

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

    static async findByReclamation(reclamationId) {
        const result = await db.query(
            `SELECT sh.*, 
                    CASE 
                        WHEN sh.changed_by_type = 'user' THEN u.first_name || ' ' || u.last_name
                        WHEN sh.changed_by_type = 'responsable' THEN r.first_name || ' ' || r.last_name
                        WHEN sh.changed_by_type = 'employer' THEN e.first_name || ' ' || e.last_name
                        WHEN sh.changed_by_type = 'admin' THEN a.first_name || ' ' || a.last_name
                    END as changed_by_name
             FROM status_history sh
             LEFT JOIN "user" u ON sh.changed_by_type = 'user' AND sh.changed_by_id = u.id
             LEFT JOIN responsable r ON sh.changed_by_type = 'responsable' AND sh.changed_by_id = r.id
             LEFT JOIN employer e ON sh.changed_by_type = 'employer' AND sh.changed_by_id = e.id
             LEFT JOIN admin a ON sh.changed_by_type = 'admin' AND sh.changed_by_id = a.id
             WHERE sh.reclamation_id = $1
             ORDER BY sh.changed_at ASC`,
            [reclamationId]
        );
        return result.rows;
    }

    static async findByReclamationOrg(reclamationOrgId) {
        const result = await db.query(
            `SELECT sh.*,
                    CASE 
                        WHEN sh.changed_by_type = 'responsable' THEN r.first_name || ' ' || r.last_name
                        WHEN sh.changed_by_type = 'employer' THEN e.first_name || ' ' || e.last_name
                    END as changed_by_name
             FROM status_history sh
             LEFT JOIN responsable r ON sh.changed_by_type = 'responsable' AND sh.changed_by_id = r.id
             LEFT JOIN employer e ON sh.changed_by_type = 'employer' AND sh.changed_by_id = e.id
             WHERE sh.reclamation_org_id = $1
             ORDER BY sh.changed_at ASC`,
            [reclamationOrgId]
        );
        return result.rows;
    }

    static async findByTask(taskId) {
        const result = await db.query(
            `SELECT sh.*,
                    CASE 
                        WHEN sh.changed_by_type = 'responsable' THEN r.first_name || ' ' || r.last_name
                        WHEN sh.changed_by_type = 'employer' THEN e.first_name || ' ' || e.last_name
                    END as changed_by_name
             FROM status_history sh
             LEFT JOIN responsable r ON sh.changed_by_type = 'responsable' AND sh.changed_by_id = r.id
             LEFT JOIN employer e ON sh.changed_by_type = 'employer' AND sh.changed_by_id = e.id
             WHERE sh.task_id = $1
             ORDER BY sh.changed_at ASC`,
            [taskId]
        );
        return result.rows;
    }

    static async create(data) {
        const { reclamation_id = null, reclamation_org_id = null, task_id = null, 
                old_status = null, new_status, changed_by_type, changed_by_id, comment = null } = data;
        
        const result = await db.query(
            `INSERT INTO ${this.table} (reclamation_id, reclamation_org_id, task_id, old_status, new_status, changed_by_type, changed_by_id, comment) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
             RETURNING *`,
            [reclamation_id, reclamation_org_id, task_id, old_status, new_status, changed_by_type, changed_by_id, comment]
        );
        return result.rows[0];
    }

    static async getTimeline(reclamationId) {
        const result = await db.query(
            `SELECT 
                sh.changed_at,
                sh.old_status,
                sh.new_status,
                sh.comment,
                CASE 
                    WHEN sh.changed_by_type = 'user' THEN u.first_name || ' ' || u.last_name
                    WHEN sh.changed_by_type = 'responsable' THEN r.first_name || ' ' || r.last_name
                    WHEN sh.changed_by_type = 'employer' THEN e.first_name || ' ' || e.last_name
                    WHEN sh.changed_by_type = 'admin' THEN a.first_name || ' ' || a.last_name
                END as changed_by_name,
                sh.changed_by_type
             FROM status_history sh
             LEFT JOIN "user" u ON sh.changed_by_type = 'user' AND sh.changed_by_id = u.id
             LEFT JOIN responsable r ON sh.changed_by_type = 'responsable' AND sh.changed_by_id = r.id
             LEFT JOIN employer e ON sh.changed_by_type = 'employer' AND sh.changed_by_id = e.id
             LEFT JOIN admin a ON sh.changed_by_type = 'admin' AND sh.changed_by_id = a.id
             WHERE sh.reclamation_id = $1
             ORDER BY sh.changed_at ASC`,
            [reclamationId]
        );
        return result.rows;
    }

    static async deleteByReclamation(reclamationId) {
        const result = await db.query(
            `DELETE FROM ${this.table} WHERE reclamation_id = $1 RETURNING id`,
            [reclamationId]
        );
        return result.rows;
    }

    static async deleteByReclamationOrg(reclamationOrgId) {
        const result = await db.query(
            `DELETE FROM ${this.table} WHERE reclamation_org_id = $1 RETURNING id`,
            [reclamationOrgId]
        );
        return result.rows;
    }

    static async deleteByTask(taskId) {
        const result = await db.query(
            `DELETE FROM ${this.table} WHERE task_id = $1 RETURNING id`,
            [taskId]
        );
        return result.rows;
    }

    static async getAverageResolutionTime() {
        const result = await db.query(
            `SELECT AVG(EXTRACT(EPOCH FROM (changed_at - created_at))/3600) as avg_hours
             FROM (
                 SELECT sh.changed_at, r.created_at
                 FROM status_history sh
                 JOIN reclamations r ON sh.reclamation_id = r.id
                 WHERE sh.new_status = 'validated'
                 AND sh.reclamation_id IS NOT NULL
             ) as resolutions`
        );
        return result.rows[0];
    }
}

module.exports = StatusHistory;