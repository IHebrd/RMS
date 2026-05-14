-- =====================================================
-- RMS - RECLAMATION MANAGEMENT SYSTEM
-- Fichier: seed.sql
-- Description: Données de test pour la base de données
-- =====================================================

-- =====================================================
-- CLEAN ALL TABLES IN ONE STATEMENT
-- =====================================================

TRUNCATE TABLE
    reclamation_messages,
    status_history,
    payment_items,
    payment_distributions,
    emails_notifications,
    proofs,
    tasks,
    reclamation_organizations,
    reclamations,
    employer,
    responsable,
    admin,
    "user",
    organizations
RESTART IDENTITY CASCADE;

-- =====================================================
-- 1. ORGANISATIONS
-- =====================================================

INSERT INTO organizations (name, type, description, governorate, delegation, address, phone, email, website) VALUES
('STEG', 'public'::organization_type, 'Société Tunisienne de l''Électricité et du Gaz', 'Tunis', 'Tunis Centre', 'Rue d''Angleterre, Tunis', '71100000', 'contact@steg.tn', 'www.steg.tn');

INSERT INTO organizations (name, type, description, governorate, delegation, address, phone, email, website) VALUES
('SONEDE', 'public'::organization_type, 'Société Nationale d''Exploitation et de Distribution des Eaux', 'Tunis', 'Tunis Centre', 'Rue Hédi Nouira, Tunis', '71111111', 'contact@sonede.tn', 'www.sonede.tn');

INSERT INTO organizations (name, type, description, governorate, delegation, address, phone, email) VALUES
('Municipalité de Tunis', 'public'::organization_type, 'Municipalité de la ville de Tunis', 'Tunis', 'Tunis Médina', 'Place du Gouvernement, Tunis', '71222222', 'contact@tunis.tn');

INSERT INTO organizations (name, type, description, governorate, delegation, address, phone, email, website) VALUES
('Sécurité Plus', 'private'::organization_type, 'Installation et maintenance de systèmes de sécurité', 'Ariana', 'Ennasr', 'Rue de la Technologie, Ariana', '70333333', 'contact@securiteplus.tn', 'www.securiteplus.tn');

INSERT INTO organizations (name, type, description, governorate, delegation, address, phone, email, website) VALUES
('Tunisie Télécom', 'private'::organization_type, 'Opérateur de télécommunications', 'Tunis', 'Tunis Centre', 'Avenue Mohamed V, Tunis', '71444444', 'contact@tunisietelecom.tn', 'www.tunisietelecom.tn');

INSERT INTO organizations (name, type, description, governorate, delegation, address, phone, email) VALUES
('Croissant Rouge Tunisien', 'association'::organization_type, 'Aide humanitaire et sociale', 'Tunis', 'Tunis Centre', 'Rue de Marseille, Tunis', '71555555', 'contact@croissantrouge.tn');

INSERT INTO organizations (name, type, description, governorate, delegation, address, phone, email) VALUES
('TopNet', 'public'::organization_type, 'Fournisseur d''accès internet', 'Ariana', 'Ennasr', 'Rue de la Technologie, Ariana', '71666666', 'contact@topnet.tn');

INSERT INTO organizations (name, type, description, governorate, delegation, address, phone, email) VALUES
('SOS Plomberie', 'private'::organization_type, 'Dépannage plomberie urgent', 'Tunis', 'Tunis Centre', 'Avenue Habib Bourguiba, Tunis', '71777777', 'contact@sosplomberie.tn');

-- =====================================================
-- VERIFY ORGANIZATIONS
-- =====================================================

DO $$
DECLARE
    org_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO org_count FROM organizations;
    IF org_count < 8 THEN
        RAISE EXCEPTION 'Organizations insert failed: % rows found, expected 8', org_count;
    END IF;
    RAISE NOTICE '✅ Organizations OK: % rows', org_count;
END $$;

-- =====================================================
-- 2. ADMIN
-- =====================================================

INSERT INTO admin (email, password_hash, first_name, last_name, phone, cin) VALUES
('admin@rms.com', '$2a$10$uSvVTjEIjjQGfJuPYEulo.EGjsDNM799cjYuw/BA.uMFZzU.KGW.i', 'Super', 'Admin', '70123456', '99999999');

