import { model, Schema } from "mongoose";

const congeBalanceSchema = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: "Users",
        required: true,
        unique: true
    },
    annee: {
        type: Number,
        required: true,
        index: true
    },
    conges_payes_total: {
        type: Number,
        default: 30
    },
    conges_payes_pris: {
        type: Number,
        default: 0
    },
    // conges_payes_restants est calculé dynamiquement ou mis à jour via hook
    conges_maladie_pris: {
        type: Number,
        default: 0
    },
    autres_conges_pris: {
        type: Number,
        default: 0
    },
    historique: [{
        type: { type: String },
        nombre_jours: { type: Number },
        date: { type: Date },
        leave_id: { type: Schema.Types.ObjectId, ref: 'LeaveRequest' }
    }]
}, { timestamps: true });

// Virtual pour le reste à prendre
congeBalanceSchema.virtual('conges_payes_restants').get(function () {
    return this.conges_payes_total - this.conges_payes_pris;
});

const CongeBalanceCollection = model("CongeBalance", congeBalanceSchema);
export default CongeBalanceCollection;
