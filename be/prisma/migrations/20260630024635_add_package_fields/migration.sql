-- AlterTable
ALTER TABLE "accounts" ADD COLUMN     "package_expires_at" TIMESTAMPTZ,
ADD COLUMN     "package_type" VARCHAR(50) NOT NULL DEFAULT 'Free';
