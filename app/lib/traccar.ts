const TRACCAR_URL = process.env.TRACCAR_URL || "http://localhost:8086";
const TRACCAR_USER = process.env.TRACCAR_API_USER || "";
const TRACCAR_PASS = process.env.TRACCAR_API_PASSWORD || "";

const authHeader =
  "Basic " + Buffer.from(`${TRACCAR_USER}:${TRACCAR_PASS}`).toString("base64");

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${TRACCAR_URL}/api${path}`, {
    headers: { Authorization: authHeader },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Traccar API error: ${res.status} ${path}`);
  return res.json();
}

export type TraccarDevice = {
  id: number;
  uniqueId: string;
  name: string;
  status: string;
  lastUpdate: string;
  positionId: number;
};

export type TraccarPosition = {
  id: number;
  deviceId: number;
  fixTime: string;
  latitude: number;
  longitude: number;
  speed: number;
  course: number;
  altitude: number;
};

export type TraccarTrip = {
  deviceId: number;
  deviceName: string;
  distance: number;
  duration: number;
  averageSpeed: number;
  maxSpeed: number;
  startTime: string;
  endTime: string;
  startLat: number;
  startLon: number;
  endLat: number;
  endLon: number;
};

export type TraccarGeofence = {
  id: number;
  name: string;
  area: string;
};

export const traccar = {
  getDevices: (): Promise<TraccarDevice[]> => get("/devices"),

  getPositions: (): Promise<TraccarPosition[]> => get("/positions"),

  getDevicePositions: (
    deviceId: number,
    from: string,
    to: string
  ): Promise<TraccarPosition[]> =>
    get(`/reports/route?deviceId=${deviceId}&from=${from}&to=${to}`),

  getTrips: (
    deviceId: number,
    from: string,
    to: string
  ): Promise<TraccarTrip[]> =>
    get(`/reports/trips?deviceId=${deviceId}&from=${from}&to=${to}`),

  getGeofences: (): Promise<TraccarGeofence[]> => get("/geofences"),
};
