import { Category, ExceptionReason, TripStatus } from "@prisma/client";
import { prisma } from "./prisma";
import { traccar, type TraccarDevice, type TraccarPosition } from "./traccar";

export type SourceError = {
  source: "traccar" | "database";
  message: string;
};

export type VehicleRow = {
  id: string;
  name: string;
  source: "Traccar" | "App DB";
  uniqueId: string;
  status: string;
  lastUpdate: string | null;
  traccarDeviceId: number;
  positionId: number | null;
  appVehicleName: string | null;
  category: Category | "UNKNOWN";
  lastLocation: string;
};

export type MapVehicle = {
  id: number;
  name: string;
  status: string;
  latitude: number;
  longitude: number;
  lastUpdate: string | null;
};

export type MapProperty = {
  id: number;
  name: string;
  address: string;
  lat: number;
  lon: number;
  radius: number;
};

export type TripRow = {
  id: number;
  vehicle: string;
  property: string | null;
  status: TripStatus;
  startTime: Date;
  endTime: Date;
  distanceMiles: number;
  durationMinutes: number;
  confidenceScore: number | null;
  timeOnSiteMinutes: number | null;
  exceptionReason: ExceptionReason | null;
};

export type ReportRow = {
  property: string;
  vehicle: string;
  date: string;
  trips: number;
  miles: number;
  driveTimeMinutes: number;
  timeOnSiteMinutes: number;
  category: Category;
  autoAllocatedPercent: number;
  exceptionCount: number;
};

type Result<T> = {
  data: T;
  errors: SourceError[];
};

async function read<T>(
  source: SourceError["source"],
  fallback: T,
  fn: () => Promise<T>
): Promise<Result<T>> {
  try {
    return { data: await fn(), errors: [] };
  } catch (error) {
    return {
      data: fallback,
      errors: [
        {
          source,
          message: error instanceof Error ? error.message : String(error),
        },
      ],
    };
  }
}

export async function getVehicles(): Promise<Result<VehicleRow[]>> {
  const [devices, vehicles, positions, properties] = await Promise.all([
    read("traccar", [] as TraccarDevice[], traccar.getDevices),
    read("database", [], () => prisma.vehicle.findMany()),
    read("traccar", [] as TraccarPosition[], traccar.getPositions),
    read("database", [], () =>
      prisma.property.findMany({ where: { active: true }, orderBy: { name: "asc" } })
    ),
  ]);

  const appByDevice = new Map(
    vehicles.data.map((vehicle) => [vehicle.traccarDeviceId, vehicle])
  );
  const positionByDevice = new Map(positions.data.map((position) => [position.deviceId, position]));
  const locationForDevice = (deviceId: number) => {
    const position = positionByDevice.get(deviceId);
    if (!position) return "Not available";
    const nearby = closestProperty(position.latitude, position.longitude, properties.data);
    if (!nearby) return `${position.latitude.toFixed(4)}, ${position.longitude.toFixed(4)}`;
    return nearby.insideGeofence ? nearby.name : `Near ${nearby.name}`;
  };

  const rows: VehicleRow[] = devices.data.map((device) => {
    const appVehicle = appByDevice.get(device.id);
    return {
      id: `traccar-${device.id}`,
      name: device.name,
      source: "Traccar" as const,
      uniqueId: device.uniqueId,
      status: device.status ?? "unknown",
      lastUpdate: device.lastUpdate ?? null,
      traccarDeviceId: device.id,
      positionId: device.positionId ?? null,
      appVehicleName: appVehicle?.name ?? null,
      category: appVehicle?.costCategory ?? "UNKNOWN",
      lastLocation: locationForDevice(device.id),
    };
  });

  const orphanAppRows: VehicleRow[] = vehicles.data
    .filter((vehicle) => !devices.data.some((device) => device.id === vehicle.traccarDeviceId))
    .map((vehicle) => ({
      id: `app-${vehicle.id}`,
      name: vehicle.name,
      source: "App DB" as const,
      uniqueId: `device ${vehicle.traccarDeviceId}`,
      status: vehicle.active ? "linked missing" : "inactive",
      lastUpdate: null,
      traccarDeviceId: vehicle.traccarDeviceId,
      positionId: null,
      appVehicleName: vehicle.name,
      category: vehicle.costCategory,
      lastLocation: "Not available",
    }));

  return {
    data: [...rows, ...orphanAppRows],
    errors: [...devices.errors, ...vehicles.errors, ...positions.errors, ...properties.errors],
  };
}

function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const earthRadiusMeters = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function closestProperty(
  lat: number,
  lon: number,
  properties: Array<{ name: string; lat: number; lon: number; geofenceRadius: number }>
) {
  let closest: { name: string; distance: number; insideGeofence: boolean } | null = null;

  for (const property of properties) {
    const distance = distanceMeters(lat, lon, property.lat, property.lon);
    if (!closest || distance < closest.distance) {
      closest = {
        name: property.name,
        distance,
        insideGeofence: distance <= property.geofenceRadius,
      };
    }
  }

  return closest;
}

export async function getMapData(): Promise<
  Result<{ vehicles: MapVehicle[]; properties: MapProperty[] }>
