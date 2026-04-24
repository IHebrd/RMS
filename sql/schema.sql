-- =====================================================
-- RMS - RECLAMATION MANAGEMENT SYSTEM
-- Fichier: schema.sql
-- Description: Création complète de la base de données
-- Base: rms_db
-- =====================================================

DROP TABLE IF EXISTS reclamation_messages CASCADE;
DROP TABLE IF EXISTS status_history CASCADE;
DROP TABLE IF EXISTS payment_items CASCADE;
DROP TABLE IF EXISTS payment_distributions CASCADE;
DROP TABLE IF EXISTS emails_notifications CASCADE;
DROP TABLE IF EXISTS proofs CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS reclamation_organizations CASCADE;
DROP TABLE IF EXISTS reclamations CASCADE;
DROP TABLE IF EXISTS employer CASCADE;
DROP TABLE IF EXISTS responsable CASCADE;
DROP TABLE IF EXISTS admin CASCADE;
DROP TABLE IF EXISTS "user" CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

DROP TYPE IF EXISTS organization_type CASCADE;
DROP TYPE IF EXISTS reclamation_type CASCADE;
DROP TYPE IF EXISTS urgency_level CASCADE;
DROP TYPE IF EXISTS status_type CASCADE;
DROP TYPE IF EXISTS task_status_type CASCADE;
DROP TYPE IF EXISTS payment_status_type CASCADE;
DROP TYPE IF EXISTS file_type CASCADE;
DROP TYPE IF EXISTS actor_type CASCADE;
DROP TYPE IF EXISTS email_recipient_type CASCADE;

-- =====================================================
-- TYPES PERSONNALISÉS
-- =====================================================

CREATE TYPE organization_type    AS ENUM ('public', 'private', 'association');
CREATE TYPE reclamation_type     AS ENUM ('electrique', 'numerique', 'securite', 'voirie', 'plomberie', 'autre');
CREATE TYPE urgency_level        AS ENUM ('normal', 'urgent', 'tres_urgent');
CREATE TYPE status_type          AS ENUM ('pending', 'in_progress', 'validated', 'failed', 'archived');
CREATE TYPE task_status_type     AS ENUM ('assigned', 'in_progress', 'completed', 'failed');
CREATE TYPE payment_status_type  AS ENUM ('pending', 'paid');
CREATE TYPE file_type            AS ENUM ('image', 'video');
CREATE TYPE actor_type           AS ENUM ('admin', 'responsable', 'employer', 'user');
CREATE TYPE email_recipient_type AS ENUM ('user', 'employer', 'responsable', 'admin');

-- =====================================================
-- TABLE: organizations
-- =====================================================

