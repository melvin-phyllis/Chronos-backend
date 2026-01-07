import express from 'express'
import ImageKit from 'imagekit'
import addEmployee from '../controllers/addEmployee.js'
import getEmployees from '../controllers/getEmployees.js'
import login from '../controllers/login.js'
import logout from '../controllers/logout.js'
import searchEmployee from '../controllers/searchEmployee.js'
import updateDocument from '../controllers/updateDocument.js'
import EmployeeCollection from '../models/employee.modal.js'
import leaverequestCollection from '../models/leaverequest.modal.js'
import taskCollection from '../models/task.model.js'
import cancelLeaverequest from '../controllers/cancelLeaverequest.js'


const routes = express.Router()
const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});


routes.post("/login", login)

routes.post("/addEmployee", addEmployee)

routes.get("/get-employees", getEmployees)

routes.post("/search-employee", searchEmployee)

routes.get("/logout", logout)

routes.get("/get-user-info", async (req, res) => {

    try {
        const { email } = req.user
        console.log("", email)
        const employee = await EmployeeCollection.findOne({ email })

        if (!employee) return res.json({ message: "user not found", success: true })

        console.log(employee)

        res.json({ message: "user found", success: true, data: employee })

    } catch (error) {
        console.log("/get-user-info", error)
        res.json({ message: "error server" })
    }
})

routes.post("/add-tasks", async (req, res) => {
    try {

        const body = req.body

        if (!body) return res.json({ message: "Tachd non fournir" })

        const task = await taskCollection.insertOne(body)

        await task

        console.log(task)

        res.json({ message: "tache ajouter", success: true, data: task?._id })

    } catch (error) {

        console.log(error)

        res.json({ message: "error server" })
    }
})

routes.get("/get-all-tasks-employee", async (req, res) => {
    try {
        if (req.user.role == "employee") {
            const query = req.query

            const employee = await taskCollection.find(query, { __V: 0 })

            return res.json({ message: "tache trouver", success: true, data: employee })
        }

        res.json({ message: "donner refuser", success: true })

    } catch (error) {

        console.log(error)

        res.json({ message: "error server" })
    }
})

routes.put("/updatetask/:id", async (req, res) => {
    try {
        const { id } = req.params
        const body = req.body

        if (!id) return res.json({ message: "id manquant " })
        console.log("id", id)

        const { _id, ...newBody } = body
        const task = await taskCollection.findByIdAndUpdate(id, newBody)
        await task.save()
        console.log("task", task)
        res.json({ message: "mise a jour reussi", success: true })

    } catch (error) {
        console.log(error)
        res.json({ message: "error server" })
    }
})

routes.post("/deletetask", async (req, res) => {

    try {

        const { id } = req.body

        if (!id) return res.json({ message: "une erreur c'est produite" })

        const task = await taskCollection.findByIdAndDelete(id)

        if (!task) return res.json({ message: "la tache n'existe pas dans la base de donner " })

        console.log(task);


        return res.json({ message: 'tache supprimer avec succes ', success: true })


    } catch (error) {

        console.log(error)
        return res.json({ message: "une erreur c'est produite" })
    }
})


routes.post("/leave-request/:employeeCode", async (req, res) => {
    try {
        const { employeeCode } = req.params;
        const body = req.body;

        // Validation des données
        if (!body || !employeeCode) {
            return res.status(400).json({
                message: 'Données non fournies',
                success: false
            });
        }

        // Récupération des congés payés approuvés pour CET employé
        const paidLeaveData = await leaverequestCollection.aggregate([
            {
                $match: {
                    employeeCode: employeeCode,
                    status: 'approved',
                    type: "paid"
                }
            },
            {
                $group: {
                    _id: "$employeeCode",
                    totalPaidLeaveDays: { $sum: "$intervaltime" }
                }
            }
        ]);

        // Calculer les jours utilisés et restants
        const totalUsedDays = paidLeaveData.length > 0
            ? paidLeaveData[0].totalPaidLeaveDays
            : 0;
        const remainingDays = 30 - totalUsedDays;

        // Vérifier si c'est un congé payé
        if (body?.type === "paid") {
            // Vérifier si le quota est déjà atteint
            if (totalUsedDays >= 30) {
                return res.status(400).json({
                    message: `Quota de congés atteint pour cette année. Jours restants: 0`,
                    success: false
                });
            }

            // Vérifier si la nouvelle demande dépasse le quota
            const newTotal = totalUsedDays + body.intervaltime;
            if (newTotal > 30) {
                return res.status(400).json({
                    message: `Demande refusée. Vous demandez ${body.intervaltime} jours mais il ne reste que ${remainingDays} jours disponibles.`,
                    success: false,
                    remainingDays: remainingDays
                });
            }
        }

        // Créer la demande de congé
        const leaveRequestData = {
            employeeCode: employeeCode,
            ...body
        };

        const result = await leaverequestCollection.insertOne(leaveRequestData);

        console.log(result)
        res.status(201).json({
            message: "Demande de congé reçue",
            success: true,
            data: result.insertedId,
            remainingDays: body?.type === "paid" ? remainingDays - body.intervaltime : null
        });

    } catch (error) {
        console.error('Erreur lors de la création de la demande:', error);
        res.status(500).json({
            message: 'Erreur serveur',
            success: false
        });
    }
});

routes.get("/leaverequest/:employeeCode", async (req, res) => {
    try {

        const { employeeCode } = req.params

        console.log(employeeCode)

        const leave = await leaverequestCollection.find({ employeeCode }, { __v: 0 })

        console.log(leave)

        console.log("okok")

        res.json({ message: "demande de conge recuperer", data: leave, success: true })


    } catch (error) {

        console.log(error)

        res.json({ message: "une erreru c'est produite" })
    }
})

routes.patch("/update-banking-info/:id", async (req, res) => {
    try {

        const body = req.body

        const { id } = req.params

        console.log("ok", body)

        const banking_info = await EmployeeCollection.findByIdAndUpdate(
            id,
            { $set: { payrollInformation: body } }
        )

        await banking_info.save()

        return res.json({ message: "mise a jour reussi", success: true })

    } catch (error) {
        console.log(error)
        return res.json({ message: "une erreur c'est produite" })
    }
})

routes.get('/auth-imagekit', (req, res) => {

    const { token, expire, signature } = imagekit.getAuthenticationParameters();

    return res.json({
        token,
        expire,
        signature,
        publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    });
});


routes.post("/update-file-document", updateDocument)




routes.post("/cancel-leaverequest", cancelLeaverequest)








































































































export default routes
