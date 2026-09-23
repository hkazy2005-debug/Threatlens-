import validator from "validator";

export type IOCType = "IP" | "Domain" | "URL" | "MD5" | "SHA-1" | "SHA-256" | "Email" | "CVE";

export function validateIOC(value: string, type: string): { valid: boolean; error?: string } {
  if (!value || typeof value !== "string" || value.trim().length === 0) {
    return { valid: false, error: "Value cannot be empty" };
  }

  const trimmed = value.trim();

  switch (type) {
    case "IP":
      if (!validator.isIP(trimmed)) {
        return { valid: false, error: "Invalid IP address format" };
      }
      break;

    case "Domain":
      if (!validator.isFQDN(trimmed)) {
        return { valid: false, error: "Invalid domain format" };
      }
      break;

    case "URL":
      if (!validator.isURL(trimmed)) {
        return { valid: false, error: "Invalid URL format" };
      }
      break;

    case "MD5":
      if (!/^[a-fA-F0-9]{32}$/.test(trimmed)) {
        return { valid: false, error: "Invalid MD5 hash (must be 32 hex characters)" };
      }
      break;

    case "SHA-1":
      if (!/^[a-fA-F0-9]{40}$/.test(trimmed)) {
        return { valid: false, error: "Invalid SHA-1 hash (must be 40 hex characters)" };
      }
      break;

    case "SHA-256":
      if (!/^[a-fA-F0-9]{64}$/.test(trimmed)) {
        return { valid: false, error: "Invalid SHA-256 hash (must be 64 hex characters)" };
      }
      break;

    case "Email":
      if (!validator.isEmail(trimmed)) {
        return { valid: false, error: "Invalid email format" };
      }
      break;

    case "CVE":
      if (!/^CVE-\d{4}-\d{4,}$/i.test(trimmed)) {
        return { valid: false, error: "Invalid CVE format (expected CVE-YYYY-NNNN)" };
      }
      break;

    default:
      return { valid: false, error: "Unknown IOC type" };
  }

  return { valid: true };
}

export function normalizeIOC(value: string, type: string): string {
  const trimmed = value.trim();

  switch (type) {
    case "Domain":
    case "Email":
    case "URL":
      return trimmed.toLowerCase();

    case "MD5":
    case "SHA-1":
    case "SHA-256":
      return trimmed.toLowerCase();

    case "IP":
      return trimmed;

    case "CVE":
      return trimmed.toUpperCase();

    default:
      return trimmed;
  }
}
        