CREATE TABLE organizations (
    id           SERIAL PRIMARY KEY,
    name         VARCHAR(200) NOT NULL,
    type         organization_type NOT NULL,
    description  TEXT,
    logo         VARCHAR(500),
    governorate  VARCHAR(50) NOT NULL,
    delegation   VARCHAR(50),
    postal_code  VARCHAR(10),
    address      TEXT,
    phone        VARCHAR(50),
    email        VARCHAR(100),
    website      VARCHAR(200),
    is_active    BOOLEAN DEFAULT TRUE,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE: admin
-- =====================================================

CREATE TABLE admin (
    id            SERIAL PRIMARY KEY,
    email         VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name    VARCHAR(100) NOT NULL,
    last_name     VARCHAR(100) NOT NULL,
    phone         VARCHAR(50),
    avatar        VARCHAR(500),
    cin           VARCHAR(20) UNIQUE,
    is_active     BOOLEAN DEFAULT TRUE,
    last_login    TIMESTAMP,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE: responsable
-- =====================================================

CREATE TABLE responsable (
    id              SERIAL PRIMARY KEY,
    email           VARCHAR(100) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    phone           VARCHAR(50),
    avatar          VARCHAR(500),
    cin             VARCHAR(20) UNIQUE,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    position        VARCHAR(100),
    is_active       BOOLEAN DEFAULT TRUE,
    last_login      TIMESTAMP,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE: employer
-- =====================================================

CREATE TABLE employer (
    id              SERIAL PRIMARY KEY,
    email           VARCHAR(100) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    phone           VARCHAR(50),
    avatar          VARCHAR(500),
    cin             VARCHAR(20) UNIQUE,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    balance         DECIMAL(10,2) DEFAULT 0,
    skills          TEXT[],
    is_active       BOOLEAN DEFAULT TRUE,
    last_login      TIMESTAMP,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE: user
-- =====================================================

CREATE TABLE "user" (
    id            SERIAL PRIMARY KEY,
    email         VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name    VARCHAR(100) NOT NULL,
    last_name     VARCHAR(100) NOT NULL,
    phone         VARCHAR(50),
    avatar        VARCHAR(500),
    cin           VARCHAR(20) UNIQUE,
    address       TEXT,
    governorate   VARCHAR(50),
    is_active     BOOLEAN DEFAULT TRUE,
    last_login    TIMESTAMP,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE: reclamations
-- =====================================================

CREATE TABLE reclamations (
    id                     SERIAL PRIMARY KEY,
    reference              VARCHAR(50) UNIQUE NOT NULL DEFAULT '',
    user_id                INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    title                  VARCHAR(200) NOT NULL,
    description            TEXT NOT NULL,
    type                   reclamation_type NOT NULL,
    urgency                urgency_level NOT NULL,
    amount                 DECIMAL(10,2) DEFAULT 0,
    status                 status_type DEFAULT 'pending',
    location_lat           DECIMAL(10,8),
    location_lng           DECIMAL(11,8),
    payment_status         payment_status_type DEFAULT 'pending',
    payment_transaction_id VARCHAR(100),
    created_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE: reclamation_organizations
-- =====================================================

CREATE TABLE reclamation_organizations (
    id               SERIAL PRIMARY KEY,
    reclamation_id   INTEGER NOT NULL REFERENCES reclamations(id) ON DELETE CASCADE,
    organization_id  INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    status           status_type DEFAULT 'pending',
    responsable_notes TEXT,
    validated_at     TIMESTAMP,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(reclamation_id, organization_id)
);

-- =====================================================
-- TABLE: tasks
-- =====================================================

CREATE TABLE tasks (
    id                 SERIAL PRIMARY KEY,
    reference          VARCHAR(50) UNIQUE DEFAULT '',
    reclamation_org_id INTEGER NOT NULL REFERENCES reclamation_organizations(id) ON DELETE CASCADE,
    employer_id        INTEGER NOT NULL REFERENCES employer(id) ON DELETE CASCADE,
    description        TEXT NOT NULL,
    status             task_status_type DEFAULT 'assigned',
    payment_amount     DECIMAL(10,2) DEFAULT 0,
    payment_status     payment_status_type DEFAULT 'pending',
    scheduled_date     DATE,
    completed_at       TIMESTAMP,
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE: proofs
-- =====================================================

CREATE TABLE proofs (
    id               SERIAL PRIMARY KEY,
    task_id          INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    file_path        VARCHAR(500) NOT NULL,
    file_type        file_type NOT NULL,
    description      TEXT,
    uploaded_by      INTEGER NOT NULL,
    uploaded_by_type actor_type NOT NULL,
    uploaded_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE: payment_distributions
-- =====================================================

CREATE TABLE payment_distributions (
    id                 SERIAL PRIMARY KEY,
    reference          VARCHAR(50) UNIQUE DEFAULT '',
    reclamation_org_id INTEGER NOT NULL REFERENCES reclamation_organizations(id) ON DELETE CASCADE,
    responsable_id     INTEGER NOT NULL REFERENCES responsable(id) ON DELETE CASCADE,
    total_amount       DECIMAL(10,2) NOT NULL,
    distributed_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE: payment_items
-- =====================================================

CREATE TABLE payment_items (
    id                      SERIAL PRIMARY KEY,
    payment_distribution_id INTEGER NOT NULL REFERENCES payment_distributions(id) ON DELETE CASCADE,
    employer_id             INTEGER NOT NULL REFERENCES employer(id) ON DELETE CASCADE,
    amount                  DECIMAL(10,2) NOT NULL,
    task_id                 INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
    transfer_reference      VARCHAR(100),
    transfer_reason         TEXT,
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE: emails_notifications
-- =====================================================

CREATE TABLE emails_notifications (
    id             SERIAL PRIMARY KEY,
    recipient_email VARCHAR(100) NOT NULL,
    recipient_type  email_recipient_type NOT NULL,
    recipient_id    INTEGER NOT NULL,
    action_type     VARCHAR(50) NOT NULL,
    subject         VARCHAR(255) NOT NULL,
    content         TEXT NOT NULL,
    status          VARCHAR(20) DEFAULT 'sent',
    sent_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reclamation_id  INTEGER REFERENCES reclamations(id) ON DELETE SET NULL,
    task_id         INTEGER REFERENCES tasks(id) ON DELETE SET NULL
);

-- =====================================================
-- TABLE: status_history
-- =====================================================

CREATE TABLE status_history (
    id                 SERIAL PRIMARY KEY,
    reclamation_id     INTEGER REFERENCES reclamations(id) ON DELETE CASCADE,
    reclamation_org_id INTEGER REFERENCES reclamation_organizations(id) ON DELETE CASCADE,
    task_id            INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    old_status         VARCHAR(20),
    new_status         VARCHAR(20) NOT NULL,
    changed_by_type    actor_type NOT NULL,
    changed_by_id      INTEGER NOT NULL,
    changed_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    comment            TEXT,
    CHECK (
        (reclamation_id IS NOT NULL) OR
        (reclamation_org_id IS NOT NULL) OR
        (task_id IS NOT NULL)
    )
);

-- =====================================================
-- TABLE: reclamation_messages
-- =====================================================

CREATE TABLE reclamation_messages (
    id                 SERIAL PRIMARY KEY,
    reclamation_org_id INTEGER NOT NULL REFERENCES reclamation_organizations(id) ON DELETE CASCADE,
    sender_type        actor_type NOT NULL,
    sender_id          INTEGER NOT NULL,
    message            TEXT NOT NULL,
    is_read            BOOLEAN DEFAULT FALSE,
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_organizations_type        ON organizations(type);
CREATE INDEX idx_organizations_governorate ON organizations(governorate);
CREATE INDEX idx_organizations_is_active   ON organizations(is_active);

CREATE INDEX idx_admin_email ON admin(email);
CREATE INDEX idx_admin_cin   ON admin(cin);

CREATE INDEX idx_responsable_email        ON responsable(email);
CREATE INDEX idx_responsable_organization ON responsable(organization_id);
CREATE INDEX idx_responsable_cin          ON responsable(cin);

CREATE INDEX idx_employer_email        ON employer(email);
CREATE INDEX idx_employer_organization ON employer(organization_id);
CREATE INDEX idx_employer_cin          ON employer(cin);
CREATE INDEX idx_employer_balance      ON employer(balance);

CREATE INDEX idx_user_email      ON "user"(email);
CREATE INDEX idx_user_cin        ON "user"(cin);
CREATE INDEX idx_user_governorate ON "user"(governorate);

CREATE INDEX idx_reclamations_user      ON reclamations(user_id);
CREATE INDEX idx_reclamations_status    ON reclamations(status);
CREATE INDEX idx_reclamations_reference ON reclamations(reference);
CREATE INDEX idx_reclamations_created   ON reclamations(created_at);
CREATE INDEX idx_reclamations_type      ON reclamations(type);
CREATE INDEX idx_reclamations_urgency   ON reclamations(urgency);

CREATE INDEX idx_rec_org_reclamation ON reclamation_organizations(reclamation_id);
CREATE INDEX idx_rec_org_organization ON reclamation_organizations(organization_id);
CREATE INDEX idx_rec_org_status       ON reclamation_organizations(status);

CREATE INDEX idx_tasks_employer   ON tasks(employer_id);
CREATE INDEX idx_tasks_status     ON tasks(status);
CREATE INDEX idx_tasks_rec_org    ON tasks(reclamation_org_id);
CREATE INDEX idx_tasks_reference  ON tasks(reference);
CREATE INDEX idx_tasks_scheduled  ON tasks(scheduled_date);

CREATE INDEX idx_proofs_task        ON proofs(task_id);
CREATE INDEX idx_proofs_uploaded_by ON proofs(uploaded_by, uploaded_by_type);

CREATE INDEX idx_emails_recipient ON emails_notifications(recipient_email);
CREATE INDEX idx_emails_sent_at   ON emails_notifications(sent_at);
CREATE INDEX idx_emails_action    ON emails_notifications(action_type);

CREATE INDEX idx_payment_distributions_rec_org  ON payment_distributions(reclamation_org_id);
CREATE INDEX idx_payment_items_employer         ON payment_items(employer_id);
CREATE INDEX idx_payment_items_distribution     ON payment_items(payment_distribution_id);

CREATE INDEX idx_status_history_reclamation ON status_history(reclamation_id);
CREATE INDEX idx_status_history_rec_org     ON status_history(reclamation_org_id);
CREATE INDEX idx_status_history_changed_at  ON status_history(changed_at);
CREATE INDEX idx_status_history_changed_by  ON status_history(changed_by_type, changed_by_id);

CREATE INDEX idx_messages_reclamation_org ON reclamation_messages(reclamation_org_id);
CREATE INDEX idx_messages_sender          ON reclamation_messages(sender_type, sender_id);
CREATE INDEX idx_messages_created         ON reclamation_messages(created_at);

-- =====================================================
-- FONCTION: update_updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_updated_at
    BEFORE UPDATE ON admin
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_responsable_updated_at
    BEFORE UPDATE ON responsable
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employer_updated_at
    BEFORE UPDATE ON employer
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_updated_at
    BEFORE UPDATE ON "user"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reclamations_updated_at
    BEFORE UPDATE ON reclamations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reclamation_organizations_updated_at
    BEFORE UPDATE ON reclamation_organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FONCTION: generate_reclamation_reference (FIXED)
-- =====================================================

CREATE OR REPLACE FUNCTION generate_reclamation_reference()
RETURNS TRIGGER AS $$
DECLARE
    year_part VARCHAR(4);
    seq_part  VARCHAR(6);
BEGIN
    year_part := TO_CHAR(CURRENT_DATE, 'YYYY');
    SELECT LPAD(
        (COALESCE(MAX(CAST(SUBSTRING(reference FROM 9) AS INTEGER)), 0) + 1)::text,
        6, '0'
    )
    INTO seq_part
    FROM reclamations
    WHERE reference LIKE 'REC-' || year_part || '-%';

    NEW.reference := 'REC-' || year_part || '-' || seq_part;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_reclamation_reference
    BEFORE INSERT ON reclamations
    FOR EACH ROW
    WHEN (NEW.reference IS NULL OR NEW.reference = '')
    EXECUTE FUNCTION generate_reclamation_reference();

-- =====================================================
-- FONCTION: generate_task_reference (FIXED)
-- =====================================================

CREATE OR REPLACE FUNCTION generate_task_reference()
RETURNS TRIGGER AS $$
DECLARE
    year_part VARCHAR(4);
    seq_part  VARCHAR(6);
BEGIN
    year_part := TO_CHAR(CURRENT_DATE, 'YYYY');
    SELECT LPAD(
        (COALESCE(MAX(CAST(SUBSTRING(reference FROM 9) AS INTEGER)), 0) + 1)::text,
        6, '0'
    )
    INTO seq_part
    FROM tasks
    WHERE reference LIKE 'TSK-' || year_part || '-%';

    NEW.reference := 'TSK-' || year_part || '-' || seq_part;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_task_reference
    BEFORE INSERT ON tasks
    FOR EACH ROW
    WHEN (NEW.reference IS NULL OR NEW.reference = '')
    EXECUTE FUNCTION generate_task_reference();

-- =====================================================
-- FONCTION: generate_payment_reference (FIXED)
-- =====================================================

CREATE OR REPLACE FUNCTION generate_payment_reference()
RETURNS TRIGGER AS $$
DECLARE
    year_part VARCHAR(4);
    seq_part  VARCHAR(6);
BEGIN
    year_part := TO_CHAR(CURRENT_DATE, 'YYYY');
    SELECT LPAD(
        (COALESCE(MAX(CAST(SUBSTRING(reference FROM 9) AS INTEGER)), 0) + 1)::text,
        6, '0'
    )
    INTO seq_part
    FROM payment_distributions
    WHERE reference LIKE 'PAY-' || year_part || '-%';

    NEW.reference := 'PAY-' || year_part || '-' || seq_part;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_payment_reference
    BEFORE INSERT ON payment_distributions
    FOR EACH ROW
    WHEN (NEW.reference IS NULL OR NEW.reference = '')
    EXECUTE FUNCTION generate_payment_reference();

-- =====================================================
-- FONCTION: update_employer_balance
-- =====================================================

CREATE OR REPLACE FUNCTION update_employer_balance()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE employer
    SET balance    = balance + NEW.amount,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.employer_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_employer_balance
    AFTER INSERT ON payment_items
    FOR EACH ROW
    EXECUTE FUNCTION update_employer_balance();

-- =====================================================
-- VUES
-- =====================================================

CREATE OR REPLACE VIEW v_reclamations_complete AS
SELECT
    r.id,
    r.reference,
    r.title,
    r.description,
    r.type,
    r.urgency,
    r.amount,
    r.status AS reclamation_status,
    r.created_at,
    u.id AS user_id,
    u.first_name || ' ' || u.last_name AS user_name,
    u.email AS user_email,
    u.phone AS user_phone,
    u.governorate,
    STRING_AGG(DISTINCT o.name, ', ') AS organizations,
    json_agg(DISTINCT jsonb_build_object('id', o.id, 'name', o.name, 'status', ro.status)) AS organizations_detail
FROM reclamations r
JOIN "user" u ON r.user_id = u.id
JOIN reclamation_organizations ro ON r.id = ro.reclamation_id
JOIN organizations o ON ro.organization_id = o.id
GROUP BY r.id, u.id;

-- =====================================================

CREATE OR REPLACE VIEW v_employer_balance AS
SELECT
    e.id,
    e.first_name || ' ' || e.last_name AS employer_name,
    e.email,
    o.id AS organization_id,
    o.name AS organization_name,
    e.balance,
    COALESCE(SUM(pi.amount), 0) AS total_received,
    COUNT(DISTINCT pi.id) AS payment_count,
    MAX(pi.created_at) AS last_payment_date
FROM employer e
JOIN organizations o ON e.organization_id = o.id
LEFT JOIN payment_items pi ON e.id = pi.employer_id
GROUP BY e.id, o.id;

-- =====================================================

CREATE OR REPLACE VIEW v_organization_stats AS
SELECT
    o.id,
    o.name,
    o.type,
    o.governorate,
    COUNT(DISTINCT ro.reclamation_id)                              AS total_reclamations,
    COUNT(CASE WHEN ro.status = 'pending'     THEN 1 END)          AS pending_count,
    COUNT(CASE WHEN ro.status = 'in_progress' THEN 1 END)          AS in_progress_count,
    COUNT(CASE WHEN ro.status = 'validated'   THEN 1 END)          AS validated_count,
    COUNT(CASE WHEN ro.status = 'failed'      THEN 1 END)          AS failed_count,
    COUNT(DISTINCT e.id)                                           AS total_employees,
    COUNT(DISTINCT r.id)                                           AS total_responsables,
    COALESCE(SUM(t.payment_amount), 0)                             AS total_payments
FROM organizations o
LEFT JOIN reclamation_organizations ro ON o.id = ro.organization_id
LEFT JOIN employer e ON o.id = e.organization_id
LEFT JOIN responsable r ON o.id = r.organization_id
LEFT JOIN tasks t ON ro.id = t.reclamation_org_id
GROUP BY o.id;

-- =====================================================

CREATE OR REPLACE VIEW v_responsable_dashboard AS
SELECT
    r.id AS responsable_id,
    r.first_name || ' ' || r.last_name AS responsable_name,
    o.id AS organization_id,
    o.name AS organization_name,
    o.type AS organization_type,
    COUNT(DISTINCT ro.reclamation_id)                                          AS total_reclamations,
    COUNT(DISTINCT CASE WHEN ro.status = 'pending'     THEN ro.reclamation_id END) AS pending_reclamations,
    COUNT(DISTINCT CASE WHEN ro.status = 'in_progress' THEN ro.reclamation_id END) AS in_progress_reclamations,
    COUNT(DISTINCT CASE WHEN ro.status = 'validated'   THEN ro.reclamation_id END) AS validated_reclamations,
    COUNT(DISTINCT t.id)                                                       AS total_tasks,
    COUNT(DISTINCT CASE WHEN t.status = 'completed'    THEN t.id END)          AS completed_tasks,
    COUNT(DISTINCT e.id)                                                       AS total_employees,
    COALESCE(SUM(t.payment_amount), 0)                                         AS total_payments_distributed
FROM responsable r
JOIN organizations o ON r.organization_id = o.id
LEFT JOIN reclamation_organizations ro ON o.id = ro.organization_id
LEFT JOIN tasks t ON ro.id = t.reclamation_org_id
LEFT JOIN employer e ON o.id = e.organization_id
GROUP BY r.id, o.id;

-- =====================================================

CREATE OR REPLACE VIEW v_recent_activities AS
SELECT
    'reclamation'::text AS entity_type,
    r.id                AS entity_id,
    r.reference         AS entity_reference,
    r.status::text      AS status,
    r.created_at        AS activity_date,
    u.first_name || ' ' || u.last_name AS user_name,
    'Création de réclamation'::text    AS action
FROM reclamations r
JOIN "user" u ON r.user_id = u.id

UNION ALL

SELECT
    'status_change'::text              AS entity_type,
    sh.id                              AS entity_id,
    COALESCE(r.reference, t.reference) AS entity_reference,
    sh.new_status::text                AS status,
    sh.changed_at                      AS activity_date,
    CASE
        WHEN sh.changed_by_type = 'user'        THEN u.first_name  || ' ' || u.last_name
        WHEN sh.changed_by_type = 'responsable' THEN res.first_name || ' ' || res.last_name
        WHEN sh.changed_by_type = 'employer'    THEN e.first_name   || ' ' || e.last_name
        WHEN sh.changed_by_type = 'admin'       THEN a.first_name   || ' ' || a.last_name
    END AS user_name,
    ('Changement de statut: ' || COALESCE(sh.old_status, 'N/A') || ' → ' || sh.new_status)::text AS action
FROM status_history sh
LEFT JOIN reclamations r   ON sh.reclamation_id  = r.id
LEFT JOIN tasks t          ON sh.task_id         = t.id
LEFT JOIN "user" u         ON sh.changed_by_type = 'user'        AND sh.changed_by_id = u.id
LEFT JOIN responsable res  ON sh.changed_by_type = 'responsable' AND sh.changed_by_id = res.id
LEFT JOIN employer e       ON sh.changed_by_type = 'employer'    AND sh.changed_by_id = e.id
LEFT JOIN admin a          ON sh.changed_by_type = 'admin'       AND sh.changed_by_id = a.id
ORDER BY activity_date DESC
LIMIT 100;

-- =====================================================

CREATE OR REPLACE VIEW v_monthly_stats AS
SELECT
    DATE_TRUNC('month', created_at)                        AS month,
    COUNT(*)                                               AS total_reclamations,
    COUNT(CASE WHEN status = 'validated'  THEN 1 END)      AS resolved_reclamations,
    COUNT(CASE WHEN type   = 'electrique' THEN 1 END)      AS electrique_count,
    COUNT(CASE WHEN type   = 'numerique'  THEN 1 END)      AS numerique_count,
    COUNT(CASE WHEN type   = 'securite'   THEN 1 END)      AS securite_count,
    COUNT(CASE WHEN type   = 'voirie'     THEN 1 END)      AS voirie_count,
    COUNT(CASE WHEN type   = 'plomberie'  THEN 1 END)      AS plomberie_count,
    COALESCE(SUM(amount), 0)                               AS total_amount
FROM reclamations
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- =====================================================
-- MESSAGE DE FIN
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Base de données RMS créée avec succès !';
    RAISE NOTICE '📊 Tables créées: 14';
    RAISE NOTICE '🔍 Vues créées: 6';
    RAISE NOTICE '⚡ Triggers créés: 9';
    RAISE NOTICE '📈 Indexes créés: 28';
END $$;