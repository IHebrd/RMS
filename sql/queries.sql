-- =====================================================
-- RMS - RECLAMATION MANAGEMENT SYSTEM
-- Fichier: queries.sql
-- Description: Requêtes utiles pour l'administration
-- =====================================================

-- =====================================================
-- 1. STATISTIQUES GLOBALES
-- =====================================================

-- 1.1 Nombre total par entité
SELECT 
    (SELECT COUNT(*) FROM "user") as total_users,
    (SELECT COUNT(*) FROM admin) as total_admins,
    (SELECT COUNT(*) FROM responsable) as total_responsables,
    (SELECT COUNT(*) FROM employer) as total_employers,
    (SELECT COUNT(*) FROM organizations) as total_organizations,
    (SELECT COUNT(*) FROM reclamations) as total_reclamations,
    (SELECT COUNT(*) FROM tasks) as total_tasks;

-- 1.2 Réclamations par statut
SELECT 
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM reclamations), 2) as percentage
FROM reclamations
GROUP BY status
ORDER BY count DESC;

-- 1.3 Réclamations par type
SELECT 
    type,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM reclamations), 2) as percentage
FROM reclamations
GROUP BY type
ORDER BY count DESC;

-- 1.4 Réclamations par urgence
SELECT 
    urgency,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM reclamations), 2) as percentage
FROM reclamations
GROUP BY urgency
ORDER BY 
    CASE urgency 
        WHEN 'tres_urgent' THEN 1 
        WHEN 'urgent' THEN 2 
        WHEN 'normal' THEN 3 
    END;

-- 1.5 Réclamations par gouvernorat
SELECT 
    u.governorate,
    COUNT(*) as count
FROM reclamations r
JOIN "user" u ON r.user_id = u.id
WHERE u.governorate IS NOT NULL
GROUP BY u.governorate
ORDER BY count DESC;

-- =====================================================
-- 2. PERFORMANCE DES ORGANISATIONS
-- =====================================================

-- 2.1 Classement des organisations par nombre de réclamations
SELECT 
    o.name,
    o.type,
    COUNT(DISTINCT ro.reclamation_id) as total_reclamations,
    COUNT(CASE WHEN ro.status = 'validated' THEN 1 END) as resolved,
    ROUND(COUNT(CASE WHEN ro.status = 'validated' THEN 1 END) * 100.0 / NULLIF(COUNT(DISTINCT ro.reclamation_id), 0), 2) as resolution_rate
FROM organizations o
LEFT JOIN reclamation_organizations ro ON o.id = ro.organization_id
GROUP BY o.id
ORDER BY total_reclamations DESC;

-- 2.2 Temps moyen de résolution par organisation
SELECT 
    o.name,
    AVG(EXTRACT(EPOCH FROM (ro.validated_at - r.created_at))/3600) as avg_resolution_hours,
    MIN(EXTRACT(EPOCH FROM (ro.validated_at - r.created_at))/3600) as min_resolution_hours,
    MAX(EXTRACT(EPOCH FROM (ro.validated_at - r.created_at))/3600) as max_resolution_hours
FROM organizations o
JOIN reclamation_organizations ro ON o.id = ro.organization_id
JOIN reclamations r ON ro.reclamation_id = r.id
WHERE ro.status = 'validated' AND ro.validated_at IS NOT NULL
GROUP BY o.id
ORDER BY avg_resolution_hours ASC;

-- =====================================================
-- 3. PERFORMANCE DES EMPLOYÉS
-- =====================================================

-- 3.1 Classement des employés par tâches complétées
SELECT 
    e.first_name || ' ' || e.last_name as employee_name,
    o.name as organization_name,
    COUNT(t.id) as total_tasks,
    COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
    ROUND(COUNT(CASE WHEN t.status = 'completed' THEN 1 END) * 100.0 / NULLIF(COUNT(t.id), 0), 2) as completion_rate,
    COALESCE(SUM(pi.amount), 0) as total_earned
FROM employer e
JOIN organizations o ON e.organization_id = o.id
LEFT JOIN tasks t ON e.id = t.employer_id
LEFT JOIN payment_items pi ON e.id = pi.employer_id
GROUP BY e.id, o.name
ORDER BY completed_tasks DESC;

