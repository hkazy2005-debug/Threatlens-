import express from "express";
import cors from "cors";
import { pool } from "./db";
import { validateIOC, normalizeIOC } from "./validation";
import authRoutes from "./auth";
import { requireAuth } from "./authMiddleware";
import { enrichIP, enrichHash } from "./enrichment";
import { calculateTRIS } from "./scoring";
import { ingestFirewallEvents, ingestDNSEvents, ingestEDREvents } from "./ingestion";
import { runCorrelation } from "./correlation";

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
app.post("/api/iocs", requireAuth, async (req, res) => {
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

    const existing = await pool.query(
      "SELECT * FROM iocs WHERE value = $1 AND type = $2",
      [normalizedValue, type]
    );

    if (existing.rows.length > 0) {
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
app.get("/api/iocs", requireAuth, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM iocs ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Get a single IOC by ID
app.get("/api/iocs/:id", requireAuth, async (req, res) => {
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

// Enrich an IOC with external threat intelligence
app.post("/api/iocs/:id/enrich", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const iocResult = await pool.query("SELECT * FROM iocs WHERE id = $1", [id]);
    if (iocResult.rows.length === 0) {
      return res.status(404).json({ error: "IOC not found" });
    }

    const ioc = iocResult.rows[0];
    let enrichment;

    if (ioc.type === "IP") {
      enrichment = await enrichIP(ioc.value);
    } else if (ioc.type === "MD5" || ioc.type === "SHA-1" || ioc.type === "SHA-256") {
      enrichment = await enrichHash(ioc.value);
    } else {
      return res.status(400).json({ error: `Enrichment not yet supported for type: ${ioc.type}` });
    }

    res.json({ ioc, enrichment });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Calculate TRIS for an IOC
app.post("/api/iocs/:id/tris", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const iocResult = await pool.query("SELECT * FROM iocs WHERE id = $1", [id]);
    if (iocResult.rows.length === 0) {
      return res.status(404).json({ error: "IOC not found" });
    }

    const ioc = iocResult.rows[0];
    let abuseConfidenceScore: number | undefined;

    if (ioc.type === "IP") {
      const enrichment = await enrichIP(ioc.value);
      abuseConfidenceScore = enrichment.abuseConfidenceScore;
    } else if (ioc.type === "MD5" || ioc.type === "SHA-1" || ioc.type === "SHA-256") {
      const enrichment = await enrichHash(ioc.value);
      abuseConfidenceScore = enrichment.abuseConfidenceScore;
    }

    const tris = calculateTRIS({
      abuseConfidenceScore,
      confidence: ioc.confidence,
      lastSeen: ioc.last_seen,
      internalSightingsCount: 0,
    });

    res.json({ ioc, tris });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Run correlation between IOCs and internal events
app.post("/api/correlation/run", requireAuth, async (req, res) => {
  try {
    const result = await runCorrelation();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Get sightings for a specific IOC
app.get("/api/iocs/:id/sightings", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT s.*, e.event_source, e.timestamp, e.source_ip, e.destination_ip, e.domain, e.host
       FROM sightings s
       JOIN internal_events e ON s.event_id = e.id
       WHERE s.ioc_id = $1
       ORDER BY e.timestamp DESC`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Update an IOC
app.put("/api/iocs/:id", requireAuth, async (req, res) => {
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
app.delete("/api/iocs/:id", requireAuth, async (req, res) => {
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

// Get all alerts
app.get("/api/alerts", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, i.value AS ioc_value, i.type AS ioc_type
      FROM alerts a
      JOIN iocs i ON a.ioc_id = i.id
      ORDER BY a.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Update alert status
app.put("/api/alerts/:id/status", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["New", "Acknowledged", "In Progress", "Resolved", "Closed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const result = await pool.query(
      `UPDATE alerts SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Alert not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Create an incident from an alert
app.post("/api/incidents", requireAuth, async (req, res) => {
  try {
    const { title, description, alertId } = req.body;

    if (!title || !alertId) {
      return res.status(400).json({ error: "title and alertId are required" });
    }

    const alertResult = await pool.query("SELECT * FROM alerts WHERE id = $1", [alertId]);
    if (alertResult.rows.length === 0) {
      return res.status(404).json({ error: "Alert not found" });
    }
    const alert = alertResult.rows[0];

    const countResult = await pool.query("SELECT COUNT(*) FROM incidents");
    const nextNumber = parseInt(countResult.rows[0].count) + 1;
    const incidentNumber = `INC-${String(nextNumber).padStart(3, "0")}`;

    const incidentResult = await pool.query(
      `INSERT INTO incidents (incident_number, title, description, severity)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [incidentNumber, title, description || null, alert.severity]
    );
    const incident = incidentResult.rows[0];

    await pool.query(
      `INSERT INTO incident_alerts (incident_id, alert_id) VALUES ($1, $2)`,
      [incident.id, alertId]
    );
    await pool.query(
      `INSERT INTO incident_iocs (incident_id, ioc_id) VALUES ($1, $2)`,
      [incident.id, alert.ioc_id]
    );

    res.status(201).json(incident);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Get all incidents
app.get("/api/incidents", requireAuth, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM incidents ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Get one incident with full details (alerts + IOCs)
app.get("/api/incidents/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const incidentResult = await pool.query("SELECT * FROM incidents WHERE id = $1", [id]);
    if (incidentResult.rows.length === 0) {
      return res.status(404).json({ error: "Incident not found" });
    }

    const alertsResult = await pool.query(
      `SELECT a.* FROM alerts a
       JOIN incident_alerts ia ON a.id = ia.alert_id
       WHERE ia.incident_id = $1`,
      [id]
    );

    const iocsResult = await pool.query(
      `SELECT i.* FROM iocs i
       JOIN incident_iocs ii ON i.id = ii.ioc_id
       WHERE ii.incident_id = $1`,
      [id]
    );

        const mitreResult = await pool.query(
      `SELECT m.* FROM mitre_techniques m
       JOIN incident_mitre_mappings imm ON m.id = imm.technique_id
       WHERE imm.incident_id = $1`,
      [id]
    );

    res.json({
      incident: incidentResult.rows[0],
      alerts: alertsResult.rows,
      iocs: iocsResult.rows,
      mitreTechniques: mitreResult.rows,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Get all MITRE techniques (for a dropdown/selector)
app.get("/api/mitre/techniques", requireAuth, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM mitre_techniques ORDER BY technique_id");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Map a technique to an incident
app.post("/api/incidents/:id/mitre", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { techniqueId } = req.body;

    if (!techniqueId) {
      return res.status(400).json({ error: "techniqueId is required" });
    }

    const result = await pool.query(
      `INSERT INTO incident_mitre_mappings (incident_id, technique_id) VALUES ($1, $2) RETURNING *`,
      [id, techniqueId]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Export an incident as CSV
app.get("/api/incidents/:id/export", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const incidentResult = await pool.query("SELECT * FROM incidents WHERE id = $1", [id]);
    if (incidentResult.rows.length === 0) {
      return res.status(404).json({ error: "Incident not found" });
    }
    const incident = incidentResult.rows[0];

    const iocsResult = await pool.query(
      `SELECT i.* FROM iocs i
       JOIN incident_iocs ii ON i.id = ii.ioc_id
       WHERE ii.incident_id = $1`,
      [id]
    );

    const mitreResult = await pool.query(
      `SELECT m.* FROM mitre_techniques m
       JOIN incident_mitre_mappings imm ON m.id = imm.technique_id
       WHERE imm.incident_id = $1`,
      [id]
    );

    const lines = [
      "ThreatLens Incident Report",
      "",
      `Incident Number,${incident.incident_number}`,
      `Title,${incident.title}`,
      `Description,"${(incident.description || "").replace(/"/g, '""')}"`,
      `Severity,${incident.severity}`,
      `Status,${incident.status}`,
      `Created,${incident.created_at}`,
      "",
      "Linked IOCs",
      "Value,Type,Severity,Confidence",
      ...iocsResult.rows.map((i) => `${i.value},${i.type},${i.severity},${i.confidence}`),
      "",
      "MITRE ATT&CK Techniques",
      "Technique ID,Name,Tactic",
      ...mitreResult.rows.map((m) => `${m.technique_id},${m.name},${m.tactic}`),
    ];

    const csv = lines.join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${incident.incident_number}.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});




    
// Import synthetic internal security events
app.post("/api/events/import", requireAuth, async (req, res) => {
  try {
    const firewallCount = await ingestFirewallEvents();
    const dnsCount = await ingestDNSEvents();
    const edrCount = await ingestEDREvents();

    res.json({
      message: "Import complete",
      imported: { firewall: firewallCount, dns: dnsCount, edr: edrCount },
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`ThreatLens backend running on http://localhost:${PORT}`);
});



