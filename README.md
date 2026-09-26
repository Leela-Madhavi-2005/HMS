# Hospital Management System

A full-stack hospital management application built with React, Vite, Express, MongoDB, and Socket.IO. The app includes role-based dashboards for patients, doctors, receptionists, and administrators, along with appointment booking, billing, prescriptions, patient management, and live notifications.

## Overview
This project provides a practical hospital workflow experience with:
- secure authentication and protected routes
- role-based access for different users
- appointment scheduling and status management
- doctor, patient, prescription, and billing operations
- realtime notification updates through Socket.IO

## Tech stack
### Frontend
- React 19
- Vite
- React Router
- Socket.IO client
- React Icons

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication
- Socket.IO
- CORS and dotenv

## Project structure
- [client](client) — Vite + React frontend
- [server](server) — Express + MongoDB backend
- [client/pages](client/pages) — dashboard and management pages
- [server/routes](server/routes) — API endpoints for appointments, bills, doctors, patients, prescriptions, and auth
- [server/models](server/models) — MongoDB schemas

## Prerequisites
- Node.js 18 or higher
- MongoDB running locally, or a MongoDB Atlas connection string

## Local setup
### 1) Clone and install dependencies
```bash
git clone <your-repo-url>
cd HospitalManagementSystem

cd client
npm install

cd ../server
npm install
```

### 2) Configure environment variables
Create environment files if they do not already exist.

Frontend:
```bash
cd ../client
cp .env.example .env
```

Backend:
```bash
cd ../server
cp .env.example .env
```

Example values:

Frontend .env
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

Backend .env
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/hms
JWT_SECRET=change_this_in_production
CORS_ORIGINS=http://localhost:5173
```

### 3) Start the app
Run the frontend:
```bash
cd client
npm run dev
```

Run the backend:
```bash
cd server
npm run dev
```

The frontend should be available at http://localhost:5173 and the backend at http://localhost:5000.


This will create sample accounts for local testing if needed. You can then sign in through the application using the normal login flow.

## Available features
- patient registration and profile management
- doctor directory and doctor-specific views
- appointment booking and status updates
- prescription creation and tracking
- billing and payment status management
- realtime notifications for key actions
- role-based dashboard views for admin, doctor, receptionist, and patient

## Build for production
Frontend build:
```bash
cd client
npm run build
```

## Deployment suggestions
- Frontend: Vercel, Netlify, or any static host
- Backend: Render, Railway, Fly.io, Azure App Service, or any Node.js host
- Database: MongoDB Atlas

## Production notes
- replace the demo secrets with strong production values
- set CORS_ORIGINS to your deployed frontend URL
- set VITE_API_URL and VITE_SOCKET_URL to your deployed backend URL
- ensure the backend can reach MongoDB in production
