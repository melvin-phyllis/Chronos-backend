import bcrypt from "bcrypt"
import * as jose from "jose"
import UserCollection from "../models/users.model.js"
import secret from "./secret.js"

const login = async (req, res) => {
    try {
        const { email, password } = req.body

        // Validation des champs
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email et mot de passe requis"
            })
        }

        // Trouver l'utilisateur
        const user = await UserCollection.findOne({ email })
        console.log(user, "user")
        if (!user) {
            console.log("User not found for email:", email);
            return res.json({
                success: false,
                message: "Utilisateur non trouvé (Debug)" // Distinguer l'erreur
            })
        }

        // Vérifier le mot de passe
        console.log("Input password:", password);
        console.log("Stored hash:", user.password);

        const checkpassword = await bcrypt.compare(password, user.password)
        console.log("Password match result:", checkpassword);

        if (!checkpassword) {
            return res.json({
                success: false,
                message: "Mot de passe incorrect (Debug)" // Distinguer l'erreur
            })
        }


        console.log('✅ Login réussi:', { email, role: user.role })

        // Créer le token JWT
        const token = await new jose.EncryptJWT({
            id: user._id.toString(),
            fullname: user.fullname, // Note: user.fullname might be undefined if not in schema, checking if I should use user.nom
            nom: user.nom,
            email: user.email,
            role: user.role,
            sexe: user.sexe
        })
            .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
            .setIssuedAt()
            .setExpirationTime('7d')
            .encrypt(secret)

        // ✅ Définir le cookie AVANT res.json()
        res.cookie("token", token, {
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            signed: true,
            path: "/"
        })

        console.log('🍪 Cookie défini')


        return res.json({
            success: true,
            message: "Connecté avec succès",
            user: {
                nom: user.nom,
                role: user.role
            }
        })

    } catch (error) {
        console.error('❌ Erreur login:', error)


        if (!res.headersSent) {
            return res.status(500).json({
                success: false,
                message: "Erreur serveur"
            })
        }
    }
}

export default login
