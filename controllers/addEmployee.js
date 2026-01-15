import bcrypt from "bcrypt"
import EmployeeCollection from "../models/employee.modal.js"
import UserCollection from "../models/users.model.js"
import genpassword from "./genpassword.js"
import handleMongoError from "./handleMongoError.js"
import sendMail from "./sendMail.js"
const addEmployee = async (req, res) => {

    try {
        const body = req.body
        console.log(body)
        if (!body) return

        const password = genpassword()




        const newpassword = await bcrypt.hash(password, 12)

        const count = await EmployeeCollection.countDocuments()


        const employeeCode = `EMP-${String(count + 1).padStart(4, "0")}`

        // Create User first to get the userId
        const user = await UserCollection.insertOne({
            email: body?.email,
            nom: body?.name,
            firstname: body?.firstname,
            password: newpassword,
            role: body?.role || 'employee'
        })

        await user.save()

        const employee = await EmployeeCollection.insertOne({
            employeeCode,
            userId: user._id, // Link to User
            ...body
        })

        await employee.save()
        sendMail(
            'recrutement@nexa.com',
            body.email,
            "Creation du Compte",
            "Hello world?", // Plain-text version of the message
            `<!DOCTYPE html>
        <html lang="fr">
        <head>
        <meta charset="UTF-8">
        <title>Accès Portail RH</title>
        <style>
            body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f7;
            margin: 0;
            padding: 0;
            }

            .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            border-top: 6px solid #8000FF; /* violet pur */
            }

            h1 {
            color: #8000FF;
            text-align: center;
            margin-bottom: 10px;
            }

            p {
            color: #555555;
            font-size: 16px;
            line-height: 1.5;
            }

            .credentials {
            background-color: #e0ccff;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            font-family: monospace;
            color: #333333;
            }

            .btn {
            display: inline-block;
            padding: 12px 20px;
            background-color: #8000FF;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            text-align: center;
            }

            .footer {
            font-size: 12px;
            color: #999999;
            text-align: center;
            margin-top: 20px;
            }

            @media (max-width: 620px) {
            .container {
                margin: 20px;
                padding: 20px;
            }
            }
        </style>
        </head>
        <body>
        <div class="container">
            <h1>Accès Portail RH</h1>
            <p>Bonjour,</p>
            <p>Votre compte pour accéder au portail RH a été créé avec succès. Veuillez utiliser les informations suivantes pour vous connecter :</p>

            <div class="credentials">
            <p><strong>Email :</strong> ${body?.email}</p>
            <p><strong>Mot de passe :</strong> ${password}</p>
            </div>

            <p>Pour vous connecter, cliquez sur le bouton ci-dessous :</p>

            <p style="text-align:center;">
            <a href="${process?.env?.ORIGIN_URL}/login" class="btn">Se connecter au Portail RH</a>
            </p>

            <div class="footer">
            <p>Si vous n'avez pas créé ce compte, veuillez ignorer cet e-mail.</p>
            <p>© 2026 Nexa</p>
            </div>
        </div>
        </body>
        </html>`
        )
        console.log(employee)


        res.json({ message: 'Employee added successfully' })

    } catch (error) {

        console.log(error)

        const err = handleMongoError(error);

        res.status(err.status).json({ message: err.message });
    }
}
export default addEmployee
