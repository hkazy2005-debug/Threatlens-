import { pool } from "./db";

export async function logAction(params: {
  userEmail?: string;
  action: string;
  resource?: string;
  result?: "success" | "failure";
  metadata?: object;
}): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO audit_logs (user_email, action, resource, result, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        params.userEmail || null,
        params.action,
        params.resource || null,
        params.result || "success",
        params.metadata ? JSON.stringify(params.metadata) : null,
      ]
    );
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
}
