import CongeBalanceCollection from "../models/congeBalance.model.js";

// Initialiser ou récupérer le solde pour l'année en cours
export const getOrCreateBalance = async (userId) => {
    const currentYear = new Date().getFullYear();

    let balance = await CongeBalanceCollection.findOne({
        user_id: userId,
        annee: currentYear
    });

    if (!balance) {
        balance = new CongeBalanceCollection({
            user_id: userId,
            annee: currentYear,
            conges_payes_total: 30, // Par défaut
            conges_payes_pris: 0
        });
        await balance.save();
    }

    return balance;
};

export const getMyBalance = async (req, res) => {
    try {
        const userId = req.user.id;
        const balance = await getOrCreateBalance(userId);

        // Calcul du reste à prendre (bien que le virtual le fasse, on l'envoie explicitement si besoin)
        const reste = balance.conges_payes_total - balance.conges_payes_pris;

        res.json({
            success: true,
            data: {
                ...balance.toObject(),
                conges_payes_restants: reste
            }
        });

    } catch (error) {
        console.error("Erreur Get Balance:", error);
        res.status(500).json({ success: false, message: "Erreur serveur." });
    }
};
