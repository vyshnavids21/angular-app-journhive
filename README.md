<div align="center">

# 🐝 JournHive

### Your travels, beautifully journaled.

JournHive is a full-stack travel journaling platform where wanderers capture trips as photo-rich stories — then revisit, refine, and export them as polished PDFs.

[![Angular](https://img.shields.io/badge/Angular-14-DD0031?logo=angular&logoColor=white)](https://angular.io/)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-Media-3448C5?logo=cloudinary&logoColor=white)](https://cloudinary.com/)
[![JWT](https://img.shields.io/badge/Auth-JWT-000000?logo=jsonwebtokens&logoColor=white)](https://jwt.io/)

**[🌐 Live Demo](https://journhive-33.vercel.app)** · [Highlights](#-highlights) · [Tech Stack](#-tech-stack) · [API](#-api-reference)

</div>

---

## ✨ Overview

JournHive turns scattered travel memories into a structured, shareable journal. Users create a **trip**, populate it with captioned **journal entries** and photos, and export the result as a clean **PDF keepsake** — all behind secure, token-based authentication.

It's built as a production-style two-tier application with a clear separation between an **Angular SPA** and a **stateless REST API**, deployed across **Vercel** (frontend) and **Render** (backend) with **MongoDB Atlas** and **Cloudinary** as managed services.

## 🎯 Highlights

What this project demonstrates from an engineering standpoint:

- 🔐 **Secure authentication** — JWT-based sessions, `bcrypt`-hashed passwords, and route guards on both the client (Angular `AuthGuard` + HTTP interceptor) and server (Express middleware).
- 📧 **Real-world password recovery** — hashed, time-limited reset tokens with a pluggable email layer that gracefully falls back across **Gmail SMTP → Resend → Ethereal** depending on what's configured.
- ☁️ **Cloud media pipeline** — direct image uploads to Cloudinary via `multer` storage, keeping the API stateless and deploy-friendly.
- 📄 **Client-side PDF generation** — journal entries exported to PDF in-browser with `jsPDF`.
- 🧱 **Clean RESTful API** — resource-oriented endpoints for users, trips, and posts with consistent status codes and error handling.
- 🚀 **Cloud-native deployment** — independently deployed frontend and backend wired together through environment-based configuration and a CORS allowlist.

## 🛠 Tech Stack

| Layer | Technologies |
| ----- | ------------ |
| **Frontend** | Angular 14 · Angular Material & CDK · RxJS · ngx-toastr · SweetAlert2 · jsPDF |
| **Backend** | Node.js 22 · Express 5 · Mongoose 8 |
| **Database** | MongoDB (Atlas) |
| **Media** | Cloudinary + `multer-storage-cloudinary` |
| **Auth** | JSON Web Tokens · bcrypt |
| **Email** | Nodemailer (SMTP / Ethereal) · Resend |
| **Deployment** | Vercel (client) · Render (API) |

## 🏗 Architecture

```
┌─────────────────┐        REST / JWT         ┌──────────────────┐
│  Angular SPA    │  ───────────────────────▶ │  Express API     │
│  (Vercel)       │  ◀─────────────────────── │  (Render)        │
└─────────────────┘                            └────────┬─────────┘
                                                        │
                              ┌──────────────┬──────────┴──────────┐
                              ▼              ▼                     ▼
                        ┌──────────┐  ┌────────────┐       ┌──────────────┐
                        │ MongoDB  │  │ Cloudinary │       │ Email (SMTP/ │
                        │  Atlas   │  │  (images)  │       │   Resend)    │
                        └──────────┘  └────────────┘       └──────────────┘
```

```
journhive/
├── client/                     # Angular frontend
│   └── src/app/
│       ├── auth/               # signup, login, forgot/reset password, guard & interceptor
│       ├── posts/              # post list, post create/edit, header
│       ├── trip-create/        # create / edit a trip
│       ├── trip-dashboard/     # a user's trips at a glance
│       └── services/           # posts service, PDF download service
└── server/                     # Express REST API
    ├── models/                 # Mongoose schemas: user, trip, post
    ├── middleware/auth.js       # JWT verification
    ├── utils/mailer.js          # multi-provider password-reset email
    ├── scripts/                # backup / restore / reset-link helpers
    └── server.js               # app entry point & routes
```

## 🚀 Getting Started

### Prerequisites

- Node.js **22.x**
- A MongoDB connection string (local or Atlas)
- A Cloudinary account (for image uploads)

### 1. Backend

```bash
cd server
npm install
```

Create a `.env` file in `server/`:

```env
# Server
PORT=3200
FRONTEND_URL=http://localhost:4300

# Database
MONGO_URI=mongodb://localhost:27017/journhive

# Auth
JWT_SECRET=your-strong-secret
JWT_EXPIRES_IN=30d

# Cloudinary (image storage)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email — optional in dev (falls back to an Ethereal test inbox).
# Gmail SMTP (App Password):
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=your-app-password
MAIL_FROM=JournHive <you@gmail.com>
# …or Resend:
RESEND_API_KEY=your-resend-key
```

```bash
npm run dev     # nodemon with auto-reload
# or
npm start       # plain node
```

> 💡 With no email provider configured, reset emails route to a free [Ethereal](https://ethereal.email) inbox and a preview URL is printed to the console — zero setup required for local dev.

The API listens on `http://localhost:3200`.

### 2. Frontend

```bash
cd client
npm install
npm start       # ng serve
```

The app runs at `http://localhost:4200`. The API base URL lives in
`client/src/environments/environment.ts` (local) and `environment.prod.ts` (production).

## 📡 API Reference

All routes are prefixed with `/api`. Routes marked 🔒 require an `Authorization: Bearer <token>` header.

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| `POST` | `/api/users` | Sign up |
| `POST` | `/api/login` | Log in |
| `POST` | `/api/forgot-password` | Request a password-reset email |
| `POST` | `/api/reset-password` | Set a new password using a token |
| `POST` | `/api/trips` 🔒 | Create a trip |
| `GET` | `/api/trips/creator/:id` 🔒 | List a user's trips |
| `GET` | `/api/trips/:id` 🔒 | Get a trip |
| `PUT` | `/api/trips/:id` 🔒 | Update a trip |
| `DELETE` | `/api/trips/:tripId` 🔒 | Delete a trip |
| `POST` | `/api/posts` 🔒 | Create a post |
| `GET` | `/api/posts/creator/:id` 🔒 | List a user's posts |
| `GET` | `/api/posts/trip/:tripId` 🔒 | List posts for a trip |
| `GET` | `/api/posts/:id` 🔒 | Get a post |
| `PUT` | `/api/posts/:id` 🔒 | Update a post |
| `DELETE` | `/api/posts/:id` 🔒 | Delete a post |

## 📜 Scripts

**Server** (`server/`)

| Command | Description |
| ------- | ----------- |
| `npm start` | Start the API with Node |
| `npm run dev` | Start with nodemon (auto-reload) |
| `npm run backup` | Back up the database |
| `npm run restore` | Restore the database from a backup |

**Client** (`client/`)

| Command | Description |
| ------- | ----------- |
| `npm start` | Run the dev server (`ng serve`) |
| `npm run build` | Production build |
| `npm test` | Run unit tests (Karma / Jasmine) |

## ☁️ Deployment

- **Frontend** → Vercel (`client/vercel.json`)
- **Backend** → Render — the production client targets `https://journhive-server.onrender.com`

---

<div align="center">

Built with ☕ and a love for travel.

</div>
