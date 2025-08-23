-- CreateEnum
CREATE TYPE "public"."SimulationStatus" AS ENUM ('COMPLETED', 'RUNNING', 'FAILED');

-- CreateTable
CREATE TABLE "public"."simulation_runs" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "public"."SimulationStatus" NOT NULL DEFAULT 'RUNNING',
    "results" JSONB,
    "totalConsumedEnergy" DOUBLE PRECISION,
    "inputs" JSONB NOT NULL,
    "name" TEXT,

    CONSTRAINT "simulation_runs_pkey" PRIMARY KEY ("id")
);