-- 3.2 Employés avec le plus de tâches en cours
SELECT 
    e.first_name || ' ' || e.last_name as employee_name,
    COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) as in_progress_tasks,
    COUNT(CASE WHEN t.status = 'assigned' THEN 1 END) as assigned_tasks
FROM employer e
LEFT JOIN tasks t ON e.id = t.employer_id
GROUP BY e.id
HAVING COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) > 0
ORDER BY in_progress_tasks DESC;

-- =====================================================
-- 4. ANALYSE FINANCIÈRE
-- =====================================================

-- 4.1 Total des paiements par organisation
SELECT 
    o.name,
    o.type,
    COUNT(DISTINCT pd.id) as total_distributions,
    SUM(pd.total_amount) as total_amount,
    COUNT(DISTINCT pi.employer_id) as employees_paid
FROM organizations o
JOIN reclamation_organizations ro ON o.id = ro.organization_id
JOIN payment_distributions pd ON ro.id = pd.reclamation_org_id
JOIN payment_items pi ON pd.id = pi.payment_distribution_id
GROUP BY o.id
ORDER BY total_amount DESC;

-- 4.2 Top 10 des plus gros paiements
SELECT 
    r.reference,
    r.title,
    u.first_name || ' ' || u.last_name as user_name,
    r.amount,
    r.created_at
FROM reclamations r
JOIN "user" u ON r.user_id = u.id
WHERE r.amount > 0
ORDER BY r.amount DESC
LIMIT 10;

-- 4.3 Solde des employés par organisation
SELECT 
    o.name as organization_name,
    SUM(e.balance) as total_balance,
    AVG(e.balance) as avg_balance,
    MAX(e.balance) as max_balance,
    COUNT(e.id) as total_employees
FROM employer e
JOIN organizations o ON e.organization_id = o.id
GROUP BY o.id
ORDER BY total_balance DESC;

-- =====================================================
-- 5. ANALYSE TEMPORELLE
-- =====================================================

-- 5.1 Réclamations par mois
SELECT 
    TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as month,
    COUNT(*) as count,
    COUNT(CASE WHEN status = 'validated' THEN 1 END) as resolved,
    COALESCE(SUM(amount), 0) as total_amount
FROM reclamations
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC
LIMIT 12;

-- 5.2 Réclamations par jour de la semaine
SELECT 
    EXTRACT(DOW FROM created_at) as day_of_week,
    CASE EXTRACT(DOW FROM created_at)
        WHEN 0 THEN 'Dimanche'
        WHEN 1 THEN 'Lundi'
        WHEN 2 THEN 'Mardi'
        WHEN 3 THEN 'Mercredi'
        WHEN 4 THEN 'Jeudi'
        WHEN 5 THEN 'Vendredi'
        WHEN 6 THEN 'Samedi'
    END as day_name,
    COUNT(*) as count
FROM reclamations
GROUP BY EXTRACT(DOW FROM created_at)
ORDER BY day_of_week;

-- 5.3 Heures de pointe des réclamations
SELECT 
    EXTRACT(HOUR FROM created_at) as hour,
    COUNT(*) as count
FROM reclamations
GROUP BY EXTRACT(HOUR FROM created_at)
ORDER BY hour;

-- =====================================================
-- 6. RECHERCHES ET FILTRES
-- =====================================================

-- 6.1 Recherche de réclamations par mot-clé
SELECT 
    reference,
    title,
    description,
    status,
    created_at,
    u.first_name || ' ' || u.last_name as user_name
FROM reclamations r
JOIN "user" u ON r.user_id = u.id
WHERE 
    title ILIKE '%panne%' 
    OR description ILIKE '%panne%'
ORDER BY created_at DESC;

-- 6.2 Réclamations urgentes non traitées
SELECT 
    r.reference,
    r.title,
    r.urgency,
    r.created_at,
    EXTRACT(HOUR FROM (NOW() - r.created_at)) as hours_waiting,
    u.first_name || ' ' || u.last_name as user_name,
    u.phone as user_phone
FROM reclamations r
JOIN "user" u ON r.user_id = u.id
WHERE r.urgency IN ('urgent', 'tres_urgent')
AND r.status = 'pending'
ORDER BY 
    CASE r.urgency WHEN 'tres_urgent' THEN 1 ELSE 2 END,
    r.created_at ASC;

