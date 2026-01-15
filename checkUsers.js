import mongoose from 'mongoose';
import dotenv from 'dotenv';
import UserCollection from './models/users.model.js';

dotenv.config();

const checkUsers = async () => {
    try {
        console.log("Connecté à:", process.env.MONGO_URL);
        await mongoose.connect(process.env.MONGO_URL, { dbName: "nexa_dev" });

        const users = await UserCollection.find({});
        console.log(`Nombre d'utilisateurs trouvés: ${users.length}`);

        users.forEach(u => {
            console.log(`- ID: ${u._id}, Email: ${u.email}, Role: ${u.role}, Nom: ${u.nom}`);
        });

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkUsers();
