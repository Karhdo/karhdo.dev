/*
  Warnings:

  - You are about to drop the `View` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "StatsType" AS ENUM ('blog', 'snippet');

-- DropTable
DROP TABLE "View";

-- CreateTable
CREATE TABLE "stats" (
    "type" "StatsType" NOT NULL DEFAULT 'blog',
    "slug" VARCHAR(255) NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "loves" INTEGER NOT NULL DEFAULT 0,
    "applauses" INTEGER NOT NULL DEFAULT 0,
    "ideas" INTEGER NOT NULL DEFAULT 0,
    "bullseye" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "stats_pkey" PRIMARY KEY ("type","slug")
);
