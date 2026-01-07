import * as jose from "jose";
import secret from "./secret.js";
const middleware = async (req, res, next) => {
    const token = req.signedCookies.token;


    if (req.url == "/api/login") {

        return next()
    }
    if (!token) {
        return res.status(401).json({ message: "Utilisateur non connecté" });
    }

    const decodeToken = async () => {
        try {
            // 1. Décryptage
            // Note: jose vérifiera automatiquement l'expiration ici et lancera une erreur si expiré
            const { payload } = await jose.jwtDecrypt(token, secret);

            if (!payload) {
                return res.status(401).json({ message: "Token invalide" });
            }
            req.user = payload;
            console.log(payload)
            // 2. Gestion du "Refresh Token" (Renouvellement automatique)
            const now = Date.now() / 1000; // En secondes
            const timeleft = payload.exp - now;

            // Si il reste moins de 10 minutes
            if (timeleft < 60 * 10) {
                console.log("Renouvellement du token...");

                // On retire iat et exp pour ne pas les dupliquer
                const { iat, exp, ...newpayload } = payload;




                const newToken = await new jose.EncryptJWT(newpayload)
                    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
                    .setIssuedAt()
                    .setExpirationTime('7d')
                    .encrypt(secret);

                // Mise à jour du cookie
                res.cookie("token", newToken, {
                    maxAge: 7 * 24 * 60 * 60 * 1000,
                    httpOnly: true,
                    secure: true, // Mettre à false si vous testez en HTTP (localhost)
                    sameSite: 'lax',
                    signed: true,
                    path: "/"
                });
            }
        } catch (error) {
            console.log(error)
            return res.status(401).json({ message: "Token invalide ou expiré" })

        }
    }
    await decodeToken()

    return next()

}

export default middleware
