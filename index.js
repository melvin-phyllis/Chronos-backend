import cookieParser from 'cookie-parser'
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import middleware from './controllers/middleware.js'
import connectdb from './db/connectdb.js'
import routes from './routes/routes.js'
dotenv.config()



const app = express()
console.log("ok")
app.use(cors({
    origin: `${process.env.ORIGIN_URL}`,
    optionsSuccessStatus: 200,

    credentials: true, // ⬆️ CRITIQUE : permet l'envoi de cookies
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json())
app.use(cookieParser(`${process.env.JWT_SECRET}`))

app.use(middleware)
    .use(connectdb)
    .use((req, res, next) => {
        console.log(`${req.ip} ${req.method} ${req.url} `)
        console.log(process.env.ORIGIN_URL)
        next()
    })


app.use("/api", routes)

app.listen(3500, () => {

    console.log("serveur open sur port 3500")
})