> {
  const [positions, devices, properties] = await Promise.all([
    read("traccar", [] as TraccarPosition[], traccar.getPositions),
    read("traccar", [] as TraccarDevice[], traccar.getDevices),
    read("database", [], () =>
      prisma.property.findMany({ where: { active: true }, orderBy: { name: "asc" } })
    ),
  ]);

  const devicesById = new Map(devices.data.map((device) => [device.id, device]));
  const vehicles = positions.data
    .filter((position) => position.latitude && position.longitude)
    .map((position) => {
      const device = devicesById.get(position.deviceId);
      return {
        id: position.deviceId,
        name: device?.name ?? `Device ${position.deviceId}`,
        status: device?.status ?? "unknown",
        latitude: position.latitude,
        longitude: position.longitude,
        lastUpdate: position.fixTime ?? device?.lastUpdate ?? null,
      };
    });

  return {
    data: {
      vehicles,
      properties: properties.data.map((property) => ({
        id: property.id,
        name: property.name,
        address: property.address,
        lat: property.lat,
        lon: property.lon,
        radius: property.geofenceRadius,
      })),
    },
    errors: [...positions.errors, ...devices.errors, ...properties.errors],
  };
}

export async function getTrips(): Promise<Result<TripRow[]>> {
  const trips = await read("database", [], () =>
    prisma.trip.findMany({
      orderBy: { startTime: "desc" },
      include: {
        vehicle: true,
        allocationRecords: { include: { property: true } },
        stops: { include: { property: true } },
        exception: true,
      },
      take: 50,
    })
  );

  return {
    data: trips.data.map((trip) => {
      const allocation = trip.allocationRecords[0];
      const stop = trip.stops.find((item) => item.propertyId);
      return {
        id: trip.id,
        vehicle: trip.vehicle.name,
        property: allocation?.property.name ?? stop?.property?.name ?? null,
        status: trip.status,
        startTime: trip.startTime,
        endTime: trip.endTime,
        distanceMiles: trip.distanceMiles,
        durationMinutes: trip.durationMinutes,
        confidenceScore: allocation?.confidenceScore ?? stop?.confidenceScore ?? null,
        timeOnSiteMinutes: allocation?.timeOnSiteMinutes ?? stop?.durationMinutes ?? null,
        exceptionReason: trip.exception?.reason ?? null,
      };
    }),
    errors: trips.errors,
  };
}

export async function getProperties(): Promise<Result<MapProperty[]>> {
  const properties = await read("database", [], () =>
    prisma.property.findMany({ orderBy: { name: "asc" } })
  );

  return {
    data: properties.data.map((property) => ({
      id: property.id,
      name: property.name,
      address: property.address,
      lat: property.lat,
      lon: property.lon,
      radius: property.geofenceRadius,
    })),
    errors: properties.errors,
  };
}

export async function getReportRows(): Promise<Result<ReportRow[]>> {
  const records = await read("database", [], () =>
    prisma.allocationRecord.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        trip: { include: { vehicle: true, exception: true } },
        property: true,
      },
    })
  );

  const grouped = new Map<string, ReportRow>();

  for (const record of records.data) {
    const date = record.trip.startTime.toISOString().slice(0, 10);
    const key = `${record.propertyId}:${record.trip.vehicleId}:${date}:${record.costCategory}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.trips += 1;
      existing.miles += record.mileage;
      existing.driveTimeMinutes += record.driveTimeMinutes;
      existing.timeOnSiteMinutes += record.timeOnSiteMinutes ?? 0;
      existing.exceptionCount += record.trip.exception ? 1 : 0;
      existing.autoAllocatedPercent = Math.round(
        ((existing.trips - existing.exceptionCount) / existing.trips) * 100
      );
    } else {
      grouped.set(key, {
        property: record.property.name,
        vehicle: record.trip.vehicle.name,
        date,
        trips: 1,
        miles: record.mileage,
        driveTimeMinutes: record.driveTimeMinutes,
        timeOnSiteMinutes: record.timeOnSiteMinutes ?? 0,
        category: record.costCategory,
        autoAllocatedPercent: record.allocationMethod === "AUTO" ? 100 : 0,
        exceptionCount: record.trip.exception ? 1 : 0,
      });
    }
  }

  return {
    data: Array.from(grouped.values()).map((row) => ({
      ...row,
      miles: Number(row.miles.toFixed(2)),
    })),
    errors: records.errors,
  };
}

export function reportRowsToCsv(rows: ReportRow[]): string {
  const header = [
    "Property",
    "Vehicle",
    "Date",
    "Trips",
    "Miles",
    "Drive Time (min)",
    "Time on Site (min)",
    "Category",
    "Auto-Allocated %",
    "Exceptions",
  ];

  const escape = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;

  return [
    header.map(escape).join(","),
    ...rows.map((row) =>
      [
        row.property,
        row.vehicle,
        row.date,
        row.trips,
        row.miles,
        row.driveTimeMinutes,
        row.timeOnSiteMinutes,
        row.category,
        row.autoAllocatedPercent,
        row.exceptionCount,
      ]
        .map(escape)
        .join(",")
    ),
  ].join("\n");
}
