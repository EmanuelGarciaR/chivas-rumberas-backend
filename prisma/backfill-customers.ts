import "dotenv/config";
import prisma from "../infrastructure/database/prismaClient";

/**
 * Script de backfill idempotente:
 * Crea o actualiza registros en la tabla `customers` a partir de las reservas existentes
 * y enlaza `Booking.customerId` sin pérdida de datos.
 */
export async function backfillCustomers(): Promise<void> {
  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: "asc" },
  });

  let linkedCount = 0;

  for (const booking of bookings) {
    const normalizedEmail = booking.customerEmail.trim().toLowerCase();
    if (!normalizedEmail) continue;

    const customer = await prisma.customer.upsert({
      where: { email: normalizedEmail },
      update: {
        name: booking.customerName.trim(),
        phone: booking.customerPhone.trim(),
      },
      create: {
        name: booking.customerName.trim(),
        email: normalizedEmail,
        phone: booking.customerPhone.trim(),
      },
    });

    if (booking.customerId !== customer.id) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { customerId: customer.id },
      });
      linkedCount++;
    }
  }

  console.log(
    `[Backfill] Procesadas ${bookings.length} reservas. ${linkedCount} reservas vinculadas/actualizadas.`
  );
}

if (require.main === module) {
  backfillCustomers()
    .then(() => prisma.$disconnect())
    .catch(async (err) => {
      console.error("[Backfill] Error:", err);
      await prisma.$disconnect();
      process.exit(1);
    });
}
