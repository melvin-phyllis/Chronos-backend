import EmployeeCollection from "../models/employee.modal.js";

const getEmployees = async (req, res) => {
    try {
        const { page } = req.query // numéro de la page (1, 2, 3…)

        if (!page) return
        const user = req.user

        const limit = 12; // nombre d'éléments par page

        const skip = (page - 1) * limit;
 
        if (user.role !== "admin") return res.json({ message: "route non autoriser" })
        const count = await EmployeeCollection.countDocuments()
        let TotalPages = 1;

        if (count > 12) {
            TotalPages = Math.ceil(count / 12);
        }

        console.log("total pages :", TotalPages, " count :", count);

        const employee = await EmployeeCollection.aggregate([

            { $skip: skip },
            { $limit: limit }
        ]);


        return res.json({ message: "Liste des employés récupérée avec succès", data: employee, TotalPages, success: true })

    } catch (error) {
        console.log(error)
        return res.json({ message: "erreur serveur" })
    }
}

export default getEmployees
