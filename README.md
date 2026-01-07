# Geofencing App

## Prerequisites
- Node.js
- Docker (for PostgreSQL)

## Setup

1. **Database**:
   Start PostgreSQL using Docker:
   ```bash
   cd backend
   docker-compose up -d
   ```

2. **Backend**:
   Install dependencies and start the server:
   ```bash
   cd backend
   npm install
   npm run start:dev
   ```
   The API will be available at `http://localhost:3000`.

3. **Frontend**:
   Install dependencies and start the development server:
   ```bash
   # From root directory
   npm install
   npm run dev
   ```
   The app will be available at `http://localhost:5173`.

## Features implemented
- **Multi-tenant Architecture**: Organizations, Users, Geofences.
- **Authentication**: Email/Password login, automatic Organization creation/joining based on email domain.
- **Dashboard**: Interactive map for geofencing (Leaflet).
- **Role-based Access**: Basic structure for Super User / Org Admin / End User.

## Notes
- The app uses a local PostgreSQL database. Ensure the container is running.
- Backend defaults to logical implementation of requirements.
