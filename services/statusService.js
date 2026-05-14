const db = require('../config/database');
const StatusHistory = require('../models/StatusHistory');

// Définition des workflows de statuts
const statusWorkflows = {
    reclamation: {
        allowedTransitions: {
            pending: ['in_progress', 'archived'],
            in_progress: ['validated', 'failed', 'pending'],
            validated: ['archived'],
            failed: ['pending', 'archived'],
            archived: []
        },
        default: 'pending',
        final: ['validated', 'archived']
    },
    reclamation_organization: {
        allowedTransitions: {
            pending: ['in_progress', 'failed', 'archived'],
            in_progress: ['validated', 'failed', 'pending'],
            validated: ['archived'],
            failed: ['pending', 'archived'],
            archived: []
        },
        default: 'pending',
        final: ['validated', 'archived']
    },
    task: {
        allowedTransitions: {
            assigned: ['in_progress', 'failed'],
            in_progress: ['completed', 'failed', 'assigned'],
            completed: [],
            failed: ['assigned']
        },
        default: 'assigned',
        final: ['completed']
    }
};

// Vérifier si une transition est autorisée
const isTransitionAllowed = (entityType, currentStatus, newStatus) => {
    const workflow = statusWorkflows[entityType];
    if (!workflow) return false;
    
    const allowed = workflow.allowedTransitions[currentStatus];
    if (!allowed) return false;
    
    return allowed.includes(newStatus);
};

// Obtenir les transitions possibles
const getPossibleTransitions = (entityType, currentStatus) => {
    const workflow = statusWorkflows[entityType];
    if (!workflow) return [];
    
    return workflow.allowedTransitions[currentStatus] || [];
};

