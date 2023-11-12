-- CreateTable
CREATE TABLE "View" (
    "slug" VARCHAR(128) NOT NULL,
    "count" BIGINT NOT NULL DEFAULT 1,

    CONSTRAINT "view_pkey" PRIMARY KEY ("slug")
);
