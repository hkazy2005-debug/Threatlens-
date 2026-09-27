import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { pool } from "./db";

const DATA_DIR = path.join(__dirname, "..", "..", "data");

export async function ingestFirewallEvents(): Promise<number> {
  const filePath = path.join(DATA_DIR, "firewall_events.csv");
  const content = fs.readFileSync(filePath, "utf-8");
  const records = parse(content, { columns: true, skip_empty_lines: true })as any[];

  let count = 0;
  for (const row of records) {
    await pool.query(
      `INSERT INTO internal_events (event_source, timestamp, source_ip, destination_ip, details)
       VALUES ('firewall', $1, $2, $3, $4)`,
      [row.timestamp, row.source_ip, row.destination_ip, JSON.stringify({ port: row.port, protocol: row.protocol, action: row.action })]
    );
    count++;
  }
  return count;
}

export async function ingestDNSEvents(): Promise<number> {
  const filePath = path.join(DATA_DIR, "dns_events.csv");
  const content = fs.readFileSync(filePath, "utf-8");
  const records = parse(content, { columns: true, skip_empty_lines: true })as any[];

  let count = 0;
  for (const row of records) {
    await pool.query(
      `INSERT INTO internal_events (event_source, timestamp, source_ip, domain, details)
       VALUES ('dns', $1, $2, $3, $4)`,
      [row.timestamp, row.client_ip, row.domain, JSON.stringify({ query_type: row.query_type })]
    );
    count++;
  }
  return count;
}

export async function ingestEDREvents(): Promise<number> {
  const filePath = path.join(DATA_DIR, "edr_events.csv");
  const content = fs.readFileSync(filePath, "utf-8");
  const records = parse(content, { columns: true, skip_empty_lines: true }) as any[];

  let count = 0;
  for (const row of records) {
    const [ip] = (row.network_connection || "").split(":");
    await pool.query(
      `INSERT INTO internal_events (event_source, timestamp, host, process, destination_ip, details)
       VALUES ('edr', $1, $2, $3, $4, $5)`,
      [row.timestamp, row.host, row.process, ip, JSON.stringify({ event_type: row.event_type, network_connection: row.network_connection })]
    );
    count++;
  }
  return count;
}
