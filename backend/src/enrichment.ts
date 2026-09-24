import axios from "axios";

export interface EnrichmentResult {
  source: string;
  abuseConfidenceScore?: number;
  countryCode?: string;
  isp?: string;
  domain?: string;
  totalReports?: number;
  lastReportedAt?: string;
  error?: string;
}

export async function enrichIP(ip: string): Promise<EnrichmentResult> {
  const apiKey = process.env.ABUSEIPDB_API_KEY;

  if (!apiKey) {
    return { source: "AbuseIPDB", error: "API key not configured" };
  }

  try {
    const response = await axios.get("https://api.abuseipdb.com/api/v2/check", {
      params: { ipAddress: ip, maxAgeInDays: 90 },
      headers: { Key: apiKey, Accept: "application/json" },
    });

    const data = response.data.data;

    return {
      source: "AbuseIPDB",
      abuseConfidenceScore: data.abuseConfidenceScore,
      countryCode: data.countryCode,
      isp: data.isp,
      domain: data.domain,
      totalReports: data.totalReports,
      lastReportedAt: data.lastReportedAt,
    };
  } catch (err) {
    return { source: "AbuseIPDB", error: "Failed to fetch enrichment data" };
  }
}


export async function enrichHash(hash: string): Promise<EnrichmentResult> {
  const apiKey = process.env.VIRUSTOTAL_API_KEY;

  if (!apiKey) {
    return { source: "VirusTotal", error: "API key not configured" };
  }

  try {
    const response = await axios.get(
      `https://www.virustotal.com/api/v3/files/${hash}`,
      { headers: { "x-apikey": apiKey } }
    );

    const stats = response.data.data.attributes.last_analysis_stats;
    const malicious = stats.malicious || 0;
    const total = malicious + (stats.harmless || 0) + (stats.undetected || 0) + (stats.suspicious || 0);

    return {
      source: "VirusTotal",
      abuseConfidenceScore: total > 0 ? Math.round((malicious / total) * 100) : 0,
      totalReports: malicious,
    };
  } catch (err) {
    return { source: "VirusTotal", error: "Failed to fetch enrichment data" };
  }
}
