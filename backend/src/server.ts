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

// Create a new IOC
app.post("/api/iocs", async (req, res) => {
  try {
    const { value, type, severity, confidence } = req.body;

    if (!value || !type) {
      return res.status(400).json({ error: "value and type are required" });
    }

    const result = await pool.query(
      `INSERT INTO iocs (value, type, severity, confidence)
       VALUES ($1, $2, COALESCE($3, 'Medium'), COALESCE($4, 50))
       RETURNING *`,
      [value, type, severity, confidence]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Get all IOCs
app.get("/api/iocs", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM iocs ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`ThreatLens backend running on http://localhost:${PORT}`);
});

