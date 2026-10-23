import { PrismaClient } from "@prisma/client";

/**
 * Singleton del cliente Prisma.
 * Se reutiliza la misma instancia en toda la aplicación para no
 * agotar el pool de conexiones de Neon.
 */
const prisma = new PrismaClient();

export default prisma;
