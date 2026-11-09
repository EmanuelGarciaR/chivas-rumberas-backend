-- CreateEnum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CalendarSyncStatus') THEN
        CREATE TYPE "CalendarSyncStatus" AS ENUM ('pending', 'synced', 'failed');
    END IF;
END $$;

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "googleEventId" TEXT;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "calendarSyncStatus" "CalendarSyncStatus" NOT NULL DEFAULT 'pending';
