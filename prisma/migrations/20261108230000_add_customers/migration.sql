-- CreateTable
CREATE TABLE IF NOT EXISTS "customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "customers_email_key" ON "customers"("email");

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "customerId" TEXT;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'bookings_customerId_fkey'
    ) THEN
        ALTER TABLE "bookings"
        ADD CONSTRAINT "bookings_customerId_fkey"
        FOREIGN KEY ("customerId") REFERENCES "customers"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
