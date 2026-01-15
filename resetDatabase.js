import mongoose from 'mongoose';
import dotenv from 'dotenv';
import UserCollection from './models/users.model.js';
import EmployeeCollection from './models/employee.modal.js';
import PresenceCollection from './models/presence.model.js';
import LeaveRequestCollection from './models/leaverequest.modal.js';
import PayrollCollection from './models/payroll.model.js';
import SurveyCollection from './models/survey.model.js';
import SurveyResponseCollection from './models/surveyResponse.model.js';
import TaskCollection from './models/task.model.js';
import CongeBalanceCollection from './models/congeBalance.model.js';

dotenv.config();

const resetDatabase = async () => {
    try {
        console.log("🟠 Connexion à MongoDB pour réinitialisation...");
        await mongoose.connect(process.env.MONGO_URL, { dbName: "nexa_dev" });
        console.log("✅ Connecté.");

        // Admin à conserver
        const adminEmail = "admin@nexa.app";

        console.log(`\n🔍 Recherche de l'admin: ${adminEmail}`);
        const adminUser = await UserCollection.findOne({ email: adminEmail });

        if (adminUser) {
            console.log("✅ Admin trouvé (User). Il sera conservé.");
        } else {
            console.warn("⚠️ Admin non trouvé dans Users ! Toutes les données Users seront supprimées.");
        }

        // 1. Users: Delete all except admin
        const usersResult = await UserCollection.deleteMany({ email: { $ne: adminEmail } });
        console.log(`🗑️ Users supprimés : ${usersResult.deletedCount}`);

        // 2. Employees: Delete all except admin
        const employeesResult = await EmployeeCollection.deleteMany({ email: { $ne: adminEmail } });
        console.log(`🗑️ Employees supprimés : ${employeesResult.deletedCount}`);

        // 3. Delete ALL others (assuming admin doesn't need these preserved for a "clean" slate, or we can't easily link them if ID checks are complex)
        // Usually, for a hard reset, we wipe these.

        const presenceResult = await PresenceCollection.deleteMany({});
        console.log(`🗑️ Presences supprimées : ${presenceResult.deletedCount}`);

        const leaveResult = await LeaveRequestCollection.deleteMany({});
        console.log(`🗑️ Demandes de congés supprimées : ${leaveResult.deletedCount}`);

        const payrollResult = await PayrollCollection.deleteMany({});
        console.log(`🗑️ Bulletins de paie supprimés : ${payrollResult.deletedCount}`);

        const surveyResult = await SurveyCollection.deleteMany({});
        console.log(`🗑️ Sondages supprimés : ${surveyResult.deletedCount}`);

        const surveyRespResult = await SurveyResponseCollection.deleteMany({});
        console.log(`🗑️ Réponses sondages supprimées : ${surveyRespResult.deletedCount}`);

        const taskResult = await TaskCollection.deleteMany({});
        console.log(`🗑️ Tâches supprimées : ${taskResult.deletedCount}`);

        const balanceResult = await CongeBalanceCollection.deleteMany({});
        console.log(`🗑️ Soldes de congés supprimés : ${balanceResult.deletedCount}`);

        console.log("\n✨ Base de données réinitialisée avec succès !");
        console.log(`(L'admin ${adminEmail} a été conservé si présent)`);

        process.exit(0);
    } catch (error) {
        console.error("❌ Erreur lors de la réinitialisation :", error);
        process.exit(1);
    }
};

resetDatabase();
