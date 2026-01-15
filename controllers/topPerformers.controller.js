import taskCollection from "../models/task.model.js";
import EmployeeCollection from "../models/employee.modal.js";

/**
 * Get top 10 employees by completed tasks
 * Returns employee name and count of validated tasks
 */
export const getTopPerformers = async (req, res) => {
    try {
        // Aggregate tasks by user_id where statut = 'valide'
        const topPerformers = await taskCollection.aggregate([
            { $match: { statut: 'valide' } },
            {
                $group: {
                    _id: '$user_id',
                    tasksCompleted: { $sum: 1 }
                }
            },
            { $sort: { tasksCompleted: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } }
        ]);

        // Get employee details for each user
        const result = await Promise.all(topPerformers.map(async (performer) => {
            let employeeName = performer.user?.nom || 'Inconnu';

            // Try to get full name from Employee collection
            if (performer.user?.email) {
                const employee = await EmployeeCollection.findOne(
                    { email: performer.user.email },
                    { firstname: 1, name: 1 }
                );
                if (employee) {
                    employeeName = `${employee.firstname} ${employee.name}`;
                }
            }

            return {
                name: employeeName,
                tasksCompleted: performer.tasksCompleted
            };
        }));

        res.json({ success: true, data: result });
    } catch (error) {
        console.error("Error getTopPerformers:", error);
        res.status(500).json({ success: false, message: "Erreur serveur" });
    }
};
