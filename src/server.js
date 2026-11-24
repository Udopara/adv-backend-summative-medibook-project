import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import express from "express";
import patientRouter from "./routes/patient.route.js";
import doctorRouter from "./routes/doctor.route.js";
import appointmentRouter from "./routes/appointment.route.js";
import reportRouter from "./routes/report.route.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";


const PORT = process.env.PORT;

const app = express();

app.set("views", path.join(import.meta.dirname, "views"));
app.set("view engine", "hbs");

app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({ message: "Success!!!" });
});

const locales = {
  en: JSON.parse(fs.readFileSync(path.resolve("locales/en.json"), "utf8")),
  fr: JSON.parse(fs.readFileSync(path.resolve("locales/fr.json"), "utf8")),
  ig: JSON.parse(fs.readFileSync(path.resolve("locales/ig.json"), "utf8")),
};

const dateLocales = {
  fr: "fr-FR",
  ig: "ig-NG",
  en: "en-US",
};

app.get("/feedback", (req, res) => {
  const requestedLang =
    typeof req.query.lang === "string" ? req.query.lang.toLowerCase() : "en";
  const activeLocale = locales[requestedLang] ? requestedLang : "en";
  const localeData = locales[activeLocale];

  const formattedDate = new Intl.DateTimeFormat(
    dateLocales[activeLocale] || "en-US",
    { dateStyle: "full" },
  ).format(new Date());

  res.render("feedback", {
    ...localeData,
    activeLocale,
    formattedDate,
    isEn: activeLocale === "en",
    isFr: activeLocale === "fr",
    isIg: activeLocale === "ig",
  });
});

app.post("/feedback", express.urlencoded({ extended: true }), (req, res) => {
  res.status(200).json({
    message: "Thank you for your feedback!",
    submitted: req.body,
  });
});

app.use("/patient", patientRouter);
app.use("/doctor", doctorRouter);
app.use("/appointment", appointmentRouter);
app.use("/report", reportRouter);

app.use(notFoundHandler);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log("Server listening on PORT:", PORT);
});
