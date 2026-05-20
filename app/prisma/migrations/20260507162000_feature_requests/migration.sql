-- CreateEnum
CREATE TYPE "FeatureRequestStatus" AS ENUM ('NEW', 'REVIEWING', 'PLANNED', 'CLOSED');

-- CreateTable
CREATE TABLE "feature_requests" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "requestedBy" TEXT,
    "details" TEXT NOT NULL,
    "status" "FeatureRequestStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feature_requests_pkey" PRIMARY KEY ("id")
);
