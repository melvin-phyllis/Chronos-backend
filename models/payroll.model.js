import { model, Schema } from "mongoose";

const payrollSchema = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: "Users",
        required: true
    },
    mois: {
        type: Number,
        required: true,
        min: 1,
        max: 12
    },
    annee: {
        type: Number,
        required: true
    },
    montant_brut: {
        type: Number,
        required: true
    },
    montant: {
        type: Number,
        required: true
    },
    statut: {
        type: String,
        enum: ['en_attente', 'paye'],
        default: 'en_attente'
    },
    date_paiement: { type: Date },
    pdf_url: { type: String },

    details: {
        salaire_base: { type: Number },
        primes: { type: Number },
        deductions: { type: Number },
        heures_supplementaires: { type: Number }
    }
}, { timestamps: true });

const PayrollCollection = model("Payroll", payrollSchema);
export default PayrollCollection;
