import { model, Schema } from "mongoose";

const leaveSchema = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: "Users",
        required: true,
        index: true
    },
    employeeCode: { type: String }, // Gardé pour compatibilité existante, mais user_id est la ref principale
    type_conge: {
        type: String,
        enum: ['conge_paye', 'conge_maladie', 'conge_sans_solde', 'conge_maternite', 'conge_paternite', 'conge_exceptionnel'],
        required: true
    },
    date_debut: {
        type: Date,
        required: true
    },
    date_fin: {
        type: Date,
        required: true
    },
    nombre_jours: {
        type: Number,
        required: true
        // Doit être calculé par le controller avant sauvegarde
    },
    statut: {
        type: String,
        enum: ['en_attente', 'en_cours', 'valide', 'rejete', 'annule'],
        default: 'en_attente'
    },
    justificatif_texte: {
        type: String,
        maxLength: 500
    },
    justificatif_document: {
        type: String // URL
    },
    date_demande: {
        type: Date,
        default: Date.now
    },
    date_traitement: { type: Date },
    traite_par: { type: Schema.Types.ObjectId, ref: 'Users' },
    commentaire_admin: { type: String },

    annule_par: {
        type: String,
        enum: ['employe', 'admin']
    },
    date_annulation: { type: Date },
    raison_annulation: { type: String }

}, { timestamps: true });

const leaverequestCollection = model("LeaveRequest", leaveSchema);
export default leaverequestCollection;
