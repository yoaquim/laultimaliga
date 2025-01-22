/*
  Warnings:

  - You are about to drop the column `pantSize` on the `Player` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Player" DROP COLUMN "pantSize",
ADD COLUMN     "pantsSize" "Size";
