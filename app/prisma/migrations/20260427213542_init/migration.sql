-- CreateEnum
CREATE TYPE "Category" AS ENUM ('RM', 'GROUNDS', 'TURNS', 'UNASSIGNED');

-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('AUTO', 'MANUAL', 'EXCEPTION', 'EXCLUDED');

-- CreateEnum
CREATE TYPE "AllocationMethod" AS ENUM ('AUTO', 'MANUAL');

-- CreateEnum
CREATE TYPE "ExceptionReason" AS ENUM ('NO_GEOFENCE', 'LOW_CONFIDENCE', 'SHORT_TRIP', 'MANUAL_FLAG');

-- CreateTable
CREATE TABLE "vehicles" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "vin" TEXT,
    "traccarDeviceId" INTEGER NOT NULL,
    "costCategory" "Category" NOT NULL DEFAULT 'UNASSIGNED',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "obdAccessible" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gps_devices" (
    "id" SERIAL NOT NULL,
    "imei" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "vehicleId" INTEGER NOT NULL,
    "installedAt" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "gps_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "properties" (
    "id" SERIAL NOT NULL,
    "appfolioId" TEXT,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lon" DOUBLE PRECISION NOT NULL,
    "geofenceId" INTEGER NOT NULL,
    "geofenceRadius" INTEGER NOT NULL DEFAULT 150,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trips" (
    "id" SERIAL NOT NULL,
    "traccarTripId" TEXT,
    "vehicleId" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "startLat" DOUBLE PRECISION NOT NULL,
    "startLon" DOUBLE PRECISION NOT NULL,
    "endLat" DOUBLE PRECISION NOT NULL,
    "endLon" DOUBLE PRECISION NOT NULL,
    "distanceMiles" DOUBLE PRECISION NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "status" "TripStatus" NOT NULL DEFAULT 'AUTO',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stops" (
    "id" SERIAL NOT NULL,
    "tripId" INTEGER NOT NULL,
    "propertyId" INTEGER,
    "arriveTime" TIMESTAMP(3) NOT NULL,
    "departTime" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lon" DOUBLE PRECISION NOT NULL,
    "confidenceScore" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "stops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "allocation_records" (
    "id" SERIAL NOT NULL,
    "tripId" INTEGER NOT NULL,
    "propertyId" INTEGER NOT NULL,
    "costCategory" "Category" NOT NULL,
    "mileage" DOUBLE PRECISION NOT NULL,
    "driveTimeMinutes" INTEGER NOT NULL,
    "timeOnSiteMinutes" INTEGER,
    "allocationMethod" "AllocationMethod" NOT NULL DEFAULT 'AUTO',
    "confidenceScore" INTEGER NOT NULL,
    "reportingPeriod" TEXT NOT NULL,
    "exportedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "allocation_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exceptions" (
    "id" SERIAL NOT NULL,
    "tripId" INTEGER NOT NULL,
    "reason" "ExceptionReason" NOT NULL,
    "assignedPropertyId" INTEGER,
    "assignedCategory" "Category",
    "reviewed" BOOLEAN NOT NULL DEFAULT false,
    "reviewedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exceptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_traccarDeviceId_key" ON "vehicles"("traccarDeviceId");

-- CreateIndex
CREATE UNIQUE INDEX "gps_devices_imei_key" ON "gps_devices"("imei");

-- CreateIndex
CREATE UNIQUE INDEX "gps_devices_vehicleId_key" ON "gps_devices"("vehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "properties_geofenceId_key" ON "properties"("geofenceId");

-- CreateIndex
CREATE UNIQUE INDEX "exceptions_tripId_key" ON "exceptions"("tripId");

-- AddForeignKey
ALTER TABLE "gps_devices" ADD CONSTRAINT "gps_devices_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stops" ADD CONSTRAINT "stops_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stops" ADD CONSTRAINT "stops_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocation_records" ADD CONSTRAINT "allocation_records_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocation_records" ADD CONSTRAINT "allocation_records_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exceptions" ADD CONSTRAINT "exceptions_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exceptions" ADD CONSTRAINT "exceptions_assignedPropertyId_fkey" FOREIGN KEY ("assignedPropertyId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;
