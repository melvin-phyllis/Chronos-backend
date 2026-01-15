import EmployeeCollection from "../models/employee.modal.js";

/**
 * Get all employees for task assignment dropdown (no pagination)
 * Returns only essential fields: userId, fullname, employeeCode, department
 */
const getAllEmployeesForTasks = async (req, res) => {
    try {
        const user = req.user;

        if (user.role !== "admin") {
            return res.status(403).json({ success: false, message: "Non autorisé" });
        }

        const employees = await EmployeeCollection.find({}, {
            userId: 1,
            name: 1,
            firstname: 1,
            employeeCode: 1,
            department: 1,
            post: 1
        }).lean();

        // Format the response with fullname
        const formattedEmployees = employees.map(emp => ({
            _id: emp._id,
            userId: emp.userId,
            fullname: `${emp.firstname} ${emp.name}`,
            employeeCode: emp.employeeCode,
            department: emp.department,
            post: emp.post
        }));

        return res.json({
            success: true,
            message: "Liste des employés récupérée",
            data: formattedEmployees
        });

    } catch (error) {
        console.error("Error fetching employees for tasks:", error);
        return res.status(500).json({ success: false, message: "Erreur serveur" });
    }
};

export default getAllEmployeesForTasks;
