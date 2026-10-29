# Chivas Rumberas La 80 API — Backend

<div align="center">

  <img src="assets/icons/logo-chiva-ia.svg" alt="Logo Chivas Rumberas Booking" width="200">

  <p>
    <a href="#" target="_blank">Chivas Rumberas La 80</a>
  </p>

</div>

API REST modular para la gestión del catálogo de chivas rumberas, recorridos turísticos y sistema integral de reservas con validaciones de disponibilidad en tiempo real y notificaciones automáticas por correo electrónico.

Construida con **Node.js**, **Express**, **TypeScript** y **Prisma ORM**, aplicando los principios de **Arquitectura Hexagonal (Puertos y Adaptadores)** y **Diseño Guiado por el Dominio (DDD)**.

---

## 📑 Tabla de Contenidos

- [Características Principales](#-características-principales)
- [Stack Tecnológico](#-stack-tecnológico)
- [Arquitectura del Proyecto](#-arquitectura-del-proyecto)
- [Estructura del Código](#-estructura-del-código)
- [Uso de Inteligencia Artificial](#-uso-de-inteligencia-artificial)
- [Scripts del Proyecto](#-scripts-del-proyecto)
- [Reglas de Negocio](#-reglas-de-negocio)
- [Documentación de la API](#-documentación-de-la-api)
  - [Formato de Errores](#formato-estándar-de-errores)
  - [Salud (Health)](#1-salud-del-servidor)
  - [Autenticación (Auth)](#2-autenticación)
  - [Chivas](#3-chivas)
  - [Recorridos (Travels)](#4-recorridos-travels)
  - [Reservas (Bookings)](#5-reservas-bookings)
- [Colección de Pruebas (Bruno)](#-colección-de-pruebas-bruno)

---

## Uso de Inteligencia Artificial

Durante el desarrollo de este proyecto me apoyé en herramientas de inteligencia artificial principalmente para implementar y revisar la lógica de los middlewares. Sin embargo, en gran medida intenté realizar el desarrollo por mi cuenta, tomando las decisiones de arquitectura, lógica de negocio e integración de manera independiente.

---

## Características Principales

- **Gestión de Catálogo**: Consulta de chivas y recorridos disponibles con sus características y capacidades.
- **Sistema de Disponibilidad en Tiempo Real**: Cálculo dinámico de franjas horarias ocupadas por fecha para alimentar calendarios en el frontend.
- **Motor de Reservas con Validación de Conflictos**: Evita solapamientos entre eventos en una misma chiva y fecha.
- **Value Objects y Validación de Dominio**: Control estricto de anticipación mínima (24h), capacidad de pasajeros y formato horario.
- **Notificaciones Transaccionales**: Envío de correos de confirmación al cliente y alertas al administrador mediante **Resend**.
- **Autenticación y Autorización**: Protección de rutas operativas mediante tokens **JWT** y hashing de contraseñas con **Bcrypt**.

---

## Stack Tecnológico

| Componente | Tecnología |
| :--- | :--- |
| **Runtime** | [Node.js](https://nodejs.org/) (v18+) |
| **Lenguaje** | [TypeScript](https://www.typescriptlang.org/) v6 |
| **Framework Web** | [Express](https://expressjs.com/) v5 |
| **Base de Datos** | [PostgreSQL](https://www.postgresql.org/) en [Neon Serverless](https://neon.tech/) |
| **ORM** | [Prisma](https://www.prisma.io/) v5 |
| **Autenticación** | [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) & [bcrypt](https://github.com/kelektiv/node.bcrypt.js) |
| **Notificaciones** | [Resend](https://resend.com/) (Email) / [Twilio](https://www.twilio.com/) (WhatsApp opcional) |
| **Ejecución en Dev** | [tsx](https://github.com/privatenumber/tsx) |
| **Pruebas de API** | [Bruno](https://www.usebruno.com/) (Colección YAML incluida) |

---

## Arquitectura del Proyecto

El proyecto sigue una **Clean Architecture** desacoplando la lógica de negocio de los detalles de infraestructura:

```
           ┌─────────────────────────────────────────┐
           │             Interface (HTTP)            │
           │  Controllers, Routers, Middlewares      │
           └───────────────────┬─────────────────────┘
                               │ usa
                               ▼
           ┌─────────────────────────────────────────┐
           │               Application               │
           │  Use Cases, DTOs, Ports (Interfaces)    │
           └───────────────────┬─────────────────────┘
                               │ usa
                               ▼
           ┌─────────────────────────────────────────┐
           │                 Domain                  │
           │  Entities, Value Objects, Domain Errors │
           └───────────────────▲─────────────────────┘
                               │ implementa
           ┌───────────────────┴─────────────────────┐
           │             Infrastructure              │
           │  Prisma Repositories, Resend, JWT, DB   │
           └─────────────────────────────────────────┘
```

1. **Domain**: El núcleo puro de la aplicación. No depende de frameworks ni librerías externas. Contiene entidades, Value Objects (`EventDate`, `TimeSlot`, `GuestCount`), interfaces de repositorios y errores de dominio.
2. **Application**: Casos de uso específicos del sistema (`CreateBooking`, `GetAvailability`, `Login`, etc.), contratos de puertos y DTOs (Data Transfer Objects).
3. **Infrastructure**: Implementaciones concretas de los puertos y repositorios (Prisma Client, Neon PostgreSQL, servicio de emails con Resend).
4. **Interface**: Adaptador primario web con Express: controladores, definición de rutas, middlewares y contenedor de inyección de dependencias (`container.ts`).

---

## Estructura del Código

```text
chivas-rumberas-backend/
├── application/
│   ├── dtos/                # DTOs de entrada y salida
│   ├── ports/               # Interfaces de servicios externos (Email, JWT, WhatsApp)
│   └── use-cases/           # Lógica orquestadora de casos de uso por entidad
├── chivas-rumberas-endpoints/ # Colección de peticiones HTTP para Bruno
├── domain/
│   ├── errors/              # Errores específicos de negocio y autenticación
│   ├── models/              # Modelos y entidades de dominio
│   ├── repositories/        # Interfaces de repositorios (contratos)
│   ├── utils/               # Generador de códigos de reserva (CR-XXXXX) y slugs
│   └── value-objects/       # Value Objects (EventDate, TimeSlot, GuestCount)
├── infrastructure/
│   ├── database/            # Instancia singleton de Prisma Client
│   ├── repositories/        # Implementaciones de repositorios con Prisma
│   └── services/            # Clases adaptadoras (Resend, JWT, Twilio, plantillas HTML)
├── interface/
│   ├── controllers/         # Controladores HTTP de Express
│   ├── middlewares/         # Middleware de JWT y manejo global de errores
│   ├── routes/              # Definición de rutas Express
│   ├── app.ts               # Configuración de Express y middlewares
│   ├── container.ts         # Contenedor de Inyección de Dependencias
│   └── server.ts            # Punto de entrada y arranque del servidor
├── prisma/
│   └── schema.prisma        # Esquema de base de datos y modelos relacionales
├── .env.example             # Plantilla de variables de entorno
├── package.json             # Dependencias y scripts
└── tsconfig.json            # Configuración del compilador TypeScript
```

---

## Reglas de Negocio

El sistema aplica las siguientes reglas de negocio automáticamente:

- **Anticipación mínima**: Las reservas deben solicitarse con al menos **24 horas de anticipación**. No se permiten fechas pasadas.
- **Capacidad de invitados**: El número de personas (`guestCount`) debe ser mayor a 0 y no puede superar la capacidad máxima de la chiva seleccionada.
- **Formato y Duración de Horario**: La hora de inicio debe tener formato de 24 horas `HH:mm` (ej: `18:00`), y la duración mínima es de 1 hora.
- **Cálculo de Precio**: `totalPrice = chiva.pricePerHour * durationHours`.
- **Detección de Solapamientos**: Si la chiva ya cuenta con una reserva activa (`pending` o `confirmed`) en una ventana de horario que colisione con el intervalo solicitado, se rechaza con error `409 Conflict`.
- **Transiciones de Estado de Reserva**:
  - `pending` ➔ `confirmed` | `cancelled`
  - `confirmed` ➔ `completed` | `cancelled`
  - Estados terminales: `cancelled` y `completed` no admiten cambios posteriores.
- **Notificaciones**: Al crearse una reserva se envían dos correos automáticos: confirmación al cliente con el código de reserva `CR-XXXXX` y alerta de nueva reserva al correo del administrador.

---

## Documentación de la API

La API responde y recibe datos en formato **JSON**.

### Formato Estándar de Errores

En caso de error, la respuesta mantiene una estructura uniforme:

```json
{
  "error": {
    "type": "BookingConflictError",
    "message": "La chiva \"la-coqueta-1954\" ya tiene una reserva el 2026-11-15 a las 18:00. Por favor elige otro horario."
  }
}
```

Códigos HTTP utilizados:
- `200 OK`: Consulta o actualización exitosa.
- `201 Created`: Creación exitosa de recurso.
- `400 Bad Request`: Parámetros faltantes o formatos inválidos.
- `401 Unauthorized`: Token no proporcionado, expirado o credenciales erróneas.
- `403 Forbidden`: Token no cuenta con permisos necesarios.
- `404 Not Found`: Chiva, recorrido o reserva inexistente.
- `409 Conflict`: Chiva en mantenimiento o solapamiento de horarios.
- `422 Unprocessable Entity`: Transición de estado no permitida.
- `500 Internal Server Error`: Error no controlado del servidor.

---

### 1. Salud del Servidor

#### `GET /health`
Verifica la disponibilidad y estado del servidor.

- **Acceso**: Público
- **Respuesta (200 OK)**:
```json
{
  "status": "ok",
  "timestamp": "2026-10-24T18:00:00.000Z"
}
```

---

### 2. Autenticación

#### `POST /auth/login`
Inicia sesión para administradores y operadores, retornando el Bearer Token JWT.

- **Acceso**: Público
- **Cuerpo de la petición (JSON)**:
```json
{
  "email": "admin@chivasrumberas.com",
  "password": "PasswordSeguro123"
}
```
- **Respuesta (200 OK)**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "f71cb8d7-8d85-4358-baf3-14a50cc03948",
    "email": "admin@chivasrumberas.com",
    "role": "admin"
  }
}
```
- **Errores posibles**: `401 Unauthorized` (`InvalidCredentialsError`).

---

### 3. Chivas

#### `GET /chivas`
Obtiene la lista de todas las chivas registradas, con filtro opcional por estado.

- **Acceso**: Público
- **Query Params**:
  - `status` *(opcional)*: `available` | `maintenance` | `retired`
- **Ejemplo**: `GET /chivas?status=available`
- **Respuesta (200 OK)**:
```json
[
  {
    "id": "la-coqueta-1954",
    "name": "La Coqueta",
    "description": "Chiva tradicional paisa equipada con sonido profesional y luces LED.",
    "capacity": 50,
    "imageUrls": [
      "https://example.com/images/coqueta-1.jpg",
      "https://example.com/images/coqueta-2.jpg"
    ],
    "pricePerHour": 280000,
    "status": "available",
    "features": [
      "Sonido profesional 4000W",
      "Luces robóticas",
      "Animador / DJ",
      "Parrilla para equipaje"
    ]
  }
]
```

---

#### `GET /chivas/:id`
Obtiene la información detallada de una chiva específica por su identificador.

- **Acceso**: Público
- **Parámetros de Ruta**:
  - `id`: Identificador de la chiva (slug o ID único).
- **Ejemplo**: `GET /chivas/la-coqueta-1954`
- **Respuesta (200 OK)**: Retorna el objeto `ChivaResponseDto` correspondiente.
- **Errores posibles**: `404 Not Found` (`ChivaNotFoundError`).

---

### 4. Recorridos (Travels)

#### `GET /travels`
Obtiene todos los recorridos turísticos y rumberos activos disponibles.

- **Acceso**: Público
- **Respuesta (200 OK)**:
```json
[
  {
    "id": "trv_alumbrados",
    "name": "Ruta Navideña y Alumbrados",
    "description": "Recorrido por los principales puntos iluminados y parques de la ciudad.",
    "durationHours": 4,
    "highlights": [
      "Río Medellín",
      "Parque Norte",
      "Avenida la Playa",
      "Parada para buñuelos y natilla"
    ]
  },
  {
    "id": "trv_miradores",
    "name": "Tour Miradores Nocturnos",
    "description": "Ruta panorámica de fiesta por los mejores miradores del valle.",
    "durationHours": 3,
    "highlights": [
      "Mirador Las Palmas",
      "Pueblito Paisa",
      "Parada de fotos panorámica"
    ]
  }
]
```

---

### 5. Reservas (Bookings)

#### `GET /bookings/availability`
Consulta la disponibilidad de una chiva en una fecha específica para bloquear horarios ocupados en el calendario de reservas del frontend.

- **Acceso**: Público
- **Query Params**:
  - `chivaId` *(requerido)*: ID de la chiva.
  - `date` *(requerido)*: Fecha en formato `YYYY-MM-DD`.
- **Ejemplo**: `GET /bookings/availability?chivaId=la-coqueta-1954&date=2026-11-20`
- **Respuesta (200 OK)**:
```json
{
  "chivaId": "la-coqueta-1954",
  "date": "2026-11-20",
  "occupiedSlots": [
    {
      "startTime": "18:00",
      "endTime": "22:00",
      "durationHours": 4
    }
  ],
  "isFullyBooked": false
}
```
- **Errores posibles**: `400 Bad Request` (si falta `chivaId` o `date`), `404 Not Found` (si la chiva no existe).

---

#### `POST /bookings`
Crea una nueva reserva de chiva rumbera. Realiza la validación de negocio, cálculo de precio y dispara las notificaciones por correo.

- **Acceso**: Público
- **Cuerpo de la petición (JSON)**:
```json
{
  "chivaId": "la-coqueta-1954",
  "travelId": "trv_alumbrados",
  "customerName": "Carolina Montoya",
  "customerEmail": "carolina.montoya@ejemplo.com",
  "customerPhone": "3001234567",
  "guestCount": 45,
  "eventDate": "2026-11-20",
  "startTime": "18:00",
  "durationHours": 4,
  "notes": "Celebración de cumpleaños de empresa."
}
```
- **Respuesta (201 Created)**:
```json
{
  "id": "CR-7X8M2P",
  "chivaId": "la-coqueta-1954",
  "chivaName": "La Coqueta",
  "travelId": "trv_alumbrados",
  "travelName": "Ruta Navideña y Alumbrados",
  "customerName": "Carolina Montoya",
  "customerEmail": "carolina.montoya@ejemplo.com",
  "customerPhone": "3001234567",
  "guestCount": 45,
  "eventDate": "2026-11-20",
  "startTime": "18:00",
  "endTime": "22:00",
  "durationHours": 4,
  "totalPrice": 1120000,
  "status": "pending",
  "notes": "Celebración de cumpleaños de empresa.",
  "createdAt": "2026-10-24T18:25:00.000Z"
}
```
- **Errores posibles**:
  - `400 Bad Request`: Formato de fecha u hora inválido, menos de 24 horas de anticipación o número de invitados superior a la capacidad.
  - `404 Not Found`: Chiva o recorrido no encontrado.
  - `409 Conflict`: Chiva en mantenimiento o colisión de horario con otra reserva (`BookingConflictError`).

---

#### `GET /bookings/:id`
Obtiene los detalles completos de una reserva específica para la gestión interna.

- **Acceso**: **Protegido** (Requiere header `Authorization: Bearer <TOKEN>`)
- **Parámetros de Ruta**:
  - `id`: Código de reserva (ej: `CR-7X8M2P`).
- **Respuesta (200 OK)**: Objeto `BookingResponseDto` correspondiente.
- **Errores posibles**: `401 Unauthorized`, `404 Not Found`.

---

#### `PATCH /bookings/:id/status`
Actualiza el estado operativo de una reserva (confirmar, cancelar o completar). Envía notificación al cliente cuando el estado es actualizado.

- **Acceso**: **Protegido** (Requiere header `Authorization: Bearer <TOKEN>`)
- **Parámetros de Ruta**:
  - `id`: Código de reserva (ej: `CR-7X8M2P`).
- **Cuerpo de la petición (JSON)**:
```json
{
  "status": "confirmed"
}
```
Valores aceptados según el estado actual:
- De `pending` ➔ `confirmed` o `cancelled`
- De `confirmed` ➔ `completed` o `cancelled`

- **Respuesta (200 OK)**: Objeto `BookingResponseDto` con el nuevo estado actualizado.
- **Errores posibles**:
  - `400 Bad Request`: Campo `status` no enviado.
  - `401 Unauthorized`: Token inválido o ausente.
  - `404 Not Found`: Reserva no encontrada.
  - `422 Unprocessable Entity`: Transición de estado inválida (`InvalidBookingStatusTransitionError`).

---

## 🧪 Colección de Pruebas (Bruno)

El proyecto incluye una colección completa de peticiones HTTP en el directorio [`chivas-rumberas-endpoints/`](./chivas-rumberas-endpoints/), lista para abrir con [Bruno](https://www.usebruno.com/):

1. Descarga e instala **Bruno**.
2. Selecciona **Open Collection** y abre la carpeta `chivas-rumberas-endpoints`.
3. Encontrarás peticiones preconfiguradas para:
   - `health.yml` (Health check)
   - `allChivas.yml` (Listar chivas)
   - `infoChivaById.yml` (Detalle de chiva)
   - `allTravels.yml` (Listar recorridos)
   - `availabilityByChivaId.yml` (Disponibilidad)
   - `createBooking.yml` (Creación de reserva)
   - `infoBooking.yml` (Consulta con token)
   - `updateStatus.yml` (Actualización de estado con token)

---

## Licencia

Este proyecto está bajo una licencia **Propietaria / Privada (Todos los derechos reservados)**.
El código fuente es visible públicamente de forma temporal únicamente para **fines de revisión académica y evaluación**. Queda expresamente prohibida su copia, reproducción, distribución, modificación o explotación comercial total o parcial sin autorización previa y por escrito del autor.
