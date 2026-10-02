# ThreatLens

**Explainable Cyber Threat Intelligence, Risk Scoring, and Threat Correlation Platform**

ThreatLens is a full-stack Cyber Threat Intelligence (CTI) platform built as a
learning and portfolio project. It collects threat indicators, enriches them
with real external intelligence, calculates an explainable risk score,
correlates them against internal security events, and generates actionable
alerts and incidents — the same conceptual pipeline used by real SOC teams.

## Problem Statement

Security teams are flooded with threat intelligence feeds, but raw indicators
alone aren't actionable. ThreatLens demonstrates how to turn fragmented
external threat data into contextual, explainable, and actionable
intelligence by combining it with an organization's own internal security
events.

## Architecture
React (TypeScript, Tailwind)
|
REST / JSON
|
Node.js + Express (TypeScript)
|
+-----+-----+------------------+
| | |
PostgreSQL AbuseIPDB / Synthetic
VirusTotal Internal Events
| | |
+-----+-----+------------------+
|
Enrichment -> TRIS Scoring -> Correlation
|
Alerts -> Incidents -> MITRE ATT&CK -> Reports

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, React Router
- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL (accessed via the `pg` library with parameterized
  queries, not an ORM)
- **Authentication:** JWT, bcrypt password hashing
- **Threat Intelligence:** AbuseIPDB API, VirusTotal API

## Features Implemented

- IOC management: create, read, update, delete, with type-specific validation
  (IP, Domain, URL, MD5, SHA-1, SHA-256, Email, CVE)
- Normalization (consistent casing/formatting) and deduplication
- Real-time enrichment from AbuseIPDB (IPs) and VirusTotal (file hashes)
- TRIS (ThreatLens Risk Intelligence Score): an explainable 0–100 score
  combining source reputation, confidence, recency, and internal sightings,
  with a visible per-factor breakdown
- Synthetic internal security event datasets (firewall, DNS, EDR logs) for
  demonstration purposes, clearly labeled as non-real data
- Correlation engine matching IOCs against internal events
- Automatic alert generation from correlation matches, with a full status
  lifecycle (New → Acknowledged → In Progress → Resolved → Closed)
- Incident creation from alerts, linking IOCs, alerts, and MITRE ATT&CK
  techniques into a single investigation record
- MITRE ATT&CK technique tagging for incidents
- CSV export of incident reports
- JWT-based authentication; all IOC/alert/incident API routes require a
  valid token (enforced server-side, not just hidden in the UI)

## Features Not Yet Implemented

Being transparent about scope, per good practice for a project like this:

- Role-based access control (multiple roles exist conceptually in the
  `users` table, but route-level permission differences by role are not
  yet enforced)
- Executive Dashboard, Threat Hunting search page, and Threat Graph
  visualization
- PDF and STIX report formats (CSV only, currently)
- Audit logging
- Automated test suite

## Database Schema (key tables)

`users`, `iocs`, `internal_events`, `sightings`, `alerts`, `incidents`,
`incident_alerts`, `incident_iocs`, `mitre_techniques`,
`incident_mitre_mappings`

## Running Locally

### Prerequisites
- Node.js
- PostgreSQL
- API keys for AbuseIPDB and VirusTotal (both free tiers)

### Backend
create a .env file with DATABASE_URL, JWT_SECRET,
ABUSEIPDB_API_KEY, VIRUSTOTAL_API_KEY, PORT

npm run dev

Visit `http://localhost:5173/login`.

## Security Notes

- Passwords are hashed with bcrypt; plaintext passwords are never stored.
- API keys and secrets live only in a `.env` file, excluded from version
  control.
- All protected API routes verify a JWT token server-side via middleware.
- Input validation is applied to every IOC type before it reaches the
  database, using parameterized queries throughout to prevent SQL injection.

## What This Project Is Not

ThreatLens is a defensive, educational CTI platform. It is not a SIEM,
sandbox, automatic firewall blocker, or autonomous defense system, and it
does not claim compliance with any formal standard (STIX, TAXII, CVSS,
etc.) beyond conceptual alignment.

## Author

Built as a self-directed learning project by a 3rd-year BTech Cyber Security
student, with step-by-step guidance throughout development.
