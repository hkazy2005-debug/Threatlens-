import express from "express";
import cors from "cors";
import { pool } from "./db";

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "ThreatLens backend is running" });
});

app.get("/api/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ connected: true, time: result.rows[0] });
  } catch (err) {
    res.status(500).json({ connected: false, error: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`ThreatLens backend running on http://localhost:${PORT}`);
});
