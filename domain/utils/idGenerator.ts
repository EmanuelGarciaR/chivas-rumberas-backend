import crypto from "node:crypto";

/**
 * Caracteres legibles sin ambigüedad (sin 0, O, 1, I para evitar confusiones al leer).
 */
const ALPHANUMERIC_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/**
 * Genera un código de reserva amigable para el cliente.
 * Formato: CR-XXXXX (ej: CR-8P2Q9)
 */
export function generateBookingCode(length: number = 6): string {
  const bytes = crypto.randomBytes(length);
  let code = "";
  for (let i = 0; i < length; i++) {
    code += ALPHANUMERIC_CHARS[bytes[i] % ALPHANUMERIC_CHARS.length];
  }
  return `CR-${code}`;
}

/**
 * Genera un NanoID corto para entidades como Recorridos (Travels).
 * Formato: trv_xxxxxx (ej: trv_m9X2k4)
 */
export function generateNanoId(prefix: string = "trv_", length: number = 8): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = crypto.randomBytes(length);
  let id = "";
  for (let i = 0; i < length; i++) {
    id += chars[bytes[i] % chars.length];
  }
  return `${prefix}${id}`;
}

/**
 * Convierte un nombre en un slug URL-friendly.
 * Ej: "La Perla — 1959" -> "la-perla-1959"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remueve tildes
    .replace(/[^a-z0-9]+/g, "-")     // Reemplaza símbolos y espacios por guiones
    .replace(/^-+|-+$/g, "");        // Quita guiones sobrantes al inicio y final
}
