import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { CreateBookingUseCase } from "../../application/use-cases/booking/CreateBooking";
import { GetAvailabilityUseCase } from "../../application/use-cases/booking/GetAvailability";
import { GetBookingByIdUseCase } from "../../application/use-cases/booking/GetBookingById";
import { UpdateBookingStatusUseCase } from "../../application/use-cases/booking/UpdateBookingStatus";
import { GetBookingsUseCase } from "../../application/use-cases/booking/GetBookings";
import { CreateBookingDto } from "../../application/dtos/BookingDto";
import { BookingStatus } from "../../domain/models/Booking";
import { ValidationError } from "../../domain/errors/DomainErrors";

const ACCEPTED_BOOKING_STATUSES: BookingStatus[] = [
  "confirmed",
  "cancelled",
  "completed",
];

const getBookingsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val === undefined || val === "" ? 1 : Number(val)))
    .refine((val) => Number.isInteger(val) && val >= 1, {
      message: "El parámetro page debe ser un entero mayor o igual a 1.",
    }),
  limit: z
    .string()
    .optional()
    .transform((val) => (val === undefined || val === "" ? 10 : Number(val)))
    .refine((val) => Number.isInteger(val) && val >= 1 && val <= 50, {
      message: "El parámetro limit debe ser un entero entre 1 y 50.",
    }),
  status: z
    .string()
    .optional()
    .transform((val) => (val === "" ? undefined : val))
    .refine(
      (val): val is BookingStatus | undefined =>
        val === undefined ||
        ["pending", "confirmed", "cancelled", "completed"].includes(val),
      {
        message: "El parámetro status debe ser pending, confirmed, cancelled o completed.",
      }
    ),
  q: z
    .string()
    .optional()
    .transform((val) => (val && val.trim() ? val.trim() : undefined)),
});

export class BookingsController {
  constructor(
    private readonly createBookingUseCase: CreateBookingUseCase,
    private readonly getAvailabilityUseCase: GetAvailabilityUseCase,
    private readonly getBookingByIdUseCase: GetBookingByIdUseCase,
    private readonly updateBookingStatusUseCase: UpdateBookingStatusUseCase,
    private readonly getBookingsUseCase: GetBookingsUseCase
  ) {}

  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = getBookingsQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        const message = parsed.error.issues[0]?.message ?? "Parámetros de consulta inválidos.";
        throw new ValidationError(message);
      }
      const bookings = await this.getBookingsUseCase.execute(parsed.data);
      res.status(200).json(bookings);
    } catch (err) {
      next(err);
    }
  };

  /** POST /bookings — Público: el cliente reserva una chiva */
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto: CreateBookingDto = req.body;
      const booking = await this.createBookingUseCase.execute(dto);
      res.status(201).json(booking);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /bookings/availability?chivaId=&date=
   * Público: alimenta el calendario del frontend.
   * req.query puede ser string | string[] — extraemos y validamos el tipo.
   */
  getAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const chivaId = req.query.chivaId as string;
      const date = req.query.date as string;

      if (!chivaId || !date) {
        res.status(400).json({
          error: { type: "ValidationError", message: "chivaId y date son requeridos." },
        });
        return;
      }

      const result = await this.getAvailabilityUseCase.execute({ chivaId, date });
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  /** GET /bookings/:id — Protegido: detalle de una reserva para el panel admin */
  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      // Si no existe, GetBookingByIdUseCase lanza BookingNotFoundError → error middleware → 404
      const booking = await this.getBookingByIdUseCase.execute(id);
      res.status(200).json(booking);
    } catch (err) {
      next(err);
    }
  };

  /** PATCH /bookings/:id/status — Protegido: confirmar, cancelar o completar */
  updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const { status } = req.body ?? {};

      if (!status) {
        throw new ValidationError("El campo status es requerido.");
      }

      if (
        typeof status !== "string" ||
        !ACCEPTED_BOOKING_STATUSES.includes(status as BookingStatus)
      ) {
        throw new ValidationError(
          "El campo status debe ser confirmed, cancelled o completed."
        );
      }

      // Si no existe o la transición no es válida, el use case lanza los errores de dominio
      const booking = await this.updateBookingStatusUseCase.execute(
        id,
        status as BookingStatus
      );
      res.status(200).json(booking);
    } catch (err) {
      next(err);
    }
  };
}
