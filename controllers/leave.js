import leaverequestCollection from "../models/leaverequest.modal.js";
import CongeBalanceCollection from "../models/congeBalance.model.js";
import { getOrCreateBalance } from "./congeBalance.js";

// Calcul simple de la durée en jours (pour l'instant inclus week-ends)
const calculateDays = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 pour inclure le jour de fin
    return diffDays;
};

export const createLeaveRequest = async (req, res) => {
    try {
        const userId = req.user.id;
        const { type_conge, date_debut, date_fin, justificatif_texte } = req.body;

        if (!type_conge || !date_debut || !date_fin) {
            return res.status(400).json({ success: false, message: "Données incomplètes." });
        }

        const nbJours = calculateDays(date_debut, date_fin);

        // Si congé payé, vérifier le solde (préventif, le débit réel se fait à la validation ou ici selon règle)
        // Ici on vérifie juste que ça ne dépasse pas manifestement le théorique
        if (type_conge === 'conge_paye') {
            const balance = await getOrCreateBalance(userId);
            const remaining = balance.conges_payes_total - balance.conges_payes_pris;

            if (nbJours > remaining) {
                return res.status(400).json({
                    success: false,
                    message: `Solde insuffisant. Vous demandez ${nbJours} jours, il vous reste ${remaining} jours.`
                });
            }
        }

        const newRequest = new leaverequestCollection({
            user_id: userId,
            employeeCode: userId, // Compat
            type_conge,
            date_debut,
            date_fin,
            nombre_jours: nbJours,
            justificatif_texte,
            statut: 'en_attente'
        });

        await newRequest.save();

        if (req.io) {
            req.io.emit('leave_update', { type: 'create', data: newRequest });
        }

        res.status(201).json({
            success: true,
            message: "Demande envoyée avec succès.",
            data: newRequest
        });

    } catch (error) {
        console.error("Erreur Création Congé:", error);
        res.status(500).json({ success: false, message: "Erreur serveur." });
    }
};

export const getMyLeaves = async (req, res) => {
    try {
        const userId = req.user.id;
        const leaves = await leaverequestCollection.find({ user_id: userId }).sort({ date_demande: -1 });
        res.json({ success: true, data: leaves });
    } catch (error) {
        console.error("Erreur History Congé:", error);
        res.status(500).json({ success: false, message: "Erreur serveur." });
    }
};

// ADMIN : Valider ou Refuser
export const updateLeaveStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { statut, commentaire_admin } = req.body; // 'valide' ou 'rejete'
        const adminId = req.user.id;

        const request = await leaverequestCollection.findById(id);
        if (!request) return res.status(404).json({ success: false, message: "Demande non trouvée." });

        if (request.statut !== 'en_attente') {
            return res.status(400).json({ success: false, message: "Cette demande a déjà été traitée." });
        }

        request.statut = statut;
        request.commentaire_admin = commentaire_admin;
        request.date_traitement = new Date();
        request.traite_par = adminId;

        // Logique de débit du solde si validé
        if (statut === 'valide' && request.type_conge === 'conge_paye') {
            const balance = await getOrCreateBalance(request.user_id);

            // Vérification ultime
            const remaining = balance.conges_payes_total - balance.conges_payes_pris;
            if (request.nombre_jours > remaining) {
                return res.status(400).json({
                    success: false,
                    message: "Impossible de valider : le solde de l'employé est insuffisant."
                });
            }

            balance.conges_payes_pris += request.nombre_jours;
            balance.historique.push({
                type: 'debit',
                nombre_jours: request.nombre_jours,
                date: new Date(),
                leave_id: request._id
            });
            await balance.save();
        }

        await request.save();

        if (req.io) {
            req.io.emit('leave_update', { type: 'update_status', data: request });
        }

        res.json({ success: true, message: `Demande ${statut}.`, data: request });

    } catch (error) {
        console.error("Erreur Update Congé:", error);
        res.status(500).json({ success: false, message: "Erreur serveur." });
    }
};

// ADMIN : Récupérer toutes les demandes
export const getAllLeaves = async (req, res) => {
    try {
        const leaves = await leaverequestCollection.find()
            .populate('user_id', 'nom firstname email employeeCode post department')
            .sort({ date_demande: -1 });

        res.json({ success: true, data: leaves });
    } catch (error) {
        console.error("Erreur GetAll Leaves:", error);
        res.status(500).json({ success: false, message: "Erreur serveur." });
    }
};

// ADMIN : Stats des congés
export const getLeaveStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        // Stats par type (jours validés)
        const statsByType = await leaverequestCollection.aggregate([
            { $match: { statut: 'valide' } },
            {
                $group: {
                    _id: '$type_conge',
                    totalJours: { $sum: '$nombre_jours' },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Employés en congé aujourd'hui
        const onLeaveToday = await leaverequestCollection.countDocuments({
            statut: 'valide',
            date_debut: { $lte: todayEnd },
            date_fin: { $gte: today }
        });

        // Formatter pour le front
        const typeStats = {
            conge_paye: { jours: 0, count: 0 },
            conge_maladie: { jours: 0, count: 0 },
            conge_sans_solde: { jours: 0, count: 0 },
            conge_exceptionnel: { jours: 0, count: 0 }
        };

        statsByType.forEach(s => {
            if (typeStats[s._id]) {
                typeStats[s._id] = { jours: s.totalJours, count: s.count };
            }
        });

        res.json({
            success: true,
            data: {
                typeStats,
                onLeaveToday
            }
        });

    } catch (error) {
        console.error("Erreur LeaveStats:", error);
        res.status(500).json({ success: false, message: "Erreur serveur." });
    }
};
