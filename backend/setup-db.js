import dotenv from 'dotenv';
import db from './config/database.js';

// Import models
import User from './models/Usermodel.js';
import Catatan from './models/CatatanModel.js';

dotenv.config();

const setupDatabase = async () => {
  try {
    console.log('🔄 Starting complete database setup...');
    
    // Test connection
    await db.authenticate();
    console.log('✅ Database connection established');
    
    // Define associations
    console.log('🔗 Setting up model associations...');
    
    // User has many Catatan
    User.hasMany(Catatan, {
      foreignKey: 'userId',
      as: 'catatans',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    
    // Catatan belongs to User
    Catatan.belongsTo(User, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    
    console.log('✅ Model associations defined');
    
    // Step 1: Create tables without foreign keys first
    console.log('📊 Step 1: Creating User table...');
    await User.sync({ force: false, alter: true });
    
    console.log('📊 Step 2: Creating Catatan table...');
    await Catatan.sync({ force: false, alter: true });
    
    // Step 3: Show final table structure
    console.log('📋 Final database structure:');
    const [tables] = await db.query("SHOW TABLES");
    console.log('Tables:', tables);
    
    // Describe each table
    for (const table of tables) {
      const tableName = Object.values(table)[0];
      const [structure] = await db.query(`DESCRIBE ${tableName}`);
      console.log(`\n📊 Structure of ${tableName}:`, structure);
    }
    
    console.log('\n✅ Database setup completed successfully!');
    console.log('🚀 You can now start your application');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    
    if (error.message.includes('Duplicate foreign key')) {
      console.log('\n💡 Suggestion: Run cleanup-db.js first to remove duplicate constraints');
    }
  } finally {
    await db.close();
    console.log('🔒 Database connection closed');
    process.exit(0);
  }
};

// Run setup
setupDatabase();