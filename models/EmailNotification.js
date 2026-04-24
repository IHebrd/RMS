const db = require('../config/database');

class EmailNotification {
    static table = 'emails_notifications';

    static async findAll(filters = {}) {
        let query = `
            SELECT en.id, en.recipient_email, en.recipient_type, en.action_type, 
                   en.subject, en.status, en.sent_at,
                   r.reference as reclamation_reference,
                   t.id as task_id
            FROM emails_notifications en
            LEFT JOIN reclamations r ON en.reclamation_id = r.id
            LEFT JOIN tasks t ON en.task_id = t.id
            WHERE 1=1
        `;
        const values = [];
        let idx = 1;

        if (filters.recipient_email) {
            query += ` AND en.recipient_email = $${idx++}`;
            values.push(filters.recipient_email);
        }
        if (filters.recipient_type) {
            query += ` AND en.recipient_type = $${idx++}`;
            values.push(filters.recipient_type);
        }
        if (filters.action_type) {
            query += ` AND en.action_type = $${idx++}`;
            values.push(filters.action_type);
        }
        if (filters.status) {
            query += ` AND en.status = $${idx++}`;
            values.push(filters.status);
        }
        if (filters.start_date) {
            query += ` AND en.sent_at >= $${idx++}`;
            values.push(filters.start_date);
        }
        if (filters.end_date) {
            query += ` AND en.sent_at <= $${idx++}`;
            values.push(filters.end_date);
        }

        query += ` ORDER BY en.sent_at DESC`;

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

    static async findByRecipient(recipientEmail, limit = 50) {
        const result = await db.query(
            `SELECT id, action_type, subject, status, sent_at
             FROM ${this.table}
             WHERE recipient_email = $1
             ORDER BY sent_at DESC
             LIMIT $2`,
            [recipientEmail, limit]
        );
        return result.rows;
    }

    static async create(data) {
        const { recipient_email, recipient_type, recipient_id, action_type, subject, content, reclamation_id = null, task_id = null, status = 'sent' } = data;
        const result = await db.query(
            `INSERT INTO ${this.table} (recipient_email, recipient_type, recipient_id, action_type, subject, content, reclamation_id, task_id, status) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
             RETURNING *`,
            [recipient_email, recipient_type, recipient_id, action_type, subject, content, reclamation_id, task_id, status]
        );
        return result.rows[0];
    }

    static async updateStatus(id, status) {
        const result = await db.query(
            `UPDATE ${this.table} SET status = $1 WHERE id = $2 RETURNING *`,
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

    static async deleteOld(daysOld = 90) {
        const result = await db.query(
            `DELETE FROM ${this.table} WHERE sent_at < NOW() - INTERVAL '${daysOld} days' RETURNING id`,
            []
        );
        return result.rows;
    }

    static async countByStatus(status) {
        const result = await db.query(
            `SELECT COUNT(*) FROM ${this.table} WHERE status = $1`,
            [status]
        );
        return parseInt(result.rows[0].count);
    }

    static async getStats() {
        const result = await db.query(
            `SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent,
                COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
                COUNT(DISTINCT recipient_email) as unique_recipients
             FROM ${this.table}`
        );
        return result.rows[0];
    }
}

module.exports = EmailNotification;