const db = require('../config/database');
const fs = require('fs');
const path = require('path');

class Proof {
    static table = 'proofs';

    static async findAll(filters = {}) {
        let query = `
            SELECT p.id, p.file_path, p.file_type, p.description, p.uploaded_by, p.uploaded_by_type, p.uploaded_at,
                   t.id as task_id, t.description as task_description,
                   r.reference as reclamation_reference
            FROM proofs p
            LEFT JOIN tasks t ON p.task_id = t.id
            LEFT JOIN reclamation_organizations ro ON t.reclamation_org_id = ro.id
            LEFT JOIN reclamations r ON ro.reclamation_id = r.id
            WHERE 1=1
        `;
        const values = [];
        let idx = 1;

        if (filters.task_id) {
            query += ` AND p.task_id = $${idx++}`;
            values.push(filters.task_id);
        }
        if (filters.uploaded_by_type) {
            query += ` AND p.uploaded_by_type = $${idx++}`;
            values.push(filters.uploaded_by_type);
        }
        if (filters.file_type) {
            query += ` AND p.file_type = $${idx++}`;
            values.push(filters.file_type);
        }

        query += ` ORDER BY p.uploaded_at DESC`;

        const result = await db.query(query, values);
        return result.rows;
    }

    static async findById(id) {
        const result = await db.query(
            `SELECT p.*, t.description as task_description
             FROM ${this.table} p
             LEFT JOIN tasks t ON p.task_id = t.id
             WHERE p.id = $1`,
            [id]
        );
        return result.rows[0];
    }

    static async findByTask(taskId) {
        const result = await db.query(
            `SELECT id, file_path, file_type, description, uploaded_by, uploaded_by_type, uploaded_at
             FROM ${this.table}
             WHERE task_id = $1
             ORDER BY uploaded_at ASC`,
            [taskId]
        );
        return result.rows;
    }

    static async create(data) {
        const { task_id, file_path, file_type, description, uploaded_by, uploaded_by_type } = data;
        const result = await db.query(
            `INSERT INTO ${this.table} (task_id, file_path, file_type, description, uploaded_by, uploaded_by_type) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING *`,
            [task_id, file_path, file_type, description, uploaded_by, uploaded_by_type]
        );
        return result.rows[0];
    }

    static async createMultiple(taskId, filesData, uploadedBy, uploadedByType) {
        const results = [];
        for (const file of filesData) {
            const result = await this.create({
                task_id: taskId,
                file_path: file.path,
                file_type: file.type,
                description: file.description || null,
                uploaded_by: uploadedBy,
                uploaded_by_type: uploadedByType
            });
            results.push(result);
        }
        return results;
    }

    static async update(id, data) {
        const fields = [];
        const values = [];
        let idx = 1;

        const allowedFields = ['description'];
        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                fields.push(`${field} = $${idx++}`);
                values.push(data[field]);
            }
        }

        if (fields.length === 0) return null;

        values.push(id);
        const result = await db.query(
            `UPDATE ${this.table} SET ${fields.join(', ')} 
             WHERE id = $${idx} RETURNING *`,
            values
        );
        return result.rows[0];
    }

    static async delete(id) {
        // Récupérer le chemin du fichier avant suppression
        const proof = await this.findById(id);
        
        const result = await db.query(
            `DELETE FROM ${this.table} WHERE id = $1 RETURNING id, file_path`,
            [id]
        );
        
        // Supprimer le fichier physique
        if (proof && proof.file_path) {
            const filePath = path.join(process.cwd(), proof.file_path);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        
        return result.rows[0];
    }

    static async deleteByTask(taskId) {
        const proofs = await this.findByTask(taskId);
        for (const proof of proofs) {
            await this.delete(proof.id);
        }
        return proofs.length;
    }

    static async countByTask(taskId) {
        const result = await db.query(
            `SELECT COUNT(*) FROM ${this.table} WHERE task_id = $1`,
            [taskId]
        );
        return parseInt(result.rows[0].count);
    }
}

module.exports = Proof;