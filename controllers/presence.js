import PresenceCollection from "../models/presence.model.js";
import EmployeeCollection from "../models/employee.modal.js";

// Utilitaire pour obtenir la date format YYYY-MM-DD locale
const getTodayDateString = () => {
    return new Date().toISOString().split('T')[0];
};

export const checkIn = async (req, res) => {
    try {
        const userId = req.user.id; // Récupéré depuis le middleware JWT
        const today = getTodayDateString();

        // 1. Vérifier si déjà pointé aujourd'hui
        const existingPresence = await PresenceCollection.findOne({
            user_id: userId,
            date: today
        });

        if (existingPresence) {
            return res.status(400).json({
                success: false,
                message: "Vous avez déjà pointé votre arrivée aujourd'hui."
            });
        }

        const now = new Date();
        const hour = now.getHours();

        // Logique métier : 
        // Début travail : 08h00
        // Tolérance : 1h (jusqu'à 09h00 inclus ou exclus selon interprétation, ici > 9h = retard)
        // Donc si pointage à 09h01 -> Retard.

        let statut = "present";
        if (hour >= 9) {
            statut = "retard";
        }

        // 2. Créer le pointage
        const newPresence = new PresenceCollection({
            user_id: userId,
            employeeId: userId, // Compatibilité
            date: today,
            check_in: now,
            statut: statut
        });

        await newPresence.save();

        if (req.io) {
            req.io.emit('presence_update', { type: 'check-in', data: newPresence });
        }

        // Transformation pour le frontend qui attend peut-être checkIn/checkOut en camelCase
        // Mais idéalement le frontend doit s'adapter au nouveau modèle.
        // Pour l'instant, on renvoie l'objet brut, on adaptera si besoin.

        res.status(201).json({
            success: true,
            message: "Check-in enregistré avec succès.",
            data: newPresence
        });

    } catch (error) {
        console.error("Erreur Check-in:", error);
        res.status(500).json({ success: false, message: "Erreur serveur lors du pointage." });
    }
};

export const checkOut = async (req, res) => {
    try {
        const userId = req.user.id;
        const today = getTodayDateString();

        // 1. Trouver le pointage du jour
        const presence = await PresenceCollection.findOne({
            user_id: userId,
            date: today
        });

        if (!presence) {
            return res.status(400).json({
                success: false,
                message: "Aucun pointage d'arrivée trouvé pour aujourd'hui."
            });
        }

        if (presence.check_out) {
            return res.status(400).json({
                success: false,
                message: "Vous avez déjà pointé votre départ."
            });
        }

        const now = new Date();
        // Règle métier : Départ interdit avant 17h00
        if (now.getHours() < 17) {
            return res.status(400).json({
                success: false,
                message: "Impossible de pointer avant 17h00. La journée n'est pas finie !"
            });
        }

        // 2. Mettre à jour le départ
        presence.check_out = now;

        // Calculer la durée (en heures)
        const durationMs = presence.check_out - presence.check_in;
        const durationHours = durationMs / (1000 * 60 * 60);
        presence.duree_travail = parseFloat(durationHours.toFixed(2));

        await presence.save();

        if (req.io) {
            req.io.emit('presence_update', { type: 'check-out', data: presence });
        }

        res.json({
            success: true,
            message: "Check-out enregistré. Bon repos !",
            data: presence
        });

    } catch (error) {
        console.error("Erreur Check-out:", error);
        res.status(500).json({ success: false, message: "Erreur serveur lors du départ." });
    }
};

export const getMyTodayPresence = async (req, res) => {
    try {
        const userId = req.user.id;
        const today = getTodayDateString();

        const presence = await PresenceCollection.findOne({
            user_id: userId,
            date: today
        });

        // Mapping pour compatibilité frontend temporaire (si le frontend utilise checkIn)
        // Mais idéalement, il faudrait mettre à jour le frontend.
        // Pour l'instant, on renvoie les données telles quelles.

        res.json({
            success: true,
            data: presence || null
        });

    } catch (error) {
        console.error("Erreur Get Presence:", error);
        res.status(500).json({ success: false, message: "Erreur serveur." });
    }
};

export const getAllPresence = async (req, res) => {
    try {
        const today = getTodayDateString();

        // 1. Récupérer les présences du jour popuplées avec le User (pour avoir l'email)
        const presences = await PresenceCollection.find({ date: today })
            .populate('user_id', 'email nom')
            .lean();

        // 2. Pour chaque présence, récupérer les infos complètes de l'employé via l'email
        const filledPresences = await Promise.all(presences.map(async (p) => {
            if (p.user_id && p.user_id.email) {
                const employee = await EmployeeCollection.findOne({ email: p.user_id.email })
                    .select('fullname employeeCode post department workingMethod documents payrollInformation');

                return {
                    ...p,
                    employeeDetails: employee || null
                };
            }
            return p;
        }));

        res.json({
            success: true,
            data: filledPresences
        });

    } catch (error) {
        console.error("Erreur GetAllPresence:", error);
        res.status(500).json({ success: false, message: "Erreur récupération des présences." });
    }
};
