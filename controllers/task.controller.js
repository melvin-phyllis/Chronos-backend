import taskCollection from "../models/task.model.js";
import EmployeeCollection from "../models/employee.modal.js";

// ADMIN : Créer une tâche pour un employé
export const createTask = async (req, res) => {
    try {
        const { user_id, titre, description, priorite, date_debut, date_echeance } = req.body;
        const adminId = req.user.id;

        if (!user_id || !titre || !description) {
            return res.status(400).json({ success: false, message: "Données incomplètes." });
        }

        const newTask = new taskCollection({
            user_id,
            titre,
            description,
            priorite: priorite || 'moyenne',
            date_debut: date_debut || new Date(),
            date_echeance,
            statut: 'en_cours',
            progression: 0
        });

        await newTask.save();

        if (req.io) {
            req.io.emit('task_update', { type: 'create', data: newTask });
        }

        res.status(201).json({
            success: true,
            message: "Tâche créée avec succès.",
            data: newTask
        });

    } catch (error) {
        console.error("Erreur création tâche:", error);
        res.status(500).json({ success: false, message: "Erreur serveur." });
    }
};

// ADMIN : Récupérer toutes les tâches
export const getAllTasks = async (req, res) => {
    try {
        const tasks = await taskCollection.find()
            .populate('user_id', 'nom firstname email')
            .sort({ createdAt: -1 });

        // Enrichir avec les infos employé
        const enrichedTasks = await Promise.all(tasks.map(async (task) => {
            const taskObj = task.toObject();
            if (task.user_id && task.user_id.email) {
                const employee = await EmployeeCollection.findOne({ email: task.user_id.email })
                    .select('name firstname employeeCode department post');
                if (employee) {
                    taskObj.employeeDetails = {
                        fullname: `${employee.firstname} ${employee.name}`,
                        employeeCode: employee.employeeCode,
                        department: employee.department,
                        post: employee.post
                    };
                }
            }
            return taskObj;
        }));

        res.json({ success: true, data: enrichedTasks });
    } catch (error) {
        console.error("Erreur GetAllTasks:", error);
        res.status(500).json({ success: false, message: "Erreur serveur." });
    }
};

// EMPLOYÉ : Récupérer mes tâches
export const getMyTasks = async (req, res) => {
    try {
        const userId = req.user.id;
        const tasks = await taskCollection.find({ user_id: userId }).sort({ date_echeance: 1 });
        res.json({ success: true, data: tasks });
    } catch (error) {
        console.error("Erreur GetMyTasks:", error);
        res.status(500).json({ success: false, message: "Erreur serveur." });
    }
};

// EMPLOYÉ : Mettre à jour la progression
export const updateProgress = async (req, res) => {
    try {
        const { id } = req.params;
        const { progression } = req.body;
        const userId = req.user.id;

        const task = await taskCollection.findById(id);
        if (!task) return res.status(404).json({ success: false, message: "Tâche non trouvée." });

        // Vérifier que c'est bien la tâche de l'utilisateur
        if (task.user_id.toString() !== userId) {
            return res.status(403).json({ success: false, message: "Non autorisé." });
        }

        // Ne peut pas modifier si déjà validée ou rejetée
        if (['valide', 'rejete'].includes(task.statut)) {
            return res.status(400).json({ success: false, message: "Cette tâche ne peut plus être modifiée." });
        }

        task.progression = Math.min(100, Math.max(0, progression));
        await task.save();

        if (req.io) {
            req.io.emit('task_update', { type: 'progress', data: task });
        }

        res.json({ success: true, message: "Progression mise à jour.", data: task });

    } catch (error) {
        console.error("Erreur UpdateProgress:", error);
        res.status(500).json({ success: false, message: "Erreur serveur." });
    }
};

// EMPLOYÉ : Soumettre la tâche (quand progression = 100%)
export const submitTask = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const task = await taskCollection.findById(id);
        if (!task) return res.status(404).json({ success: false, message: "Tâche non trouvée." });

        if (task.user_id.toString() !== userId) {
            return res.status(403).json({ success: false, message: "Non autorisé." });
        }

        if (task.progression < 100) {
            return res.status(400).json({ success: false, message: "La progression doit être à 100% pour soumettre." });
        }

        task.statut = 'en_attente';
        await task.save();

        if (req.io) {
            req.io.emit('task_update', { type: 'submit', data: task });
        }

        res.json({ success: true, message: "Tâche soumise pour validation.", data: task });

    } catch (error) {
        console.error("Erreur SubmitTask:", error);
        res.status(500).json({ success: false, message: "Erreur serveur." });
    }
};

// ADMIN : Valider ou Rejeter une tâche
export const validateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { statut, commentaire_admin } = req.body; // 'valide' ou 'rejete'
        const adminId = req.user.id;

        if (!['valide', 'rejete'].includes(statut)) {
            return res.status(400).json({ success: false, message: "Statut invalide." });
        }

        const task = await taskCollection.findById(id);
        if (!task) return res.status(404).json({ success: false, message: "Tâche non trouvée." });

        task.statut = statut;
        task.commentaire_admin = commentaire_admin;
        task.date_validation = new Date();
        task.validateur_id = adminId;

        // Si rejetée, remettre en cours pour permettre correction
        if (statut === 'rejete') {
            task.progression = Math.min(task.progression, 80); // Baisse légère pour montrer qu'il y a du travail
        }

        await task.save();

        if (req.io) {
            req.io.emit('task_update', { type: 'validate', data: task });
        }

        res.json({ success: true, message: `Tâche ${statut === 'valide' ? 'validée' : 'rejetée'}.`, data: task });

    } catch (error) {
        console.error("Erreur ValidateTask:", error);
        res.status(500).json({ success: false, message: "Erreur serveur." });
    }
};

// Stats des tâches pour dashboard
export const getTaskStats = async (req, res) => {
    try {
        const stats = await taskCollection.aggregate([
            {
                $group: {
                    _id: '$statut',
                    count: { $sum: 1 }
                }
            }
        ]);

        const formatted = {
            en_cours: 0,
            en_attente: 0,
            valide: 0,
            rejete: 0
        };

        stats.forEach(s => {
            if (formatted.hasOwnProperty(s._id)) {
                formatted[s._id] = s.count;
            }
        });

        res.json({ success: true, data: formatted });
    } catch (error) {
        console.error("Erreur TaskStats:", error);
        res.status(500).json({ success: false, message: "Erreur serveur." });
    }
};
