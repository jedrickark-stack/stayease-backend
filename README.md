# StayEase – Hotel Reservation System

## Project Description

StayEase is a backend-based Hotel Reservation System developed using NestJS, TypeScript, and MySQL. It provides REST API endpoints for managing users, room types, rooms, reservations, and payments.

The system helps organize hotel operations by providing secure access, reservation management, and role-based permissions for Admins and Guests.

## Technologies Used

- Node.js
- NestJS
- TypeScript
- MySQL
- TypeORM
- JWT Authentication
- Passport.js
- Postman
- XAMPP

## Main Features

- User Registration and Login
- JWT Authentication
- Role-Based Access Control
- User Management
- Room Type Management
- Room Management
- Reservation Management
- Payment Management
- Input Validation
- Password Hashing
- Guest Reservation Ownership

## API Endpoints

| Module | Endpoint |
|---|---|
| Authentication | `/api/v1/auth` |
| Users | `/api/v1/users` |
| Room Types | `/api/v1/room-types` |
| Rooms | `/api/v1/rooms` |
| Reservations | `/api/v1/reservations` |
| Payments | `/api/v1/payments` |

## Project Setup

Install dependencies:

```bash
npm install
```

Configure your database and environment variables in the `.env` file.

Make sure MySQL is running before starting the application.

## Running the Application

Development mode:

```bash
npm run start:dev
```

Production mode:

```bash
npm run start:prod
```

## API Testing

The REST API endpoints are tested using Postman.

## Project Status

Backend implementation and API testing completed.

## Developer

StayEase Hotel Reservation System