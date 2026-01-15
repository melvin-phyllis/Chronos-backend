import { model, Schema } from "mongoose";

const PresenceSchema = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: "Users",
        required: true,
        index: true
    },
    employeeId: { type: String }, // Compatibilité (optionnel si on migre tout)

    date: {
        type: String, // YYYY-MM-DD
        required: true,
        index: true
    },
    check_in: {
        type: Date,
        required: true
    },
    check_out: {
        type: Date
    },
    duree_travail: {
        type: Number,
        default: 0
    },
    statut: {
        type: String,
        enum: ['present', 'absent', 'retard'],
        default: 'present'
    },
    commentaire: { type: String }

}, { timestamps: true });

// Un employé ne peut avoir qu'une seule fiche de présence par jour
PresenceSchema.index({ user_id: 1, date: 1 }, { unique: true });

const PresenceCollection = model("Presence", PresenceSchema);
export default PresenceCollection;
