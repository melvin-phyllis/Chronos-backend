import { model, Schema } from "mongoose";

const UserShema = new Schema({

    email: { type: String, unique: true, required: true },

    nom: { type: String },

    password: { type: String, required: true },

    role: { type: String, enum: ['employee', 'admin'], default: 'employee' },

    isverified: { type: Boolean, default: false },

})


const UserCollection = model.Users || model("Users", UserShema);
export default UserCollection;
