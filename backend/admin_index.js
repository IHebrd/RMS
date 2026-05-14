const bcrypt = require('bcrypt');
const { Pool } = require('pg');

// Use the same database config as your server.js
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'rms_db',
    password: 'hasseniheb2026', // Your PostgreSQL password - check server.js for this
    port: 5432,
});

async function insertAdmin() {
    const password = 'admin123';
    const hash = await bcrypt.hash(password, 10);
    
    console.log('Generated hash:', hash);
    
    const query = `
        INSERT INTO public.admin (
            email, 
            password_hash, 
            first_name, 
            last_name, 
            phone, 
            cin, 
            is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (email) DO NOTHING
        RETURNING id, email;
    `;
    
    const values = [
        'admin@example.com',
        hash,
        'Admin',
        'User',
        '+21612345678',
        '12345678',
        true
    ];
    
    try {
        await pool.connect();
        const result = await pool.query(query, values);
        if (result.rows.length > 0) {
            console.log('✅ Admin created successfully!');
            console.log('📝 Login credentials:');
            console.log('   Email: admin@example.com');
            console.log('   Password: admin123');
        } else {
            console.log('⚠️ Admin already exists with this email');
            
            // Show existing admins
            const admins = await pool.query('SELECT id, email, first_name, last_name FROM public.admin');
            console.log('Existing admins:', admins.rows);
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

insertAdmin();