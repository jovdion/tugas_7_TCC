import { DataTypes } from 'sequelize';
import db from '../config/database.js';  // Updated path to match your structure

const User = db.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [2, 50]
        }
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
            notEmpty: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [6, 255]
        }
    },
    refresh_token: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'Users', // Explicitly set table name
    timestamps: true,    // This will add createdAt and updatedAt
    indexes: [
        {
            unique: true,
            fields: ['email']
        }
    ]
});

// Export the User model
export default User;