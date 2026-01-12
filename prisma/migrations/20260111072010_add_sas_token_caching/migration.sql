-- AlterTable
ALTER TABLE "agents" ADD COLUMN     "encrypted_sas_token" TEXT,
ADD COLUMN     "sas_manager_id" INTEGER,
ADD COLUMN     "sas_token_expires_at" TIMESTAMP(3);
