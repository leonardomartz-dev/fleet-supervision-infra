import type { TraccarPosition } from "./traccar";

export type GeofenceTarget = {
  propertyId: number;
  lat: number;
  lon: number;
  radiusMeters: number;
};

type PositionInGeofence = TraccarPosition & { insidePropertyId: number | null };

function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function matchPositionsToGeofences(
  positions: TraccarPosition[],
  geofences: GeofenceTarget[]
): PositionInGeofence[] {
  return positions.map((pos) => {
    const match = geofences.find(
      (g) =>
        haversineMeters(pos.latitude, pos.longitude, g.lat, g.lon) <=
        g.radiusMeters
    );
    return { ...pos, insidePropertyId: match?.propertyId ?? null };
  });
}

export type GeofenceMatch = {
  propertyId: number;
  timeOnSiteMinutes: number;
};

export function computeTimeOnSite(
  annotated: PositionInGeofence[]
): GeofenceMatch[] {
  const timeByProperty: Record<number, number> = {};

  for (let i = 0; i < annotated.length - 1; i++) {
    const curr = annotated[i];
    const next = annotated[i + 1];
    if (curr.insidePropertyId === null) continue;

    const segmentMinutes =
      (new Date(next.fixTime).getTime() - new Date(curr.fixTime).getTime()) /
      60000;

    timeByProperty[curr.insidePropertyId] =
      (timeByProperty[curr.insidePropertyId] ?? 0) + segmentMinutes;
  }

  return Object.entries(timeByProperty).map(([id, minutes]) => ({
    propertyId: Number(id),
    timeOnSiteMinutes: Math.round(minutes),
  }));
}

const CONFIDENCE_THRESHOLD = Number(
  process.env.GEOFENCE_CONFIDENCE_THRESHOLD ?? 80
);

export function scoreMatch(timeOnSiteMinutes: number): number {
  if (timeOnSiteMinutes >= 30) return 100;
  if (timeOnSiteMinutes >= 10) return 85;
  if (timeOnSiteMinutes >= 5) return 70;
  return 0;
}

export function isAutoAllocatable(score: number): boolean {
  return score >= CONFIDENCE_THRESHOLD;
}
