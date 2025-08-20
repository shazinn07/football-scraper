import express from "express";
import { getCachedFixtures } from "./scraper.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Football schedules API is running 🚀");
});

app.get("/api/schedules", (req, res) => {
  const fixtures = getCachedFixtures();
  res.json(fixtures);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
