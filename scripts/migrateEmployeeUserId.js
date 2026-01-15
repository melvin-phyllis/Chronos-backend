/**
 * Migration Script: Link existing Employees to Users via email
 * 
 * Run this script once to update all existing Employee documents
 * with their corresponding User _id references.
 * 
 * Usage: node scripts/migrateEmployeeUserId.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import EmployeeCollection from '../models/employee.modal.js';
import UserCollection from '../models/users.model.js';

dotenv.config();

const migrateEmployeeUserIds = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URL, { dbName: "nexa_dev" });
        console.log('✅ Connected to MongoDB');

        // Get all employees without userId
        const employeesWithoutUserId = await EmployeeCollection.find({
            $or: [
                { userId: { $exists: false } },
                { userId: null }
            ]
        });

        console.log(`📋 Found ${employeesWithoutUserId.length} employees without userId`);

        let updated = 0;
        let notFound = 0;

        for (const employee of employeesWithoutUserId) {
            // Find corresponding user by email
            const user = await UserCollection.findOne({ email: employee.email });

            if (user) {
                await EmployeeCollection.findByIdAndUpdate(employee._id, {
                    userId: user._id
                });
                console.log(`✅ Linked: ${employee.firstname} ${employee.name} (${employee.email}) -> User ${user._id}`);
                updated++;
            } else {
                console.log(`⚠️ No user found for: ${employee.firstname} ${employee.name} (${employee.email})`);
                notFound++;
            }
        }

        console.log('\n--- Migration Summary ---');
        console.log(`✅ Updated: ${updated} employees`);
        console.log(`⚠️ No user found: ${notFound} employees`);
        console.log('-------------------------\n');

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
};

migrateEmployeeUserIds();
