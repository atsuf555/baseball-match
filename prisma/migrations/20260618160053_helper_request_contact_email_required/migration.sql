-- 既存の未入力データを作成者のメールアドレスでバックフィルしてから NOT NULL 制約を付与する
UPDATE "HelperRequest" hr
SET "contactEmail" = u.email
FROM "User" u
WHERE u.id = hr."createdById"
  AND hr."contactEmail" IS NULL
  AND u.email IS NOT NULL;

-- AlterTable
ALTER TABLE "HelperRequest" ALTER COLUMN "contactEmail" SET NOT NULL;
