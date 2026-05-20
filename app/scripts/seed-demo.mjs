import { PrismaClient, Category, ExceptionReason, TripStatus } from "@prisma/client";

const prisma = new PrismaClient();

const TRACCAR_URL = process.env.TRACCAR_URL || "http://localhost:8086";
const OSMAND_URL = process.env.TRACCAR_OSMAND_URL || "http://localhost:5055";
const TRACCAR_USER = process.env.TRACCAR_API_USER || "";
const TRACCAR_PASS = process.env.TRACCAR_API_PASSWORD || "";
const DEMO_UNIQUE_ID = "FLEET-TEST-001";

const authHeader = `Basic ${Buffer.from(`${TRACCAR_USER}:${TRACCAR_PASS}`).toString("base64")}`;

const properties = [
  {
    appfolioId: "DEMO-001",
    name: "TEST-PROPERTY-01 Kennewick",
    address: "Downtown Kennewick demo geofence",
    lat: 46.2112,
    lon: -119.1372,
    geofenceId: 9001,
  },
  {
    appfolioId: "DEMO-002",
    name: "TEST-PROPERTY-02 Pasco",
    address: "Central Pasco demo geofence",
    lat: 46.2396,
    lon: -119.1006,
    geofenceId: 9002,
  },
  {
    appfolioId: "DEMO-003",
    name: "TEST-PROPERTY-03 Richland",
    address: "Central Richland demo geofence",
    lat: 46.2857,
    lon: -119.2845,
    geofenceId: 9003,
  },
];

async function traccarFetch(path, options = {}) {
  const response = await fetch(`${TRACCAR_URL}/api${path}`, {
    ...options,
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Traccar ${response.status} ${path}`);
  }

  return response.json();
}

async function ensureDevice() {
  const devices = await traccarFetch("/devices");
  const existing = devices.find((device) => device.uniqueId === DEMO_UNIQUE_ID);
  if (existing) return existing;

  return traccarFetch("/devices", {
    method: "POST",
    body: JSON.stringify({ name: "TEST-VEHICLE-01", uniqueId: DEMO_UNIQUE_ID }),
  });
}

async function sendPosition(lat, lon, speed = 22) {
  const url = new URL(OSMAND_URL);
  url.searchParams.set("id", DEMO_UNIQUE_ID);
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("speed", String(speed));
  url.searchParams.set("bearing", "270");
  url.searchParams.set("altitude", "350");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`OsmAnd ${response.status}`);
  }
}

async function seedTraccarPositions() {
  const route = [
    [46.2061, -119.1003, 31],
    [46.2095, -119.121, 28],
    [46.2111, -119.1371, 3],
    [46.2113, -119.1374, 0],
    [46.221, -119.125, 24],
    [46.2395, -119.1007, 2],
    [46.2397, -119.1005, 0],
    [46.2602, -119.1964, 35],
  ];

  for (const point of route) {
    await sendPosition(point[0], point[1], point[2]);
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
}

async function seedDatabase(deviceId) {
  const vehicle = await prisma.vehicle.upsert({
    where: { traccarDeviceId: deviceId },
    update: {
      name: "TEST-VEHICLE-01",
      costCategory: Category.RM,
      active: true,
    },
    create: {
      name: "TEST-VEHICLE-01",
      year: 2014,
      make: "Ford",
      model: "F150 4x4",
      traccarDeviceId: deviceId,
      costCategory: Category.RM,
      notes: "Demo vehicle. Do not treat as real fleet data.",
    },
  });

  await prisma.gpsDevice.upsert({
    where: { vehicleId: vehicle.id },
    update: { imei: DEMO_UNIQUE_ID, active: true },
    create: {
      imei: DEMO_UNIQUE_ID,
      model: "Simulated OsmAnd feed",
      vehicleId: vehicle.id,
      installedAt: new Date(),
    },
  });

  const seededProperties = [];
  for (const property of properties) {
    seededProperties.push(
      await prisma.property.upsert({
        where: { geofenceId: property.geofenceId },
        update: { ...property, geofenceRadius: 150, active: true },
        create: { ...property, geofenceRadius: 150 },
      })
    );
  }

  await prisma.exception.deleteMany({
    where: { trip: { traccarTripId: { startsWith: "demo-" } } },
  });
  await prisma.allocationRecord.deleteMany({
    where: { trip: { traccarTripId: { startsWith: "demo-" } } },
  });
  await prisma.stop.deleteMany({
    where: { trip: { traccarTripId: { startsWith: "demo-" } } },
  });
  await prisma.trip.deleteMany({
    where: { traccarTripId: { startsWith: "demo-" } },
  });

  const now = new Date();
  const tripOneStart = new Date(now.getTime() - 1000 * 60 * 75);
  const tripOneEnd = new Date(now.getTime() - 1000 * 60 * 45);
  const tripTwoStart = new Date(now.getTime() - 1000 * 60 * 35);
  const tripTwoEnd = new Date(now.getTime() - 1000 * 60 * 12);
  const reportingPeriod = now.toISOString().slice(0, 7);

  const matchedTrip = await prisma.trip.create({
    data: {
      traccarTripId: "demo-matched-001",
      vehicleId: vehicle.id,
      startTime: tripOneStart,
      endTime: tripOneEnd,
      startLat: 46.2061,
      startLon: -119.1003,
      endLat: seededProperties[0].lat,
      endLon: seededProperties[0].lon,
      distanceMiles: 6.18,
      durationMinutes: 30,
      status: TripStatus.AUTO,
      stops: {
        create: {
          propertyId: seededProperties[0].id,
          arriveTime: new Date(tripOneStart.getTime() + 1000 * 60 * 14),
          departTime: new Date(tripOneStart.getTime() + 1000 * 60 * 30),
          durationMinutes: 16,
          lat: seededProperties[0].lat,
          lon: seededProperties[0].lon,
          confidenceScore: 85,
        },
      },
      allocationRecords: {
        create: {
          propertyId: seededProperties[0].id,
          costCategory: Category.RM,
          mileage: 6.18,
          driveTimeMinutes: 30,
          timeOnSiteMinutes: 16,
          confidenceScore: 85,
          reportingPeriod,
        },
      },
    },
  });

  const exceptionTrip = await prisma.trip.create({
    data: {
      traccarTripId: "demo-exception-001",
      vehicleId: vehicle.id,
      startTime: tripTwoStart,
      endTime: tripTwoEnd,
      startLat: 46.221,
      startLon: -119.125,
      endLat: 46.2602,
      endLon: -119.1964,
      distanceMiles: 4.71,
      durationMinutes: 23,
      status: TripStatus.EXCEPTION,
      exception: {
        create: {
          reason: ExceptionReason.NO_GEOFENCE,
          notes: "Demo supply-run style trip outside seeded property geofences.",
        },
      },
    },
  });

  return { vehicle, matchedTrip, exceptionTrip, properties: seededProperties };
}

async function main() {
  const device = await ensureDevice();
  await seedTraccarPositions();
  const result = await seedDatabase(device.id);

  console.log("Demo seed complete");
  console.log(`Device: ${device.name} (${device.uniqueId})`);
  console.log(`Vehicle DB id: ${result.vehicle.id}`);
  console.log(`Trips: ${result.matchedTrip.id}, ${result.exceptionTrip.id}`);
  console.log(`Properties: ${result.properties.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