-- =====================================================
-- 3. RESPONSABLES
-- =====================================================

INSERT INTO responsable (email, password_hash, first_name, last_name, phone, cin, organization_id, position) VALUES
('ahmed.benali@steg.tn', '$2a$10$qY8vuaFlKBt7KdP/RHgbgeeuEWXKLS3zg8wfCgVFnmoeObjl8HWXO', 'Ahmed', 'Ben Ali', '98123456', '12345678', 1, 'Directeur Régional');

INSERT INTO responsable (email, password_hash, first_name, last_name, phone, cin, organization_id, position) VALUES
('karim.jlassi@sonede.tn', '$2a$10$qY8vuaFlKBt7KdP/RHgbgeeuEWXKLS3zg8wfCgVFnmoeObjl8HWXO', 'Karim', 'Jlassi', '98234567', '23456789', 2, 'Chef de service');

INSERT INTO responsable (email, password_hash, first_name, last_name, phone, cin, organization_id, position) VALUES
('sami.trabelsi@securiteplus.tn', '$2a$10$qY8vuaFlKBt7KdP/RHgbgeeuEWXKLS3zg8wfCgVFnmoeObjl8HWXO', 'Sami', 'Trabelsi', '98345678', '34567890', 4, 'Directeur Technique');

INSERT INTO responsable (email, password_hash, first_name, last_name, phone, cin, organization_id, position) VALUES
('nadia.chebbi@tunisietelecom.tn', '$2a$10$qY8vuaFlKBt7KdP/RHgbgeeuEWXKLS3zg8wfCgVFnmoeObjl8HWXO', 'Nadia', 'Chebbi', '98456789', '45678901', 5, 'Responsable Clientèle');

-- =====================================================
-- 4. EMPLOYÉS
-- =====================================================

INSERT INTO employer (email, password_hash, first_name, last_name, phone, cin, organization_id, balance, skills) VALUES
('mohamed.sassi@steg.tn', '$2a$10$qY8vuaFlKBt7KdP/RHgbgeeuEWXKLS3zg8wfCgVFnmoeObjl8HWXO', 'Mohamed', 'Sassi', '97123456', '11111111', 1, 0, ARRAY['electricien', 'maintenance']);

INSERT INTO employer (email, password_hash, first_name, last_name, phone, cin, organization_id, balance, skills) VALUES
('hassen.benamor@steg.tn', '$2a$10$qY8vuaFlKBt7KdP/RHgbgeeuEWXKLS3zg8wfCgVFnmoeObjl8HWXO', 'Hassen', 'Ben Amor', '97234567', '22222222', 1, 0, ARRAY['electricien', 'depannage']);

INSERT INTO employer (email, password_hash, first_name, last_name, phone, cin, organization_id, balance, skills) VALUES
('wassim.benali@securiteplus.tn', '$2a$10$qY8vuaFlKBt7KdP/RHgbgeeuEWXKLS3zg8wfCgVFnmoeObjl8HWXO', 'Wassim', 'Ben Ali', '97345678', '33333333', 4, 0, ARRAY['alarme', 'camera', 'securite']);

INSERT INTO employer (email, password_hash, first_name, last_name, phone, cin, organization_id, balance, skills) VALUES
('leila.mansouri@securiteplus.tn', '$2a$10$qY8vuaFlKBt7KdP/RHgbgeeuEWXKLS3zg8wfCgVFnmoeObjl8HWXO', 'Leila', 'Mansouri', '97456789', '44444444', 4, 0, ARRAY['installation', 'maintenance']);

INSERT INTO employer (email, password_hash, first_name, last_name, phone, cin, organization_id, balance, skills) VALUES
('mehdi.karoui@sosplomberie.tn', '$2a$10$qY8vuaFlKBt7KdP/RHgbgeeuEWXKLS3zg8wfCgVFnmoeObjl8HWXO', 'Mehdi', 'Karoui', '97567890', '55555555', 8, 0, ARRAY['plombier', 'depannage']);

-- =====================================================
-- 5. UTILISATEURS
-- =====================================================

