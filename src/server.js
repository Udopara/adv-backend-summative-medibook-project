import "dotenv/config";
import express from "express";
import patientRouter from "./routes/patient.route.js";
import doctorRouter from "./routes/doctor.route.js";

const PORT = process.env.PORT;

const app = express();

app.use(express.json());

app.use("/patient", patientRouter);
app.use("/doctor", doctorRouter);

app.get("/", (req, res) => {
  res.status(200).json({ message: "Success!!!" });
});

app.listen(PORT, () => {
  console.log("Server listening on PORT:", PORT);
});
