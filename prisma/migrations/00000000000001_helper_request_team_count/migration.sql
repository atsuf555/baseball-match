-- AlterTable: add teamId (nullable first), backfill from Game, then enforce NOT NULL
ALTER TABLE "HelperRequest" ADD COLUMN "teamId" TEXT;

UPDATE "HelperRequest" AS hr
SET "teamId" = g."teamId"
FROM "Game" AS g
WHERE g."id" = hr."gameId";

ALTER TABLE "HelperRequest" ALTER COLUMN "teamId" SET NOT NULL;

-- AlterTable: add count (backfilled from capacity), then drop capacity
ALTER TABLE "HelperRequest" ADD COLUMN "count" INTEGER;

UPDATE "HelperRequest" SET "count" = "capacity";

ALTER TABLE "HelperRequest" ALTER COLUMN "count" SET NOT NULL;
ALTER TABLE "HelperRequest" ALTER COLUMN "count" SET DEFAULT 1;

ALTER TABLE "HelperRequest" DROP COLUMN "capacity";

-- CreateIndex
CREATE INDEX "HelperRequest_teamId_idx" ON "HelperRequest"("teamId");

-- AddForeignKey
ALTER TABLE "HelperRequest" ADD CONSTRAINT "HelperRequest_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
