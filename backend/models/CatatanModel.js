import { DataTypes } from 'sequelize';
import db from '../config/database.js';

const Catatan = db.define('Catatan', {
    catatan_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [1, 255]
        }
    },
    judul: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [1, 255]
        }
    },
    isi_catatan: {
        type: DataTypes.TEXT, // Changed from VARCHAR(255) to TEXT for longer content
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users', // Make sure this matches the User table name exactly
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    }
}, {
    tableName: 'Catatans', // Explicitly set table name
    timestamps: true,
    indexes: [
        {
            fields: ['userId'] // Index for faster queries
        },
        {
            fields: ['judul'] // Index for searching by title
        }
    ]
});

export default Catatan;