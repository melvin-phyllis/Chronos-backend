import { model, Schema } from "mongoose";

const surveySchema = new Schema({
    admin_id: {
        type: Schema.Types.ObjectId,
        ref: "Users",
        required: true
    },
    titre: {
        type: String,
        required: true,
        minLength: 5
    },
    description: { type: String },

    questions: [{
        question: { type: String, required: true },
        type: {
            type: String,
            enum: ['choix_multiple', 'texte_libre', 'echelle', 'oui_non'],
            required: true
        },
        options: [{ type: String }], // Pour choix_multiple
        obligatoire: { type: Boolean, default: true }
    }],

    statut: {
        type: String,
        enum: ['actif', 'termine', 'archive'],
        default: 'actif'
    },
    date_debut: { type: Date, default: Date.now },
    date_fin: { type: Date }

}, { timestamps: true });

const SurveyCollection = model("Survey", surveySchema);
export default SurveyCollection;
