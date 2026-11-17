import "dotenv/config";
import express from "express"

const PORT = process.env.PORT;

const app = express()

app.get("/", (req, res) => {
    res.status(200).json({message: "Success!!!"})
})

app.listen(PORT, () => {
  console.log("Server listening on PORT:", PORT);
});