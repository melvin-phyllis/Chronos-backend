import { model, Schema } from "mongoose";

const TaskShema = new Schema({
    employeeCode: { type: String, required: true },
    title: { type: String, required: true },
    status: { type: String, required: true },
    priorite: { type: String, required: true },
    expiryDate: { type: String, required: true },
    notes: { type: String, required: true },
    date: { type: Date, default: new Date() }
})


const taskCollection = model.Tasks || model("Tasks", TaskShema);

export default taskCollection;
