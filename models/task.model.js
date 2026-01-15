import { model, Schema } from "mongoose";

const taskSchema = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: "Users",
        required: true
    },
    employeeCode: { type: String }, // Compatibilité

    titre: {
        type: String,
        required: true,
        minLength: 5,
        maxLength: 100
    },
    description: {
        type: String,
        required: true,
        minLength: 10,
        maxLength: 1000
    },
    progression: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    statut: {
        type: String,
        enum: ['en_attente', 'valide', 'rejete', 'en_cours', 'termine'],
        default: 'en_attente'
    },
    priorite: {
        type: String,
        enum: ['basse', 'moyenne', 'haute'],
        default: 'moyenne'
    },
    date_debut: { type: Date },
    date_echeance: { type: Date },
    date_validation: { type: Date },
    validateur_id: { type: Schema.Types.ObjectId, ref: 'Users' },
    commentaire_admin: { type: String },

    // Champs hérités
    expiryDate: { type: Date }, // Gardé pour compatibilité front existant (si utilisé)
    notes: { type: String }    // Gardé pour compatibilité

}, { timestamps: true });

const taskCollection = model("Task", taskSchema);
export default taskCollection;
