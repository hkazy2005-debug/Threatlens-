import express from "express";
import cors from "cors";
import { pool } from "./db";
import { validateIOC, normalizeIOC } from "./validation";
import authRoutes from "./auth";

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);

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

    const validation = validateIOC(value, type);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const normalizedValue = normalizeIOC(value, type);

    // Check if this IOC already exists (same value + type)
    const existing = await pool.query(
      "SELECT * FROM iocs WHERE value = $1 AND type = $2",
      [normalizedValue, type]
    );

    if (existing.rows.length > 0) {
      // Already exists — just update last_seen instead of creating a duplicate
      const updated = await pool.query(
        `UPDATE iocs SET last_seen = NOW(), updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [existing.rows[0].id]
      );
      return res.status(200).json({
        message: "IOC already existed, updated last_seen",
        ioc: updated.rows[0],
      });
    }

    const result = await pool.query(
      `INSERT INTO iocs (value, type, severity, confidence)
       VALUES ($1, $2, COALESCE($3, 'Medium'), COALESCE($4, 50))
       RETURNING *`,
      [normalizedValue, type, severity, confidence]
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
// Get a single IOC by ID
app.get("/api/iocs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM iocs WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "IOC not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Update an IOC
app.put("/api/iocs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { value, type, severity, confidence, status } = req.body;

    const result = await pool.query(
      `UPDATE iocs
       SET value = COALESCE($1, value),
           type = COALESCE($2, type),
           severity = COALESCE($3, severity),
           confidence = COALESCE($4, confidence),
           status = COALESCE($5, status),
           updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [value, type, severity, confidence, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "IOC not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Delete an IOC
app.delete("/api/iocs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM iocs WHERE id = $1 RETURNING *", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "IOC not found" });
    }

    res.json({ message: "IOC deleted", deleted: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});
app.listen(PORT, () => {
  console.log(`ThreatLens backend running on http://localhost:${PORT}`);
});

