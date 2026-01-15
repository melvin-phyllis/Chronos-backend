import leaverequestCollection from "../models/leaverequest.modal.js"
import CongeBalanceCollection from "../models/congeBalance.model.js"

const cancelLeaverequest = async (req, res) => {
  try {
    const { id } = req.body; // L'ID envoyé par le front via axios.post('/cancel-leaverequest', { id: ... })
    const userId = req.user.id;

    if (!id) return res.status(400).json({ success: false, message: "ID manquant" });

    const request = await leaverequestCollection.findById(id);
    if (!request) return res.status(404).json({ success: false, message: "Demande non trouvée" });

    // Vérification que la demande appartient bien à l'utilisateur
    if (request.user_id.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Non autorisé" });
    }

    if (request.statut === 'annule' || request.statut === 'rejete') {
      return res.status(400).json({ success: false, message: "Demande déjà annulée ou rejetée" });
    }

    // Si la demande était validée ('valide') et de type 'conge_paye', il faut rembourser le solde
    if (request.statut === 'valide' && request.type_conge === 'conge_paye') {
      const balance = await CongeBalanceCollection.findOne({ user_id: userId, annee: new Date().getFullYear() });

      if (balance) {
        balance.conges_payes_pris -= request.nombre_jours;
        // On s'assure de ne pas descendre sous 0 (bug safety)
        if (balance.conges_payes_pris < 0) balance.conges_payes_pris = 0;

        balance.historique.push({
          type: 'remboursement',
          nombre_jours: request.nombre_jours,
          date: new Date(),
          leave_id: request._id
        });
        await balance.save();
      }
    }

    request.statut = 'annule';
    request.annule_par = 'employe';
    request.date_annulation = new Date();
    request.raison_annulation = 'Annulation par l\'utilisateur';

    await request.save();

    res.json({ success: true, message: "Demande annulée avec succès.", data: request });

  } catch (error) {
    console.error("Erreur Annulation:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
}

export default cancelLeaverequest