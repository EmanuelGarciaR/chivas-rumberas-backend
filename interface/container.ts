/**
 * Container de dependencias.
 * Aquí se ensamblan todas las capas: Infrastructure → Application → Interface.
 * Es el único lugar donde se importa infraestructura concreta.
 */

// ── Infrastructure ─────────────────────────────────────────────────────────
import { ChivaRepository } from "../infrastructure/repositories/chivas.pg.repository";
import { BookingRepository } from "../infrastructure/repositories/bookings.pg.repository";
import { TravelRepository } from "../infrastructure/repositories/travels.pg.repository";
import { UserRepository } from "../infrastructure/repositories/users.pg.repository";
import { CustomerRepository } from "../infrastructure/repositories/customers.pg.repository";
import { JwtService } from "../infrastructure/services/JwtService";
import { EmailResendService } from "../infrastructure/services/email.resend.service";
// import { WhatsAppTwilioService } from "../infrastructure/services/whatsapp.twilio.service";
import { NotificationService } from "../infrastructure/services/NotificationService";
import { CloudinaryImageStorage } from "../infrastructure/services/cloudinary.storage.service";
import { GoogleCalendarService } from "../infrastructure/services/google-calendar.service";

// ── Application — Use Cases ────────────────────────────────────────────────
import { LoginUseCase } from "../application/use-cases/auth/Login";
import { GetChivasUseCase } from "../application/use-cases/chiva/GetChivas";
import { GetChivaByIdUseCase } from "../application/use-cases/chiva/GetChivaById";
import { CreateChivaUseCase } from "../application/use-cases/chiva/CreateChiva";
import { UpdateChivaUseCase } from "../application/use-cases/chiva/UpdateChiva";
import { UpdateChivaStatusUseCase } from "../application/use-cases/chiva/UpdateChivaStatus";
import { DeleteChivaUseCase } from "../application/use-cases/chiva/DeleteChiva";
import { GetTravelsUseCase } from "../application/use-cases/travel/GetTravels";
import { CreateBookingUseCase } from "../application/use-cases/booking/CreateBooking";
import { GetAvailabilityUseCase } from "../application/use-cases/booking/GetAvailability";
import { GetBookingByIdUseCase } from "../application/use-cases/booking/GetBookingById";
import { GetBookingsUseCase } from "../application/use-cases/booking/GetBookings";
import { UpdateBookingStatusUseCase } from "../application/use-cases/booking/UpdateBookingStatus";
import { TrackBookingUseCase } from "../application/use-cases/booking/TrackBooking";
import { SyncBookingCalendarUseCase } from "../application/use-cases/booking/SyncBookingCalendar";

// ── Interface — Controllers ────────────────────────────────────────────────
import { AuthController } from "../interface/controllers/auth.controller";
import { ChivasController } from "../interface/controllers/chivas.controller";
import { TravelsController } from "../interface/controllers/travels.controller";
import { BookingsController } from "../interface/controllers/bookings.controller";
import { UploadsController } from "../interface/controllers/uploads.controller";

// ── Instancias de repositorios y servicios ─────────────────────────────────
const chivaRepository = new ChivaRepository();
const bookingRepository = new BookingRepository();
const travelRepository = new TravelRepository();
const userRepository = new UserRepository();
const customerRepository = new CustomerRepository();
const jwtService = new JwtService();
const emailService = new EmailResendService();
// const whatsAppService = new WhatsAppTwilioService();
const notificationService = new NotificationService(emailService);
const imageStorage = new CloudinaryImageStorage();
const calendarService = new GoogleCalendarService();

// ── Casos de uso ───────────────────────────────────────────────────────────
const loginUseCase = new LoginUseCase(userRepository, jwtService);
const getChivasUseCase = new GetChivasUseCase(chivaRepository);
const getChivaByIdUseCase = new GetChivaByIdUseCase(chivaRepository);
const createChivaUseCase = new CreateChivaUseCase(chivaRepository);
const updateChivaUseCase = new UpdateChivaUseCase(chivaRepository);
const updateChivaStatusUseCase = new UpdateChivaStatusUseCase(chivaRepository);
const deleteChivaUseCase = new DeleteChivaUseCase(chivaRepository, bookingRepository);
const getTravelsUseCase = new GetTravelsUseCase(travelRepository);
const createBookingUseCase = new CreateBookingUseCase(
  bookingRepository,
  chivaRepository,
  travelRepository,
  notificationService,
  customerRepository
);
const getAvailabilityUseCase = new GetAvailabilityUseCase(bookingRepository, chivaRepository);
const getBookingByIdUseCase = new GetBookingByIdUseCase(bookingRepository);
const getBookingsUseCase = new GetBookingsUseCase(
  bookingRepository,
  chivaRepository,
  travelRepository
);
const updateBookingStatusUseCase = new UpdateBookingStatusUseCase(
  bookingRepository,
  notificationService,
  calendarService,
  chivaRepository,
  travelRepository
);
const trackBookingUseCase = new TrackBookingUseCase(
  bookingRepository,
  chivaRepository,
  travelRepository
);
const syncBookingCalendarUseCase = new SyncBookingCalendarUseCase(
  bookingRepository,
  calendarService,
  chivaRepository,
  travelRepository
);

// ── Controladores ──────────────────────────────────────────────────────────
export const authController = new AuthController(loginUseCase);
export const chivasController = new ChivasController(
  getChivasUseCase,
  getChivaByIdUseCase,
  updateChivaUseCase,
  updateChivaStatusUseCase,
  createChivaUseCase,
  deleteChivaUseCase
);
export const travelsController = new TravelsController(getTravelsUseCase);
export const bookingsController = new BookingsController(
  createBookingUseCase,
  getAvailabilityUseCase,
  getBookingByIdUseCase,
  updateBookingStatusUseCase,
  getBookingsUseCase,
  trackBookingUseCase,
  syncBookingCalendarUseCase
);
export const uploadsController = new UploadsController(imageStorage);

// Exportamos el jwtService para usarlo en los routers que necesitan auth
export { jwtService };
