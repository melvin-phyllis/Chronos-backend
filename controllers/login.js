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

        if (!user) {
            return res.json({
                success: false,
                message: "Email ou mot de passe incorrect"
            })
        }

        // Vérifier le mot de passe
        const checkpassword = await bcrypt.compare(password, user.password)

        if (!checkpassword) {
            return res.json({
                success: false,
                message: "Email ou mot de passe incorrect"
            })
        }


        console.log('✅ Login réussi:', { email, role: user.role })

        // Créer le token JWT
        const token = await new jose.EncryptJWT({
            id: user._id.toString(),
            fullname: user.fullname,
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
            sameSite: 'lax',
            signed: true,
            path: "/"
        })

        console.log('🍪 Cookie défini')


        return res.json({
            success: true,
            message: "Connecté avec succès",
            user: {
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
