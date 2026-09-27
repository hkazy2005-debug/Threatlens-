import { pool } from "./db";

export async function runCorrelation(): Promise<{ newSightings: number; alertsGenerated: number }> {
  // Find IP-type IOCs that match internal events' source_ip or destination_ip
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

  // Find Domain-type IOCs that match internal events' domain field
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
  for (const match of allMatches) {
    await pool.query(
      `INSERT INTO sightings (ioc_id, event_id, matched_field) VALUES ($1, $2, $3)`,
      [match.ioc_id, match.event_id, match.matched_field]
    );
    newSightings++;
  }

  return { newSightings, alertsGenerated: 0 };
}