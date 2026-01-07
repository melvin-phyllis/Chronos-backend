import mongoose from "mongoose"

const connectdb = async (req, res, next) => {
    try {
        if (mongoose.connection.readyState === 1) {
            return next()
        }

        await mongoose.connect(`${process?.env.MONGO_URL}`, {
            dbName: "nexa_dev"
        })
        next()
    } catch (error) {
        console.log("Connect db Error :", error)
    }
}

export default connectdb