-- 6.3 Réclamations sans réponse depuis plus de 48h
SELECT 
    r.reference,
    r.title,
    r.created_at,
    EXTRACT(HOUR FROM (NOW() - r.created_at)) as hours_waiting,
    u.first_name || ' ' || u.last_name as user_name,
    u.email as user_email
FROM reclamations r
JOIN "user" u ON r.user_id = u.id
WHERE r.status = 'pending'
AND r.created_at < NOW() - INTERVAL '48 hours'
ORDER BY r.created_at ASC;

-- =====================================================
-- 7. MAINTENANCE ET NETTOYAGE
-- =====================================================

-- 7.1 Réclamations orphelines (sans organisation)
SELECT r.*
FROM reclamations r
LEFT JOIN reclamation_organizations ro ON r.id = ro.reclamation_id
WHERE ro.id IS NULL;

-- 7.2 Tâches sans employé
SELECT t.*
FROM tasks t
LEFT JOIN employer e ON t.employer_id = e.id
WHERE e.id IS NULL;

-- 7.3 Nettoyer les anciennes notifications email (plus de 90 jours)
DELETE FROM emails_notifications 
WHERE sent_at < NOW() - INTERVAL '90 days'
RETURNING id;

-- 7.4 Archiver les réclamations terminées de plus de 6 mois
UPDATE reclamations 
SET status = 'archived' 
WHERE status = 'validated' 
AND updated_at < NOW() - INTERVAL '6 months'
RETURNING id, reference;

-- =====================================================
-- 8. EXPORTS POUR RAPPORTS
-- =====================================================

-- 8.1 Export des réclamations avec tous les détails
COPY (
    SELECT * FROM v_reclamations_complete
) TO '/tmp/reclamations_export.csv' WITH CSV HEADER;

-- 8.2 Export des soldes employés
COPY (
    SELECT * FROM v_employer_balance
) TO '/tmp/employer_balance_export.csv' WITH CSV HEADER;

-- 8.3 Export des statistiques mensuelles
COPY (
    SELECT * FROM v_monthly_stats
) TO '/tmp/monthly_stats_export.csv' WITH CSV HEADER;

-- =====================================================
-- 9. VUES PERSONNALISÉES
-- =====================================================

-- 9.1 Vue des réclamations avec délai de réponse
CREATE OR REPLACE VIEW v_reclamations_with_response_time AS
SELECT 
    r.*,
    u.first_name || ' ' || u.last_name as user_name,
    MIN(sh.changed_at) as first_response_at,
    EXTRACT(EPOCH FROM (MIN(sh.changed_at) - r.created_at))/3600 as response_time_hours
FROM reclamations r
JOIN "user" u ON r.user_id = u.id
LEFT JOIN status_history sh ON r.id = sh.reclamation_id 
    AND sh.new_status = 'in_progress'
GROUP BY r.id, u.id;

-- 9.2 Vue des tâches avec durée d'exécution
CREATE OR REPLACE VIEW v_tasks_with_duration AS
SELECT 
    t.*,
    e.first_name || ' ' || e.last_name as employer_name,
    o.name as organization_name,
    EXTRACT(EPOCH FROM (t.completed_at - t.created_at))/3600 as execution_time_hours
FROM tasks t
JOIN employer e ON t.employer_id = e.id
JOIN reclamation_organizations ro ON t.reclamation_org_id = ro.id
JOIN organizations o ON ro.organization_id = o.id
WHERE t.status = 'completed';

-- =====================================================
-- 10. REQUÊTES DE DIAGNOSTIC
-- =====================================================

-- 10.1 Vérifier les index manquants
SELECT 
    schemaname,
    tablename,
    seq_scan as sequential_scans,
    seq_tup_read as tuples_read,
    idx_scan as index_scans
FROM pg_stat_user_tables
WHERE seq_scan > 0
ORDER BY seq_scan DESC
LIMIT 10;

-- 10.2 Taille des tables
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size('public.' || tablename)) as total_size,
    pg_size_pretty(pg_relation_size('public.' || tablename)) as table_size,
    pg_size_pretty(pg_indexes_size('public.' || tablename)) as indexes_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size('public.' || tablename) DESC;

-- =====================================================
-- FIN DES REQUÊTES
-- =====================================================