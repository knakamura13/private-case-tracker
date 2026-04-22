-- AlterTable: add twoFactorEnabled column required by better-auth twoFactor plugin
ALTER TABLE "User" ADD COLUMN "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;
