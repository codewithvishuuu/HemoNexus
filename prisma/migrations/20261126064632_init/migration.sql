-- CreateTable
CREATE TABLE "Institution" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "isSimulated" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Institution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BloodUnit" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "component" TEXT NOT NULL,
    "collectedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "storageCondition" TEXT NOT NULL,
    "quarantineState" TEXT NOT NULL DEFAULT 'IN_STOCK',
    "qualityVerified" BOOLEAN NOT NULL DEFAULT false,
    "excursionOpen" BOOLEAN NOT NULL DEFAULT false,
    "temperatureC" DOUBLE PRECISION NOT NULL DEFAULT 4,
    "lastUpdateAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL DEFAULT 'SIMULATED',
    "verifiedBy" TEXT,
    "distribution" TEXT NOT NULL DEFAULT '[]',
    "reserved" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "BloodUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemperatureReading" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "temperatureC" DOUBLE PRECISION NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemperatureReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExcursionEvent" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "reason" TEXT,
    "resolvedBy" TEXT,

    CONSTRAINT "ExcursionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsumptionEvent" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "component" TEXT NOT NULL,
    "units" INTEGER NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'SIMULATED',

    CONSTRAINT "ConsumptionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DonationEvent" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "units" INTEGER NOT NULL,
    "arrivedAt" TIMESTAMP(3) NOT NULL,
    "availableAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DonationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataTrustRecord" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "lastUpdateAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verificationState" TEXT NOT NULL DEFAULT 'VERIFIED',
    "missingFields" TEXT NOT NULL DEFAULT '[]',
    "conflicts" TEXT NOT NULL DEFAULT '[]',
    "staleFlag" BOOLEAN NOT NULL DEFAULT false,
    "completenessPct" INTEGER NOT NULL DEFAULT 100,

    CONSTRAINT "DataTrustRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComponentRule" (
    "id" TEXT NOT NULL,
    "component" TEXT NOT NULL,
    "storageMin" DOUBLE PRECISION NOT NULL,
    "storageMax" DOUBLE PRECISION NOT NULL,
    "shelfLifeDays" INTEGER NOT NULL,
    "transportMin" DOUBLE PRECISION NOT NULL,
    "transportMax" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL,
    "version" TEXT NOT NULL,

    CONSTRAINT "ComponentRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForecastSnapshot" (
    "id" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "component" TEXT NOT NULL,
    "asOf" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "point" TEXT NOT NULL,
    "low" TEXT NOT NULL,
    "high" TEXT NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "metrics" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'OK',
    "dataVersion" TEXT NOT NULL,

    CONSTRAINT "ForecastSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskScore" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "component" TEXT NOT NULL,
    "band" TEXT NOT NULL,
    "raw" DOUBLE PRECISION NOT NULL,
    "factors" TEXT NOT NULL,
    "weightsVersion" TEXT NOT NULL,
    "asOf" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "state" TEXT NOT NULL DEFAULT 'OK',

    CONSTRAINT "RiskScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "scoreId" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'OPEN',
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransferRequest" (
    "id" TEXT NOT NULL,
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "component" TEXT NOT NULL,
    "units" INTEGER NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransferRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Approval" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "checkpoint" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Approval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "idempotencyKey" TEXT NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimulationRun" (
    "id" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "scenario" TEXT NOT NULL,
    "assumptions" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SimulationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "institutionId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "traceId" TEXT,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "institutionId" TEXT,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BloodUnit_institutionId_group_component_idx" ON "BloodUnit"("institutionId", "group", "component");

-- CreateIndex
CREATE INDEX "ConsumptionEvent_institutionId_group_component_occurredAt_idx" ON "ConsumptionEvent"("institutionId", "group", "component", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "ComponentRule_component_key" ON "ComponentRule"("component");

-- CreateIndex
CREATE UNIQUE INDEX "ForecastSnapshot_region_group_component_asOf_dataVersion_key" ON "ForecastSnapshot"("region", "group", "component", "asOf", "dataVersion");

-- CreateIndex
CREATE INDEX "RiskScore_institutionId_band_idx" ON "RiskScore"("institutionId", "band");

-- CreateIndex
CREATE UNIQUE INDEX "TransferRequest_idempotencyKey_key" ON "TransferRequest"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Reservation_unitId_state_idx" ON "Reservation"("unitId", "state");

-- CreateIndex
CREATE INDEX "AuditLog_entity_at_idx" ON "AuditLog"("entity", "at");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "BloodUnit" ADD CONSTRAINT "BloodUnit_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemperatureReading" ADD CONSTRAINT "TemperatureReading_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "BloodUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExcursionEvent" ADD CONSTRAINT "ExcursionEvent_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "BloodUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsumptionEvent" ADD CONSTRAINT "ConsumptionEvent_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonationEvent" ADD CONSTRAINT "DonationEvent_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataTrustRecord" ADD CONSTRAINT "DataTrustRecord_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskScore" ADD CONSTRAINT "RiskScore_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "TransferRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "BloodUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "TransferRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
