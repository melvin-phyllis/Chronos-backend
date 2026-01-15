import EmployeeCollection from "../models/employee.modal.js";
import PresenceCollection from "../models/presence.model.js";
import leaverequestCollection from "../models/leaverequest.modal.js";
import taskCollection from "../models/task.model.js";
import SurveyCollection from "../models/survey.model.js";
import SurveyResponseCollection from "../models/surveyResponse.model.js";

const getDashboardStats = async (req, res) => {
    try {
        const today = new Date();
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);

        // Format YYYY-MM-DD for presence
        const presenceDate = startOfDay.toISOString().split('T')[0];

        // 1. Total Employés
        const totalEmployees = await EmployeeCollection.countDocuments();

        // 2. Présents aujourd'hui
        const presentToday = await PresenceCollection.countDocuments({
            date: presenceDate,
            statut: 'present'
        });

        // 3. En congé aujourd'hui
        const onLeaveToday = await leaverequestCollection.countDocuments({
            statut: 'valide',
            date_debut: { $lte: endOfDay },
            date_fin: { $gte: startOfDay }
        });

        // 4. Demandes de congé en attente
        const pendingLeaves = await leaverequestCollection.countDocuments({
            statut: 'en_attente'
        });

        // 5. Masse salariale
        const employees = await EmployeeCollection.find({}, 'payrollInformation.monthlySalary');
        const payrollTotal = employees.reduce((acc, emp) => {
            const salaryStr = emp.payrollInformation?.monthlySalary;
            if (!salaryStr) return acc;
            const salary = parseFloat(salaryStr.replace(/[^\d.-]/g, ''));
            return acc + (isNaN(salary) ? 0 : salary);
        }, 0);

        // 6. Stats Tâches
        const taskStats = await taskCollection.aggregate([
            { $group: { _id: '$statut', count: { $sum: 1 } } }
        ]);
        const tasksEnCours = taskStats.find(s => s._id === 'en_cours')?.count || 0;
        const tasksAValider = taskStats.find(s => s._id === 'en_attente')?.count || 0;
        const tasksValidees = taskStats.find(s => s._id === 'valide')?.count || 0;
        const tasksRejetees = taskStats.find(s => s._id === 'rejete')?.count || 0;

        // 7. Stats Sondages
        const activeSurveys = await SurveyCollection.countDocuments({ statut: 'actif' });
        const totalSurveys = await SurveyCollection.countDocuments();
        const totalResponses = await SurveyResponseCollection.countDocuments();
        const participationRate = totalSurveys > 0 && totalEmployees > 0
            ? Math.round((totalResponses / (totalSurveys * totalEmployees)) * 100)
            : 0;

        // 8. Taux de présence mensuel (12 derniers mois)
        const monthlyPresence = [];
        for (let i = 11; i >= 0; i--) {
            const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const monthStart = monthDate.toISOString().split('T')[0].slice(0, 7); // YYYY-MM

            const count = await PresenceCollection.countDocuments({
                date: { $regex: `^${monthStart}` },
                statut: 'present'
            });

            const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
            monthlyPresence.push({
                month: monthNames[monthDate.getMonth()],
                year: monthDate.getFullYear(),
                count: count,
                rate: totalEmployees > 0 ? Math.round((count / (totalEmployees * 22)) * 100) : 0 // ~22 jours ouvrés
            });
        }

        // 9. Répartition des congés par type
        const leaveDistribution = await leaverequestCollection.aggregate([
            { $match: { statut: 'valide' } },
            { $group: { _id: '$type_conge', count: { $sum: 1 }, totalJours: { $sum: '$nombre_jours' } } }
        ]);
        const leaveTypes = {
            conge_paye: { label: 'Congé payé', count: 0, jours: 0 },
            conge_maladie: { label: 'Maladie', count: 0, jours: 0 },
            conge_sans_solde: { label: 'Sans solde', count: 0, jours: 0 },
            conge_exceptionnel: { label: 'Exceptionnel', count: 0, jours: 0 }
        };
        leaveDistribution.forEach(l => {
            if (leaveTypes[l._id]) {
                leaveTypes[l._id].count = l.count;
                leaveTypes[l._id].jours = l.totalJours;
            }
        });

        // 10. Progression des tâches (distribution par progression)
        const taskProgression = await taskCollection.aggregate([
            {
                $bucket: {
                    groupBy: '$progression',
                    boundaries: [0, 25, 50, 75, 100, 101],
                    default: 'other',
                    output: { count: { $sum: 1 } }
                }
            }
        ]);
        const progressionDistribution = {
            '0-25': 0, '25-50': 0, '50-75': 0, '75-100': 0, '100': 0
        };
        taskProgression.forEach(p => {
            if (p._id === 0) progressionDistribution['0-25'] = p.count;
            else if (p._id === 25) progressionDistribution['25-50'] = p.count;
            else if (p._id === 50) progressionDistribution['50-75'] = p.count;
            else if (p._id === 75) progressionDistribution['75-100'] = p.count;
            else if (p._id === 100) progressionDistribution['100'] = p.count;
        });

        // 11. Résultats sondages récents
        const recentSurveys = await SurveyCollection.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('titre statut createdAt');

        const surveyResults = await Promise.all(recentSurveys.map(async (survey) => {
            const responseCount = await SurveyResponseCollection.countDocuments({ survey_id: survey._id });
            return {
                titre: survey.titre,
                statut: survey.statut,
                responses: responseCount,
                participationRate: totalEmployees > 0 ? Math.round((responseCount / totalEmployees) * 100) : 0
            };
        }));

        res.json({
            success: true,
            data: {
                // Base stats
                totalEmployees,
                presentToday,
                onLeaveToday,
                pendingLeaves,
                payrollTotal,
                // Task stats
                tasksEnCours,
                tasksAValider,
                tasksValidees,
                tasksRejetees,
                // Survey stats
                activeSurveys,
                totalSurveys,
                totalResponses,
                participationRate,
                // New detailed stats
                monthlyPresence,
                leaveTypes,
                progressionDistribution,
                surveyResults
            }
        });

    } catch (error) {
        console.error("Erreur stats dashboard:", error);
        res.status(500).json({ success: false, message: "Erreur serveur" });
    }
};

export { getDashboardStats };
