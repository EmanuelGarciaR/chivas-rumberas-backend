import "dotenv/config";
import bcrypt from "bcrypt";
import prisma from "../infrastructure/database/prismaClient";

async function main() {
  console.log("🌱 Iniciando seed de base de datos...");

  // 1. Usuarios: Admin y Usuario de prueba (Operador)
  const adminPasswordHash = await bcrypt.hash("Admin123*Chiva", 10);
  const testUserPasswordHash = await bcrypt.hash("Operador123*Chiva", 10);

  await prisma.user.upsert({
    where: { email: "admin@chivasrumberas.com" },
    update: { passwordHash: adminPasswordHash, role: "admin" },
    create: {
      email: "admin@chivasrumberas.com",
      passwordHash: adminPasswordHash,
      role: "admin",
    },
  });

  await prisma.user.upsert({
    where: { email: "operador@chivasrumberas.com" },
    update: { passwordHash: testUserPasswordHash, role: "operator" },
    create: {
      email: "operador@chivasrumberas.com",
      passwordHash: testUserPasswordHash,
      role: "operator",
    },
  });

  // 2. Recorridos (Travels)
  const travels = [
    {
      id: "trv_alumbrados",
      name: "Ruta Navideña y Alumbrados",
      description: "Recorrido por los principales puntos iluminados y parques de Medellín.",
      durationHours: 4,
      highlights: ["Río Medellín", "Parque Norte", "Avenida La Playa", "Parada para buñuelos y natilla"],
      isActive: true,
    },
    {
      id: "trv_miradores",
      name: "Tour Miradores Nocturnos",
      description: "Ruta panorámica de fiesta por los mejores miradores del Valle de Aburrá.",
      durationHours: 3,
      highlights: ["Mirador Las Palmas", "Pueblito Paisa", "Parada de fotos panorámica"],
      isActive: true,
    },
    {
      id: "trv_sabaneta",
      name: "Rumba Fonda y Sabaneta",
      description: "Recorrido rumbero por La 70, Poblado y el Parque de Sabaneta.",
      durationHours: 4,
      highlights: ["Boulevard La 70", "Parque Lleras", "Parque de Sabaneta"],
      isActive: true,
    },
  ];

  for (const travel of travels) {
    await prisma.travel.upsert({
      where: { id: travel.id },
      update: travel,
      create: travel,
    });
  }

  // 3. 4 Chivas de ejemplo
  const chivas = [
    {
      id: "la-coqueta-1954",
      name: "La Coqueta",
      description: "Chiva tradicional paisa equipada con sonido profesional y luces LED.",
      capacity: 50,
      imageUrls: [
        "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1000&q=80",
      ],
      pricePerHour: 280000,
      status: "available" as const,
      features: ["Sonido profesional 4000W", "Luces robóticas", "Animador / DJ", "Parrilla para equipaje"],
    },
    {
      id: "la-perla-1959",
      name: "La Perla",
      description: "Chiva clásica restaurada ideal para grupos empresariales y celebraciones familiares.",
      capacity: 45,
      imageUrls: [
        "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=1000&q=80",
      ],
      pricePerHour: 300000,
      status: "available" as const,
      features: ["Sonido envolvente", "Barra auxiliar", "Luces láser", "Micrófono inalámbrico"],
    },
    {
      id: "la-parrandera-1962",
      name: "La Parrandera",
      description: "Chiva rumbera con pista central ampliada y máquina de humo.",
      capacity: 40,
      imageUrls: [
        "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=1000&q=80",
      ],
      pricePerHour: 260000,
      status: "available" as const,
      features: ["Máquina de humo", "Sonido 3500W", "Conectividad Bluetooth", "Nevera para bebidas"],
    },
    {
      id: "el-arriero-1957",
      name: "El Arriero",
      description: "Chiva típica antioqueña de gran capacidad para tours turísticos y despedidas.",
      capacity: 55,
      imageUrls: [
        "https://images.unsplash.com/photo-1464219789935-c2d9d9aba644?auto=format&fit=crop&w=1000&q=80",
      ],
      pricePerHour: 320000,
      status: "available" as const,
      features: ["Capacidad extendida 55 pax", "Sonido 5000W", "DJ en vivo", "Iluminación LED RGB"],
    },
  ];

  for (const chiva of chivas) {
    await prisma.chiva.upsert({
      where: { id: chiva.id },
      update: chiva,
      create: chiva,
    });
  }

  // 4. Clientes y reservas confirmadas en el mes actual (America/Bogota)
  const nowBogota = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
  }).format(new Date()); // "YYYY-MM"

  const customer1 = await prisma.customer.upsert({
    where: { email: "carolina.montoya@ejemplo.com" },
    update: { name: "Carolina Montoya", phone: "3001234567" },
    create: {
      name: "Carolina Montoya",
      email: "carolina.montoya@ejemplo.com",
      phone: "3001234567",
    },
  });

  const customer2 = await prisma.customer.upsert({
    where: { email: "andres.restrepo@ejemplo.com" },
    update: { name: "Andrés Restrepo", phone: "3109876543" },
    create: {
      name: "Andrés Restrepo",
      email: "andres.restrepo@ejemplo.com",
      phone: "3109876543",
    },
  });

  const customer3 = await prisma.customer.upsert({
    where: { email: "valentina.gomez@ejemplo.com" },
    update: { name: "Valentina Gómez", phone: "3204567890" },
    create: {
      name: "Valentina Gómez",
      email: "valentina.gomez@ejemplo.com",
      phone: "3204567890",
    },
  });

  const seedBookings = [
    // Día 20 del mes actual: DOS chivas ocupadas el mismo día
    {
      id: "CR-SEED01",
      chivaId: "la-coqueta-1954",
      travelId: "trv_alumbrados",
      customerId: customer1.id,
      customerName: customer1.name,
      customerEmail: customer1.email,
      customerPhone: customer1.phone,
      guestCount: 42,
      eventDate: new Date(`${nowBogota}-20T00:00:00.000Z`),
      startTime: "18:00",
      durationHours: 4,
      totalPrice: 280000 * 4,
      status: "confirmed" as const,
      notes: "Cumpleaños empresarial en La Coqueta.",
      calendarSyncStatus: "pending" as const,
    },
    {
      id: "CR-SEED02",
      chivaId: "la-perla-1959",
      travelId: "trv_miradores",
      customerId: customer2.id,
      customerName: customer2.name,
      customerEmail: customer2.email,
      customerPhone: customer2.phone,
      guestCount: 35,
      eventDate: new Date(`${nowBogota}-20T00:00:00.000Z`),
      startTime: "20:00",
      durationHours: 3,
      totalPrice: 300000 * 3,
      status: "confirmed" as const,
      notes: "Despedida de fin de año en La Perla.",
      calendarSyncStatus: "pending" as const,
    },
    // Día 25 del mes actual: Reserva nocturna que cruza medianoche
    {
      id: "CR-SEED03",
      chivaId: "la-parrandera-1962",
      travelId: "trv_sabaneta",
      customerId: customer3.id,
      customerName: customer3.name,
      customerEmail: customer3.email,
      customerPhone: customer3.phone,
      guestCount: 38,
      eventDate: new Date(`${nowBogota}-25T00:00:00.000Z`),
      startTime: "21:00",
      durationHours: 4,
      totalPrice: 260000 * 4,
      status: "confirmed" as const,
      notes: "Rumba nocturna hasta la 01:00 AM.",
      calendarSyncStatus: "pending" as const,
    },
  ];

  for (const booking of seedBookings) {
    await prisma.booking.upsert({
      where: { id: booking.id },
      update: booking,
      create: booking,
    });
  }

  console.log("✅ Seed completado exitosamente.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error("❌ Error ejecutando seed:", err);
    await prisma.$disconnect();
    process.exit(1);
  });
