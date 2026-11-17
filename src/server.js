import express from "express"

const app = express()

app.get("/", (req, res) => {
    res.status(200).json({message: "Success!!!"})
})

app.listen(3000, () => {
    console.log("Server listening on PORT: 3000")
})