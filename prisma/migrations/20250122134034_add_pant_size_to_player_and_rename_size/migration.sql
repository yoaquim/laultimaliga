/*
  Warnings:

  - You are about to drop the column `size` on the `Player` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Player" DROP COLUMN "size",
ADD COLUMN     "pantSize" "Size",
ADD COLUMN     "shirtSize" "Size";