// Changer le statut avec validation et historique
const changeStatus = async ({
    entityType,
    entityId,
    newStatus,
    changedByType,
    changedById,
    comment = null,
    autoUpdateParent = true
}) => {
    const client = await db.getClient();
    
    try {
        await client.query('BEGIN');
        
        // Récupérer le statut actuel
        let currentStatus;
        let tableName;
        let idField;
        
        switch (entityType) {
            case 'reclamation':
                tableName = 'reclamations';
                idField = 'id';
                const recResult = await client.query(
                    `SELECT status FROM reclamations WHERE id = $1`,
                    [entityId]
                );
                currentStatus = recResult.rows[0]?.status;
                break;
            case 'reclamation_organization':
                tableName = 'reclamation_organizations';
                idField = 'id';
                const roResult = await client.query(
                    `SELECT status FROM reclamation_organizations WHERE id = $1`,
                    [entityId]
                );
                currentStatus = roResult.rows[0]?.status;
                break;
            case 'task':
                tableName = 'tasks';
                idField = 'id';
                const taskResult = await client.query(
                    `SELECT status FROM tasks WHERE id = $1`,
                    [entityId]
                );
                currentStatus = taskResult.rows[0]?.status;
                break;
            default:
                throw new Error(`Type d'entité inconnu: ${entityType}`);
        }
        
        if (!currentStatus) {
            throw new Error(`Entité non trouvée: ${entityType}/${entityId}`);
        }
        
        // Vérifier si la transition est autorisée
        if (!isTransitionAllowed(entityType, currentStatus, newStatus)) {
            throw new Error(`Transition non autorisée: ${currentStatus} -> ${newStatus}`);
        }
        
        // Mettre à jour le statut
        const updateData = { status: newStatus };
        
        // Ajouter validated_at si validation
        if (newStatus === 'validated') {
            updateData.validated_at = new Date();
        }
        
        const fields = [];
        const values = [];
        let idx = 1;
        
        for (const [key, value] of Object.entries(updateData)) {
            fields.push(`${key} = $${idx++}`);
            values.push(value);
        }
        
        values.push(entityId);
        
        await client.query(
            `UPDATE ${tableName} SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
             WHERE ${idField} = $${idx}`,
            values
        );
        
        // Enregistrer dans l'historique
        const historyData = {
            old_status: currentStatus,
            new_status: newStatus,
            changed_by_type: changedByType,
            changed_by_id: changedById,
            comment: comment
        };
        
        if (entityType === 'reclamation') {
            historyData.reclamation_id = entityId;
        } else if (entityType === 'reclamation_organization') {
            historyData.reclamation_org_id = entityId;
        } else if (entityType === 'task') {
            historyData.task_id = entityId;
        }
        
        await StatusHistory.create(historyData);
        
        // Mettre à jour le statut parent si nécessaire
        if (autoUpdateParent && entityType === 'task') {
            await updateParentReclamationStatus(client, entityId);
        }
        
        if (autoUpdateParent && entityType === 'reclamation_organization') {
            await updateParentReclamationStatusFromOrg(client, entityId);
        }
        
        await client.query('COMMIT');
        
        return {
            success: true,
            entityType,
            entityId,
            oldStatus: currentStatus,
            newStatus,
            changedBy: { type: changedByType, id: changedById },
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

// Mettre à jour le statut de la réclamation parente basé sur les tâches
const updateParentReclamationStatus = async (client, taskId) => {
    // Récupérer toutes les tâches de la même réclamation
    const result = await client.query(
        `SELECT t.status, ro.reclamation_id
         FROM tasks t
         JOIN reclamation_organizations ro ON t.reclamation_org_id = ro.id
         WHERE t.id = $1`,
        [taskId]
    );
    
    if (result.rows.length === 0) return;
    
    const reclamationId = result.rows[0].reclamation_id;
    
    // Vérifier si toutes les tâches sont terminées
    const tasksResult = await client.query(
        `SELECT COUNT(*) as total,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
         FROM tasks t
         JOIN reclamation_organizations ro ON t.reclamation_org_id = ro.id
         WHERE ro.reclamation_id = $1`,
        [reclamationId]
    );
    
    const { total, completed } = tasksResult.rows[0];
    
    if (total > 0 && total === parseInt(completed)) {
        // Toutes les tâches sont terminées
        await client.query(
            `UPDATE reclamations SET status = 'validated', updated_at = CURRENT_TIMESTAMP 
             WHERE id = $1`,
            [reclamationId]
        );
    }
};

// Mettre à jour le statut de la réclamation parente basé sur les organisations
const updateParentReclamationStatusFromOrg = async (client, reclamationOrgId) => {
    const result = await client.query(
        `SELECT ro.reclamation_id, ro.status
         FROM reclamation_organizations ro
         WHERE ro.id = $1`,
        [reclamationOrgId]
    );
    
    if (result.rows.length === 0) return;
    
    const reclamationId = result.rows[0].reclamation_id;
    
    // Vérifier si toutes les organisations ont validé
    const orgsResult = await client.query(
        `SELECT COUNT(*) as total,
                COUNT(CASE WHEN status = 'validated' THEN 1 END) as validated
         FROM reclamation_organizations
         WHERE reclamation_id = $1`,
        [reclamationId]
    );
    
    const { total, validated } = orgsResult.rows[0];
    
    if (total > 0 && total === parseInt(validated)) {
        await client.query(
            `UPDATE reclamations SET status = 'validated', updated_at = CURRENT_TIMESTAMP 
             WHERE id = $1`,
            [reclamationId]
        );
    }
};

// Obtenir la timeline complète d'une réclamation
const getReclamationTimeline = async (reclamationId) => {
    const history = await StatusHistory.findByReclamation(reclamationId);
    const reclamation = await db.query(
        `SELECT created_at FROM reclamations WHERE id = $1`,
        [reclamationId]
    );
    
    const createdAt = reclamation.rows[0]?.created_at;
    
    // Construire la timeline
    const timeline = [
        {
            step: 'Création',
            status: 'completed',
            date: createdAt,
            description: 'Réclamation créée par l\'utilisateur'
        }
    ];
    
    for (const h of history) {
        let step = '';
        let description = h.comment || '';
        
        switch (h.new_status) {
            case 'pending':
                step = 'En attente';
                break;
            case 'in_progress':
                step = 'Prise en charge';
                description = description || 'Réclamation prise en charge par l\'organisation';
                break;
            case 'validated':
                step = 'Résolution';
                description = description || 'Problème résolu et validé';
                break;
            case 'failed':
                step = 'Échec';
                break;
            case 'archived':
                step = 'Archivée';
                break;
        }
        
        timeline.push({
            step,
            status: 'completed',
            date: h.changed_at,
            description,
            changed_by: h.changed_by_name,
            changed_by_type: h.changed_by_type
        });
    }
    
    return timeline;
};

module.exports = {
    statusWorkflows,
    isTransitionAllowed,
    getPossibleTransitions,
    changeStatus,
    updateParentReclamationStatus,
    updateParentReclamationStatusFromOrg,
    getReclamationTimeline
};