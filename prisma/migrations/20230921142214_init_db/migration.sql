-- CreateTable
CREATE TABLE "views" (
    "slug" VARCHAR(128) NOT NULL,
    "count" BIGINT NOT NULL DEFAULT 1,

    CONSTRAINT "views_pkey" PRIMARY KEY ("slug")
);
