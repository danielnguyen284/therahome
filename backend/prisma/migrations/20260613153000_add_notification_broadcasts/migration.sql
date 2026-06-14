-- CreateTable
CREATE TABLE "notification_broadcasts" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "url" TEXT NOT NULL DEFAULT '/notifications',
    "target_type" TEXT NOT NULL,
    "target_count" INTEGER NOT NULL DEFAULT 0,
    "inbox_count" INTEGER NOT NULL DEFAULT 0,
    "sent_count" INTEGER NOT NULL DEFAULT 0,
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "skipped_count" INTEGER NOT NULL DEFAULT 0,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_broadcasts_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "notification_dispatch_logs" ADD COLUMN "broadcast_id" UUID;

-- AddForeignKey
ALTER TABLE "notification_broadcasts" ADD CONSTRAINT "notification_broadcasts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_dispatch_logs" ADD CONSTRAINT "notification_dispatch_logs_broadcast_id_fkey" FOREIGN KEY ("broadcast_id") REFERENCES "notification_broadcasts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
