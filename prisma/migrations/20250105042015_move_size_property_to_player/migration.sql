/*
  Warnings:

  - You are about to drop the column `size` on the `User` table. All the data in the column will be lost.
  - Added the required column `size` to the `Player` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "size" "Size" NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "size";
