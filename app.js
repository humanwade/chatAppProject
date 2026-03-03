const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const mongoUri = process.env.MONGO_URI || process.env.DB;
if (!mongoUri) {
  throw new Error(
    "Missing MongoDB URI. Set MONGO_URI (recommended) or DB in your .env file."
  );
}

mongoose
  .connect(mongoUri)
  .then(() => console.log("connected to database"))
  .catch((err) => console.error("Mongo connect error:", err));

const viteDist = path.join(__dirname, "chatapp-client", "dist");
const craBuild = path.join(__dirname, "chatapp-client", "build");

const staticRoot = require("fs").existsSync(viteDist) ? viteDist : craBuild;

app.use(express.static(staticRoot));

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(staticRoot, "index.html"));
});

module.exports = app;
