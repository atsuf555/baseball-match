-- AlterTable
ALTER TABLE "GroundOffer" ADD COLUMN     "prefecture" TEXT NOT NULL DEFAULT '東京都';

-- AlterTable
ALTER TABLE "HelperRequest" ADD COLUMN     "prefecture" TEXT NOT NULL DEFAULT '東京都';

-- AlterTable
ALTER TABLE "MatchRequest" ADD COLUMN     "prefecture" TEXT NOT NULL DEFAULT '東京都';

-- AlterTable
ALTER TABLE "MemberRequest" ADD COLUMN     "prefecture" TEXT NOT NULL DEFAULT '東京都';
