/*
  Warnings:

  - Added the required column `size` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Size" AS ENUM ('SMALL', 'MEDIUM', 'LARGE', 'X_LARGE', 'XX_LARGE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "size" "Size" NOT NULL;
