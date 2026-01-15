import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import UserCollection from './models/users.model.js';
import EmployeeCollection from './models/employee.modal.js';

dotenv.config();

const createAdmin = async () => {
    try {
        console.log("Connexion à MongoDB...");
        await mongoose.connect(process.env.MONGO_URL, { dbName: "nexa_dev" });
        console.log("Connecté.");

        const email = "admin@nexa.app";
        const password = "password123";
        const hashedPassword = await bcrypt.hash(password, 12);

        // 1. Check if user exists
        const existingUser = await UserCollection.findOne({ email });
        if (existingUser) {
            console.log("L'utilisateur admin existe déjà.");
            process.exit(0);
        }

        // 2. Create User
        const user = await UserCollection.create({
            email,
            nom: "Admin",
            password: hashedPassword,
            role: 'admin',
            isverified: true
        });
        console.log("Utilisateur Admin créé.");

        // 3. Create Employee linked to Admin
        const employee = await EmployeeCollection.create({
            name: "Admin",
            firstname: "System",
            email,
            employeeCode: "ADM-001",
            gender: "Homme",
            dateOfBirth: new Date("1990-01-01"),
            dateOfHire: new Date(),
            phone: {
                countryCode: "+33",
                phoneNumber: "0000000000"
            },
            address: "Siège social",
            post: "Directeur RH",
            department: "Ressources Humaines",
            contractType: "CDI",
            workingMethod: "Onsite"
        });
        console.log("Profil Employé Admin créé.");

        console.log("\n=================================");
        console.log("✅ COMPTE ADMIN CRÉÉ AVEC SUCCÈS");
        console.log(`📧 Email: ${email}`);
        console.log(`🔑 Mot de passe: ${password}`);
        console.log("=================================\n");

        process.exit(0);

    } catch (error) {
        console.error("Erreur:", error);
        process.exit(1);
    }
};

createAdmin();
