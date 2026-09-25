export interface TRISBreakdown {
  sourceReputation: number;
  confidenceScore: number;
  recencyScore: number;
  internalSightings: number;
  total: number;
}

export function calculateTRIS(params: {
  abuseConfidenceScore?: number | undefined;
  confidence: number;
  lastSeen: Date;
  internalSightingsCount?: number;
}): TRISBreakdown {
  const { abuseConfidenceScore, confidence, lastSeen, internalSightingsCount = 0 } = params;

  // Source reputation: based on external enrichment (0-25 points)
  // If no enrichment data available, default to a modest baseline
  const sourceReputation = abuseConfidenceScore !== undefined
    ? Math.round((abuseConfidenceScore / 100) * 25)
    : 10;

  // Confidence: based on the IOC's own stored confidence value (0-25 points)
  const confidenceScore = Math.round((confidence / 100) * 25);

  // Recency: how recently was this IOC last seen? (0-25 points)
  // Full points if seen today, decaying over 30 days
  const daysSinceLastSeen = Math.floor(
    (Date.now() - new Date(lastSeen).getTime()) / (1000 * 60 * 60 * 24)
  );
  const recencyScore = Math.max(0, Math.round(25 - (daysSinceLastSeen / 30) * 25));

  // Internal sightings: how many times seen in our own environment (0-25 points)
  // 5+ sightings = full points, scales linearly below that
  const internalSightings = Math.min(25, internalSightingsCount * 5);

  const total = sourceReputation + confidenceScore + recencyScore + internalSightings;

  return {
    sourceReputation,
    confidenceScore,
    recencyScore,
    internalSightings,
    total: Math.min(100, total),
  };
}

