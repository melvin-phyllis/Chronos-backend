import SurveyCollection from "../models/survey.model.js";
import SurveyResponseCollection from "../models/surveyResponse.model.js";

// Récupérer les sondages disponibles pour l'employé
const getAvailableSurveys = async (req, res) => {
    try {
        const userId = req.user.id;

        // Simuler des sondages si aucun n'existe (pour la démo)
        const surveyCount = await SurveyCollection.countDocuments();
        if (surveyCount === 0) {
            const adminId = req.user.id; // Pour la démo, on utilise l'user actuel comme créateur
            await SurveyCollection.create([
                {
                    admin_id: adminId,
                    titre: "Satisfaction au travail - Q1 2026",
                    description: "Nous aimerions recueillir votre avis sur l'ambiance et les conditions de travail.",
                    questions: [
                        {
                            question: "Comment évaluez-vous votre équilibre vie pro / vie perso ?",
                            type: "echelle",
                            obligatoire: true
                        },
                        {
                            question: "Quels aspects de l'environnement de travail appréciez-vous le plus ?",
                            type: "texte_libre",
                            obligatoire: false
                        },
                        {
                            question: "Recommanderiez-vous Nexus à un ami ?",
                            type: "oui_non",
                            obligatoire: true
                        }
                    ],
                    statut: 'actif',
                    date_fin: new Date(new Date().setMonth(new Date().getMonth() + 1))
                },
                {
                    admin_id: adminId,
                    titre: "Choix du menu de la fête d'été",
                    description: "Votez pour votre menu préféré pour la prochaine fête d'entreprise !",
                    questions: [
                        {
                            question: "Quel type de cuisine préférez-vous ?",
                            type: "choix_multiple",
                            options: ["Italien", "Asiatique", "Barbecue", "Végétarien"],
                            obligatoire: true
                        }
                    ],
                    statut: 'actif'
                }
            ]);
        }

        // Récupérer les sondages actifs
        const surveys = await SurveyCollection.find({ statut: 'actif' }).sort({ createdAt: -1 });

        // Vérifier auxquels l'utilisateur a déjà répondu
        const responses = await SurveyResponseCollection.find({ user_id: userId }).distinct('survey_id');

        // Ajouter un flag "responded" pour le front
        const surveysWithStatus = surveys.map(s => ({
            ...s.toObject(),
            responded: responses.map(id => id.toString()).includes(s._id.toString())
        }));

        res.json({ success: true, data: surveysWithStatus });

    } catch (error) {
        console.error("Erreur récupération sondages:", error);
        res.status(500).json({ success: false, message: "Erreur serveur" });
    }
};

// Soumettre une réponse
const submitSurveyResponse = async (req, res) => {
    try {
        const { survey_id, reponses } = req.body;
        const user_id = req.user.id;

        if (!survey_id || !reponses) {
            return res.status(400).json({ success: false, message: "Données incomplètes" });
        }

        // Vérifier si déjà répondu
        const existingResponse = await SurveyResponseCollection.findOne({ survey_id, user_id });
        if (existingResponse) {
            return res.status(400).json({ success: false, message: "Vous avez déjà répondu à ce sondage" });
        }

        await SurveyResponseCollection.create({
            survey_id,
            user_id,
            reponses
        });

        res.json({ success: true, message: "Réponse enregistrée avec succès" });

    } catch (error) {
        console.error("Erreur soumission sondage:", error);
        res.status(500).json({ success: false, message: "Erreur serveur" });
    }
};

// Créer un nouveau sondage
const createSurvey = async (req, res) => {
    try {
        const { titre, description, questions, date_fin } = req.body;
        const admin_id = req.user.id;

        if (!titre || !questions || questions.length === 0) {
            return res.status(400).json({ success: false, message: "Titre et questions sont requis" });
        }

        const newSurvey = await SurveyCollection.create({
            admin_id,
            titre,
            description,
            questions,
            date_fin,
            statut: 'actif'
        });

        res.json({ success: true, message: "Sondage créé avec succès", data: newSurvey });

    } catch (error) {
        console.error("Erreur création sondage:", error);
        res.status(500).json({ success: false, message: "Erreur serveur" });
    }
};

// Récupérer tous les sondages (Vue Admin)
const getAllSurveysForAdmin = async (req, res) => {
    try {
        const surveys = await SurveyCollection.find().sort({ createdAt: -1 });
        res.json({ success: true, data: surveys });
    } catch (error) {
        console.error("Erreur récupération admin sondages:", error);
        res.status(500).json({ success: false, message: "Erreur serveur" });
    }
};

// Obtenir les stats d'un sondage (Qui a répondu / Pas répondu)
import EmployeeCollection from "../models/employee.modal.js";

const getSurveyStats = async (req, res) => {
    try {
        const { id } = req.params;

        const survey = await SurveyCollection.findById(id);
        if (!survey) return res.status(404).json({ success: false, message: "Sondage non trouvé" });

        // 1. Tous les employés
        const allEmployees = await EmployeeCollection.find().select('fullname email department post employeeCode');

        // 2. Toutes les réponses
        const responses = await SurveyResponseCollection.find({ survey_id: id }).populate('user_id', 'email');

        // Set des emails/IDs ayant répondu
        const responderEmails = new Set(responses.map(r => r.user_id?.email).filter(Boolean));

        // Create a map for quick response lookup by email
        const responseMap = new Map();
        responses.forEach(r => {
            if (r.user_id && r.user_id.email) {
                responseMap.set(r.user_id.email, r.reponses);
            }
        });

        // 3. Séparer
        const respondents = [];
        const nonRespondents = [];

        allEmployees.forEach(emp => {
            if (emp.email && responderEmails.has(emp.email)) {
                // Attach responses to employee object
                const employeeWithResponse = {
                    ...emp.toObject(),
                    surveyResponses: responseMap.get(emp.email) || []
                };
                respondents.push(employeeWithResponse);
            } else {
                nonRespondents.push(emp);
            }
        });

        res.json({
            success: true,
            data: {
                survey,
                respondents,
                nonRespondents,
                responseCount: respondents.length,
                totalEmployees: allEmployees.length
            }
        });

    } catch (error) {
        console.error("Erreur stats sondage:", error);
        res.status(500).json({ success: false, message: "Erreur serveur" });
    }
};

export { getAvailableSurveys, submitSurveyResponse, createSurvey, getAllSurveysForAdmin, getSurveyStats };
