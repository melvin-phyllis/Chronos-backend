import EmployeeCollection from "../models/employee.modal.js";

const searchEmployee = async (req, res) => {
    try {
        const { search } = req.body
        if (search.toUpperCase().includes("EMP")) {

            console.log("recher effectue ");

            const employee = await EmployeeCollection.find({ employeeCode: { $regex: `${search}`, $options: "i" } })

            if (!employee) return res.json({ message: "aucun employee trouver" })


            return res.json({ message: "employe touver", data: employee, success: true })
        }

        const employee = await EmployeeCollection.find({ fullname: { $regex: `${search}`, $options: "i" } })

        if (!employee) return res.json({ message: "aucun employee trouver" })
        console.log(employee)
        return res.json({ message: "employe touver", data: employee, success: true })


    } catch (error) {
        console.log(error)
        return res.json({ message: "une erreur s'est produtie" })
    }
}

export default searchEmployee
