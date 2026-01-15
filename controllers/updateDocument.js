
const updateDocument = async (req, res) => {
  try {
    const { documentType, reason } = req.body;
    const userId = req.user.id;

    console.log(`[Document Request] User ${userId} requested update for ${documentType}: ${reason}`);

    // Ici on pourrait créer une Tâche pour l'admin ou une Notification
    // Pour l'instant, on simule le succès

    res.json({ success: true, message: "Demande reçue" });

  } catch (error) {
    console.log(error)
    res.status(500).json({ success: false, message: "Une erreur s'est produite" });
  }
}

export default updateDocument