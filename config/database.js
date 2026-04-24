const { Pool } = require('pg');

// Configuration de la base de données PostgreSQL
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'rms_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: 20, // Nombre maximum de clients dans le pool
    idleTimeoutMillis: 30000, // Temps maximum qu'un client peut rester inactif
    connectionTimeoutMillis: 2000, // Temps maximum d'attente pour une connexion
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

// Tester la connexion
const testConnection = async () => {
    try {
        const client = await pool.connect();
        console.log('✅ PostgreSQL connecté avec succès à la base:', process.env.DB_NAME || 'rms_db');
        
        // Vérifier la version de PostgreSQL
        const result = await client.query('SELECT version()');
        console.log('📦 PostgreSQL version:', result.rows[0].version.split(',')[0]);
        
        client.release();
        return true;
    } catch (error) {
        console.error('❌ Erreur de connexion PostgreSQL:', error.message);
        return false;
    }
};

// Exécuter une requête
const query = async (text, params) => {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        
        // Log des requêtes lentes (plus de 100ms)
        if (duration > 100) {
            console.log(`⚠️ Requête lente (${duration}ms):`, text.substring(0, 200));
        }
        
        return result;
    } catch (error) {
        console.error('❌ Erreur de requête:', error.message);
        throw error;
    }
};

// Obtenir un client pour transaction
const getClient = async () => {
    const client = await pool.connect();
    const queryClient = (text, params) => client.query(text, params);
    const releaseClient = () => client.release();
    
    return { client, query: queryClient, release: releaseClient };
};

// Démarrer une transaction
const beginTransaction = async (client) => {
    await client.query('BEGIN');
};

// Valider une transaction
const commitTransaction = async (client) => {
    await client.query('COMMIT');
};

// Annuler une transaction
const rollbackTransaction = async (client) => {
    await client.query('ROLLBACK');
};

// Exécuter une transaction complète
const transaction = async (callback) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

// Vérifier si une table existe
const tableExists = async (tableName) => {
    const result = await query(
        `SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
        )`,
        [tableName]
    );
    return result.rows[0].exists;
};

// Obtenir les statistiques de la base
const getDatabaseStats = async () => {
    const stats = {
        tables: {},
        totalSize: 0
    };
    
    // Taille de chaque table
    const tablesResult = await query(`
        SELECT 
            tablename,
            pg_size_pretty(pg_total_relation_size('public.' || tablename)) as size_pretty,
            pg_total_relation_size('public.' || tablename) as size_bytes
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY size_bytes DESC
    `);
    
    for (const row of tablesResult.rows) {
        stats.tables[row.tablename] = {
            size_pretty: row.size_pretty,
            size_bytes: row.size_bytes
        };
        stats.totalSize += parseInt(row.size_bytes);
    }
    
    // Compter les enregistrements
    const counts = await query(`
        SELECT 
            (SELECT COUNT(*) FROM "user") as users,
            (SELECT COUNT(*) FROM admin) as admins,
            (SELECT COUNT(*) FROM responsable) as responsables,
            (SELECT COUNT(*) FROM employer) as employers,
            (SELECT COUNT(*) FROM organizations) as organizations,
            (SELECT COUNT(*) FROM reclamations) as reclamations,
            (SELECT COUNT(*) FROM tasks) as tasks
    `);
    
    stats.counts = counts.rows[0];
    stats.totalSizePretty = (stats.totalSize / (1024 * 1024)).toFixed(2) + ' MB';
    
    return stats;
};

// Fermer la connexion
const closePool = async () => {
    await pool.end();
    console.log('🔒 Connexion PostgreSQL fermée');
};

module.exports = {
    pool,
    query,
    getClient,
    beginTransaction,
    commitTransaction,
    rollbackTransaction,
    transaction,
    testConnection,
    tableExists,
    getDatabaseStats,
    closePool
};