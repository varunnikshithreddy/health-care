import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg';
import { createClient } from '@supabase/supabase-js';
// Resolve paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load environment variables from server/.env or root .env
const serverEnvPath = path.resolve(__dirname, '../../.env');
const rootEnvPath = path.resolve(__dirname, '../../../.env');
if (fs.existsSync(serverEnvPath)) {
    dotenv.config({ path: serverEnvPath });
}
else if (fs.existsSync(rootEnvPath)) {
    dotenv.config({ path: rootEnvPath });
}
else {
    dotenv.config();
}
const { Client } = pg;
async function runMigration() {
    console.log('====================================================');
    console.log('   LifeCare AI — Supabase Database Migration Runner  ');
    console.log('====================================================\n');
    // Find the migration file
    const migrationPath = path.resolve(__dirname, '../../../supabase/migrations/001_initial_schema.sql');
    if (!fs.existsSync(migrationPath)) {
        console.error(`❌ Migration file not found at: ${migrationPath}`);
        process.exit(1);
    }
    const sqlContent = fs.readFileSync(migrationPath, 'utf-8');
    console.log(`📄 Loaded migration file: 001_initial_schema.sql (${sqlContent.length} bytes)`);
    const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (dbUrl) {
        console.log('\n🔌 Connecting directly to Supabase PostgreSQL via connection string...');
        const client = new Client({
            connectionString: dbUrl,
            ssl: {
                rejectUnauthorized: false,
            },
        });
        try {
            await client.connect();
            console.log(' Connected to PostgreSQL database.');
            console.log(' Executing schema migrations, RLS policies, triggers, and seed definitions...');
            await client.query('BEGIN');
            await client.query(sqlContent);
            await client.query('COMMIT');
            console.log(' Migration completed successfully!');
            // Verify tables
            const res = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
      `);
            console.log('\n Verified Public Tables:');
            res.rows.forEach((r) => console.log(`   - ${r.table_name}`));
            await client.end();
            console.log('\n Database setup is complete and ready for production!');
            process.exit(0);
        }
        catch (err) {
            await client.query('ROLLBACK').catch(() => { });
            console.error('\n❌ Migration execution failed:');
            console.error(err.message || err);
            await client.end().catch(() => { });
            process.exit(1);
        }
    }
    else if (supabaseUrl && serviceRoleKey && !supabaseUrl.includes('placeholder')) {
        console.log(`\n🔍 Checking Supabase Cloud instance at: ${supabaseUrl}`);
        const supabase = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });
        try {
            // Test connectivity by checking profiles table
            const { data, error } = await supabase.from('profiles').select('id').limit(1);
            if (!error) {
                console.log(' Connected to Supabase Cloud and verified tables already exist and are queryable!');
                console.log(' Profiles table is active and healthy.');
                process.exit(0);
            }
            else if (error.code === '42P01') {
                // Table does not exist
                console.log('\n⚠️  Notice: The public tables have not yet been created in your Supabase project.');
                console.log('\nTo execute the full DDL schema directly:');
                console.log('1. Set SUPABASE_DB_URL in your .env:');
                console.log('   SUPABASE_DB_URL="postgresql://postgres.[REF]:[DB_PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"');
                console.log('   (Find this in your Supabase Dashboard -> Project Settings -> Database -> Connection String (URI / Session pooler))\n');
                console.log('2. OR directly paste /supabase/migrations/001_initial_schema.sql into the Supabase SQL Editor at:');
                console.log(`   ${supabaseUrl.replace('.supabase.co', '')}/project/_/sql`);
                console.log('   and click "Run".\n');
                process.exit(0);
            }
            else {
                console.warn('⚠️ Supabase response:', error.message);
                process.exit(0);
            }
        }
        catch (err) {
            console.error('❌ Supabase connection error:', err.message);
            process.exit(1);
        }
    }
    else {
        console.log('\nℹ️  Notice: No active SUPABASE_DB_URL or live SUPABASE_SERVICE_ROLE_KEY configured in .env.');
        console.log('To apply this migration to your live Supabase database:');
        console.log('1. Add your credentials to server/.env:');
        console.log('   SUPABASE_DB_URL=postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres');
        console.log('   SUPABASE_URL=https://[REF].supabase.co');
        console.log('   SUPABASE_SERVICE_ROLE_KEY=[YOUR_SERVICE_ROLE_KEY]');
        console.log('2. Re-run: npm run migrate');
        console.log('3. Or paste supabase/migrations/001_initial_schema.sql into the Supabase Cloud SQL Editor.');
        process.exit(0);
    }
}
runMigration().catch((err) => {
    console.error('Unexpected error during migration:', err);
    process.exit(1);
});
