import { Request, Response, NextFunction } from "express";
import { CreateBookingUseCase } from "../../application/use-cases/booking/CreateBooking";
import { GetAvailabilityUseCase } from "../../application/use-cases/booking/GetAvailability";
import { GetBookingByIdUseCase } from "../../application/use-cases/booking/GetBookingById";
import { UpdateBookingStatusUseCase } from "../../application/use-cases/booking/UpdateBookingStatus";
import { CreateBookingDto } from "../../application/dtos/BookingDto";
import { BookingStatus } from "../../domain/models/Booking";

export class BookingsController {
  constructor(
    private readonly createBookingUseCase: CreateBookingUseCase,
    private readonly getAvailabilityUseCase: GetAvailabilityUseCase,
    private readonly getBookingByIdUseCase: GetBookingByIdUseCase,
    private readonly updateBookingStatusUseCase: UpdateBookingStatusUseCase
  ) {}

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
      const { status } = req.body as { status: BookingStatus };

      if (!status) {
        res.status(400).json({
          error: { type: "ValidationError", message: "El campo status es requerido." },
        });
        return;
      }

      // Si no existe o la transición no es válida, el use case lanza los errores de dominio
      const booking = await this.updateBookingStatusUseCase.execute(id, status);
      res.status(200).json(booking);
    } catch (err) {
      next(err);
    }
  };
}