INSERT INTO "user" (email, password_hash, first_name, last_name, phone, cin, address, governorate) VALUES
('nour.chaabane@example.com', '$2a$10$qY8vuaFlKBt7KdP/RHgbgeeuEWXKLS3zg8wfCgVFnmoeObjl8HWXO', 'Nour', 'Chaabane', '50123456', '11223344', 'Rue de la Liberté, Ennasr', 'Ariana');

INSERT INTO "user" (email, password_hash, first_name, last_name, phone, cin, address, governorate) VALUES
('sarah.benmiled@example.com', '$2a$10$qY8vuaFlKBt7KdP/RHgbgeeuEWXKLS3zg8wfCgVFnmoeObjl8HWXO', 'Sarah', 'Ben Miled', '50234567', '22334455', 'Avenue Habib Bourguiba, Tunis', 'Tunis');

INSERT INTO "user" (email, password_hash, first_name, last_name, phone, cin, address, governorate) VALUES
('youssef.dhahri@example.com', '$2a$10$qY8vuaFlKBt7KdP/RHgbgeeuEWXKLS3zg8wfCgVFnmoeObjl8HWXO', 'Youssef', 'Dhahri', '50345678', '33445566', 'Rue de la République, Sousse', 'Sousse');

INSERT INTO "user" (email, password_hash, first_name, last_name, phone, cin, address, governorate) VALUES
('amira.toumi@example.com', '$2a$10$qY8vuaFlKBt7KdP/RHgbgeeuEWXKLS3zg8wfCgVFnmoeObjl8HWXO', 'Amira', 'Toumi', '50456789', '44556677', 'Boulevard de la Corniche, Sfax', 'Sfax');

-- =====================================================
-- 6. RÉCLAMATIONS
-- =====================================================

INSERT INTO reclamations (user_id, title, description, type, urgency, amount, status, location_lat, location_lng) VALUES
(1, 'Panne d''électricité dans Ennasr', 'Coupure totale depuis 2h, plusieurs foyers touchés dans le quartier', 'electrique'::reclamation_type, 'urgent'::urgency_level, 0, 'pending'::status_type, 36.8195, 10.1891);

INSERT INTO reclamation_organizations (reclamation_id, organization_id, status) VALUES
(1, 1, 'pending'::status_type);

INSERT INTO reclamations (user_id, title, description, type, urgency, amount, status, location_lat, location_lng) VALUES
(2, 'Fuite d''eau devant l''école', 'Fuite importante sur la voie publique, risque de gaspillage', 'plomberie'::reclamation_type, 'urgent'::urgency_level, 0, 'pending'::status_type, 36.8005, 10.1800);

INSERT INTO reclamation_organizations (reclamation_id, organization_id, status) VALUES
(2, 2, 'pending'::status_type);

INSERT INTO reclamations (user_id, title, description, type, urgency, amount, status, location_lat, location_lng) VALUES
(3, 'Système de sécurité défaillant', 'L''alarme ne s''active plus après l''orage de la semaine dernière', 'securite'::reclamation_type, 'urgent'::urgency_level, 150, 'pending'::status_type, 35.8250, 10.6360);

INSERT INTO reclamation_organizations (reclamation_id, organization_id, status) VALUES
(3, 4, 'pending'::status_type);

INSERT INTO reclamations (user_id, title, description, type, urgency, amount, status) VALUES
(4, 'Connexion internet très lente', 'Depuis 3 jours, débit très faible, impossible de travailler', 'numerique'::reclamation_type, 'normal'::urgency_level, 0, 'pending'::status_type);

INSERT INTO reclamation_organizations (reclamation_id, organization_id, status) VALUES
(4, 7, 'pending'::status_type);

INSERT INTO reclamations (user_id, title, description, type, urgency, amount, status, location_lat, location_lng) VALUES
(1, 'Danger sur la voie publique', 'Route effondrée avec câble électrique à découvert devant l''école', 'securite'::reclamation_type, 'tres_urgent'::urgency_level, 0, 'pending'::status_type, 36.8100, 10.1750);

INSERT INTO reclamation_organizations (reclamation_id, organization_id, status) VALUES
(5, 3, 'pending'::status_type);

INSERT INTO reclamation_organizations (reclamation_id, organization_id, status) VALUES
(5, 1, 'pending'::status_type);

