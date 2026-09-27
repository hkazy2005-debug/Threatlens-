import { pool } from "./db";
import { validateIOC, normalizeIOC } from "./validation";

const sampleIOCs = [
  { value: "185.220.101.45", type: "IP", severity: "Critical", confidence: 92 },
  { value: "91.219.237.244", type: "IP", severity: "High", confidence: 78 },
  { value: "malicious-c2-panel.net", type: "Domain", severity: "Critical", confidence: 88 },
  { value: "phishing-bank-login.com", type: "Domain", severity: "High", confidence: 81 },
  { value: "185.220.101.45", type: "IP", severity: "Critical", confidence: 92 }, // dup test
  { value: "https://evil-payload-drop.xyz/malware.exe", type: "URL", severity: "Critical", confidence: 95 },
  { value: "104.244.72.115", type: "IP", severity: "Medium", confidence: 60 },
  { value: "attacker@disposable-mail.com", type: "Email", severity: "Medium", confidence: 55 },
  { value: "CVE-2024-3400", type: "CVE", severity: "Critical", confidence: 99 },
  { value: "CVE-2023-44487", type: "CVE", severity: "High", confidence: 90 },
  { value: "5d41402abc4b2a76b9719d911017c592", type: "MD5", severity: "High", confidence: 70 },
  { value: "suspicious-crypto-miner.io", type: "Domain", severity: "Medium", confidence: 65 },
];

async function seed() {
  console.log("Seeding IOCs...");
  let added = 0;

  for (const item of sampleIOCs) {
    const validation = validateIOC(item.value, item.type);
    if (!validation.valid) {
      console.log(`Skipped invalid: ${item.value} (${validation.error})`);
      continue;
    }

    const normalizedValue = normalizeIOC(item.value, item.type);

    const existing = await pool.query(
      "SELECT id FROM iocs WHERE value = $1 AND type = $2",
      [normalizedValue, item.type]
    );

    if (existing.rows.length > 0) {
      console.log(`Already exists, skipped: ${item.value}`);
      continue;
    }

    await pool.query(
      `INSERT INTO iocs (value, type, severity, confidence) VALUES ($1, $2, $3, $4)`,
      [normalizedValue, item.type, item.severity, item.confidence]
    );
    added++;
    console.log(`Added: ${item.value}`);
  }

  console.log(`\nDone. Added ${added} new IOCs.`);
  process.exit(0);
}

seed();


