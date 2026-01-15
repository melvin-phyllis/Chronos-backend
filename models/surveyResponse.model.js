import { model, Schema } from "mongoose";

const surveyResponseSchema = new Schema({
    survey_id: {
        type: Schema.Types.ObjectId,
        ref: "Survey",
        required: true
    },
    user_id: {
        type: Schema.Types.ObjectId,
        ref: "Users",
        required: true
    },
    reponses: [{
        question_index: { type: Number, required: true },
        reponse: { type: Schema.Types.Mixed } // String, Number, ou Boolean
    }],
    date_reponse: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const SurveyResponseCollection = model("SurveyResponse", surveyResponseSchema);
export default SurveyResponseCollection;