INSERT INTO reclamations (user_id, title, description, type, urgency, amount, status) VALUES
(2, 'Aide pour famille nécessiteuse', 'Famille de 4 enfants nécessite une aide financière pour les fournitures scolaires', 'autre'::reclamation_type, 'normal'::urgency_level, 200, 'pending'::status_type);

INSERT INTO reclamation_organizations (reclamation_id, organization_id, status) VALUES
(6, 6, 'pending'::status_type);

-- =====================================================
-- 7. TÂCHES
-- =====================================================

INSERT INTO tasks (reclamation_org_id, employer_id, description, status, scheduled_date) VALUES
(1, 1, 'Intervention pour panne électrique - Vérifier le transformateur', 'assigned'::task_status_type, CURRENT_DATE + INTERVAL '1 day');

INSERT INTO tasks (reclamation_org_id, employer_id, description, status, payment_amount, scheduled_date) VALUES
(3, 3, 'Diagnostic et réparation du système d''alarme', 'assigned'::task_status_type, 80, CURRENT_DATE + INTERVAL '1 day');

INSERT INTO tasks (reclamation_org_id, employer_id, description, status, payment_amount, scheduled_date) VALUES
(3, 4, 'Test et calibration du système après réparation', 'assigned'::task_status_type, 70, CURRENT_DATE + INTERVAL '2 days');

-- =====================================================
-- 8. MESSAGES
-- =====================================================

INSERT INTO reclamation_messages (reclamation_org_id, sender_type, sender_id, message) VALUES
(1, 'user'::actor_type, 1, 'Bonjour, quand est-ce que l''électricité sera rétablie ?');

INSERT INTO reclamation_messages (reclamation_org_id, sender_type, sender_id, message) VALUES
(1, 'responsable'::actor_type, 1, 'Bonjour, l''équipe est déjà sur place. Le courant sera rétabli dans 1 heure.');

-- =====================================================
-- 9. STATUS HISTORY
-- =====================================================

INSERT INTO status_history (reclamation_id, old_status, new_status, changed_by_type, changed_by_id, comment) VALUES
(1, NULL, 'pending', 'user'::actor_type, 1, 'Réclamation créée par l''utilisateur');

INSERT INTO status_history (reclamation_id, old_status, new_status, changed_by_type, changed_by_id, comment) VALUES
(2, NULL, 'pending', 'user'::actor_type, 2, 'Réclamation créée par l''utilisateur');

INSERT INTO status_history (reclamation_id, old_status, new_status, changed_by_type, changed_by_id, comment) VALUES
(3, NULL, 'pending', 'user'::actor_type, 3, 'Réclamation créée par l''utilisateur');

-- =====================================================
-- 10. MISE À JOUR DES STATUTS
-- =====================================================

UPDATE reclamation_organizations
SET status            = 'in_progress'::status_type,
    responsable_notes = 'Équipe en cours de mobilisation'
WHERE id = 1;

INSERT INTO status_history (reclamation_org_id, old_status, new_status, changed_by_type, changed_by_id, comment) VALUES
(1, 'pending', 'in_progress', 'responsable'::actor_type, 1, 'Prise en charge par STEG');

-- =====================================================
-- MESSAGE DE FIN
-- =====================================================

DO $$
DECLARE
    org_count  INTEGER;
    user_count INTEGER;
    recl_count INTEGER;
    task_count INTEGER;
    emp_count  INTEGER;
    resp_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO org_count  FROM organizations;
    SELECT COUNT(*) INTO user_count FROM "user";
    SELECT COUNT(*) INTO recl_count FROM reclamations;
    SELECT COUNT(*) INTO task_count FROM tasks;
    SELECT COUNT(*) INTO emp_count  FROM employer;
    SELECT COUNT(*) INTO resp_count FROM responsable;

    RAISE NOTICE '✅ Données de test insérées avec succès !';
    RAISE NOTICE '🏢 Organisations  : %', org_count;
    RAISE NOTICE '👤 Responsables   : %', resp_count;
    RAISE NOTICE '👷 Employés       : %', emp_count;
    RAISE NOTICE '👥 Utilisateurs   : %', user_count;
    RAISE NOTICE '📋 Réclamations   : %', recl_count;
    RAISE NOTICE '✅ Tâches         : %', task_count;
    RAISE NOTICE '🔑 Mot de passe   : Admin@123 / Resp@123';
END $$;

