import { model, Schema } from "mongoose";

const EmployeeShema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "Users" },

        name: { type: String, required: true },

        firstname: { type: String, required: true },

        dateOfBirth: { type: Date, required: true },

        employeeCode: { type: String, required: true },

        gender: { type: String, enum: ["Homme", "Femme"], required: true },

        email: { type: String, required: true, unique: true },

        phone: {
            countryCode: { type: String },
            phoneNumber: { type: String, unique: true, required: true }
        },

        address: { type: String },



        emergencyContact: {
            fullname: { type: String },
            phone: {
                countryCode: { type: String },
                phoneNumber: { type: String }
            }
        },

        allowances: { type: String },

        employeeBenefits: { type: [String], default: [] },

        documents: {
            cvAndPortfolio: { type: String },
            proofOfIdentity: { type: String },
            signedContract: { type: String },
            offerLetter: { type: String }
        },

        dateOfHire: { type: Date, required: true },

        post: { type: String, required: true },

        department: { type: String, required: true },

        contractType: { type: String, enum: ["CDI", "CDD", "Stage", "Prestataire", "Freelance"], required: true },

        workingMethod: { type: String, enum: ["Remote", "Hybrid", "Onsite"], required: true },

        payrollInformation: {
            monthlySalary: { type: String },
            bankName: { type: String },
            accountNumber: { type: String },
            taxIdentificationNumber: { type: String }
        },

        date: { type: Date, default: new Date() }
    })

const EmployeeCollection = model.Employee || model("Employee", EmployeeShema)


export default EmployeeCollection


