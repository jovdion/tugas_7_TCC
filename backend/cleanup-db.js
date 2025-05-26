import dotenv from 'dotenv';
import db from './config/database.js';

dotenv.config();

const cleanupDatabase = async () => {
  try {
    console.log('🧹 Starting database cleanup...');
    
    // Test connection
    await db.authenticate();
    console.log('✅ Database connection established');
    
    // Show current tables
    const [tables] = await db.query("SHOW TABLES");
    console.log('📋 Current tables:', tables);
    
    // Drop foreign key constraints first
    console.log('🔧 Dropping foreign key constraints...');
    
    try {
      // Get all foreign key constraints
      const [constraints] = await db.query(`
        SELECT 
          CONSTRAINT_NAME, 
          TABLE_NAME,
          REFERENCED_TABLE_NAME,
          REFERENCED_COLUMN_NAME
        FROM information_schema.KEY_COLUMN_USAGE 
        WHERE REFERENCED_TABLE_SCHEMA = '${process.env.DB_NAME}' 
        AND REFERENCED_TABLE_NAME IS NOT NULL
      `);
      
      console.log('📋 Found foreign key constraints:', constraints);
      
      // Drop each constraint
      for (const constraint of constraints) {
        try {
          await db.query(`ALTER TABLE ${constraint.TABLE_NAME} DROP FOREIGN KEY ${constraint.CONSTRAINT_NAME}`);
          console.log(`✅ Dropped constraint: ${constraint.CONSTRAINT_NAME} from ${constraint.TABLE_NAME}`);
        } catch (err) {
          console.log(`⚠️ Could not drop constraint ${constraint.CONSTRAINT_NAME}:`, err.message);
        }
      }
    } catch (err) {
      console.log('⚠️ Could not retrieve constraints:', err.message);
    }
    
    // Option 1: Drop tables completely (DANGEROUS - will delete all data!)
    console.log('\n🚨 CHOOSE CLEANUP METHOD:');
    console.log('1. Drop all tables (DELETES ALL DATA)');
    console.log('2. Keep tables, just remove constraints');
    
    // For automated cleanup, we'll just remove constraints
    // If you want to drop tables, uncomment the lines below:
    
    /*
    const tablesToDrop = ['Catatans', 'Users'];
    for (const table of tablesToDrop) {
      try {
        await db.query(`DROP TABLE IF EXISTS ${table}`);
        console.log(`🗑️ Dropped table: ${table}`);
      } catch (err) {
        console.log(`⚠️ Could not drop table ${table}:`, err.message);
      }
    }
    */
    
    console.log('✅ Database cleanup completed!');
    console.log('💡 You can now run your application to recreate tables with proper constraints.');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await db.close();
    console.log('🔒 Database connection closed');
    process.exit(0);
  }
};

// Run cleanup
cleanupDatabase();