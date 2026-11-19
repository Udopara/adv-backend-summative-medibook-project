import "dotenv/config";
import express from "express";
import patientRouter from "./routes/patient.route.js";
import doctorRouter from "./routes/doctor.route.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const PORT = process.env.PORT;

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({ message: "Success!!!" });
});

app.use("/patient", patientRouter);
app.use("/doctor", doctorRouter);

app.use(notFoundHandler);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log("Server listening on PORT:", PORT);
});
