import PayrollCollection from "../models/payroll.model.js";

const getMyPayrolls = async (req, res) => {
    try {
        const userId = req.user.id;
        let payrolls = await PayrollCollection.find({ user_id: userId }).sort({ annee: -1, mois: -1 });

        // Simuler des données si aucune n'existe (pour la démo)
        if (payrolls.length === 0) {
            const today = new Date();
            const dummyData = [];

            // Générer pour les 3 derniers mois
            for (let i = 0; i < 3; i++) {
                const date = new Date(today.getFullYear(), today.getMonth() - i, 25);
                // Si la date calculée est dans le futur, on saute
                if (date > new Date()) continue;

                const mois = date.getMonth() + 1; // 0-indexed to 1-indexed
                const annee = date.getFullYear();

                dummyData.push({
                    user_id: userId,
                    mois: mois,
                    annee: annee,
                    montant_brut: 3500,
                    montant: 2850,
                    statut: 'paye',
                    date_paiement: date,
                    pdf_url: "#", // Lien factice
                    details: {
                        salaire_base: 3000,
                        primes: 500,
                        deductions: 650,
                        heures_supplementaires: 0
                    }
                });
            }

            if (dummyData.length > 0) {
                // On insère les fausses données
                payrolls = await PayrollCollection.insertMany(dummyData);
                // On retrie pour l'affichage
                payrolls.sort((a, b) => {
                    if (b.annee !== a.annee) return b.annee - a.annee;
                    return b.mois - a.mois;
                });
            }
        }

        res.json({ success: true, data: payrolls });
    } catch (error) {
        console.error("Erreur récupération paie:", error);
        res.status(500).json({ success: false, message: "Erreur serveur" });
    }
};

const getPayrollDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const payroll = await PayrollCollection.findOne({ _id: id, user_id: req.user.id });

        if (!payroll) {
            return res.status(404).json({ success: false, message: "Fiche de paie non trouvée" });
        }

        res.json({ success: true, data: payroll });
    } catch (error) {
        console.error("Erreur détails paie:", error);
        res.status(500).json({ success: false, message: "Erreur serveur" });
    }
};

export { getMyPayrolls, getPayrollDetails };
