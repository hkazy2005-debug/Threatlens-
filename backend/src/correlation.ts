import { pool } from "./db";

export async function runCorrelation(): Promise<{ newSightings: number; alertsGenerated: number }> {
  const ipMatches = await pool.query(`
    SELECT DISTINCT i.id AS ioc_id, e.id AS event_id, 
      CASE WHEN e.source_ip = i.value THEN 'source_ip' ELSE 'destination_ip' END AS matched_field
    FROM iocs i
    JOIN internal_events e
      ON i.type = 'IP' AND (e.source_ip = i.value OR e.destination_ip = i.value)
    WHERE NOT EXISTS (
      SELECT 1 FROM sightings s WHERE s.ioc_id = i.id AND s.event_id = e.id
    )
  `);

  const domainMatches = await pool.query(`
    SELECT DISTINCT i.id AS ioc_id, e.id AS event_id, 'domain' AS matched_field
    FROM iocs i
    JOIN internal_events e
      ON i.type = 'Domain' AND e.domain = i.value
    WHERE NOT EXISTS (
      SELECT 1 FROM sightings s WHERE s.ioc_id = i.id AND s.event_id = e.id
    )
  `);

  const allMatches = [...ipMatches.rows, ...domainMatches.rows];

  let newSightings = 0;
  let alertsGenerated = 0;
  const iocsAlreadyAlerted = new Set<number>();

  for (const match of allMatches) {
    const sightingResult = await pool.query(
      `INSERT INTO sightings (ioc_id, event_id, matched_field) VALUES ($1, $2, $3) RETURNING id`,
      [match.ioc_id, match.event_id, match.matched_field]
    );
    const sightingId = sightingResult.rows[0].id;
    newSightings++;

    // Generate an alert if this IOC hasn't already gotten one in this run
    if (!iocsAlreadyAlerted.has(match.ioc_id)) {
      const iocResult = await pool.query("SELECT * FROM iocs WHERE id = $1", [match.ioc_id]);
      const ioc = iocResult.rows[0];

      // Only alert for IOCs that don't already have an open alert
      const existingAlert = await pool.query(
        "SELECT id FROM alerts WHERE ioc_id = $1 AND status NOT IN ('Resolved', 'Closed')",
        [ioc.id]
      );

      if (existingAlert.rows.length === 0) {
        await pool.query(
          `INSERT INTO alerts (title, description, severity, priority, ioc_id, sighting_id)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            `Known threat indicator detected: ${ioc.value}`,
            `The IOC "${ioc.value}" (type: ${ioc.type}) was detected in internal security events. This indicator has a severity of ${ioc.severity}.`,
            ioc.severity,
            ioc.severity === "Critical" || ioc.severity === "High" ? "High" : "Medium",
            ioc.id,
            sightingId,
          ]
        );
        alertsGenerated++;
      }
      iocsAlreadyAlerted.add(match.ioc_id);
    }
  }

  return { newSightings, alertsGenerated };
}


 