import { model, Schema } from "mongoose";

const leaverequestSchema = new Schema({

    type: { type: String, required: true },

    employeeCode: { type: String, required: true },

    startDate: { type: Date, required: true },

    endDate: { type: Date, required: true },

    reason: { type: String, required: true },
    
    intervaltime: { type: Number, required: true },

    requestDate: { type: Date, default: new Date() },

    status: { type: String, enum: ["pending", "approved", "rejected","cancel"], default: 'pending' }

})

const leaverequestCollection = model.Leaverequest || model("Leaverequest", leaverequestSchema)
export default leaverequestCollection
