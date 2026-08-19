# FuoLearn

A full-stack learning management platform for Federal University Otuoke.

Students browse courses, request enrollment, read materials, and take quizzes.
Professors manage courses, upload materials, and generate quizzes with AI.
Administrators approve accounts and manage the platform.

## Tech Stack

**Backend** — Node.js, Express 5, TypeScript 7, PostgreSQL, Gemini AI

**Frontend** — React 19, Vite 8, TypeScript 6, Tailwind CSS v4, React Router 7

## Prerequisites

- Node.js 20+
- PostgreSQL 15+
- A Google Gemini API key (for AI quiz generation)

## Project Structure

```
fuolearn/
├── backend/
│   ├── src/
│   │   ├── config/          # Environment and OpenAPI config
│   │   ├── infrastructure/  # Database, storage, Gemini clients
│   │   ├── middleware/       # Auth, authorization, validation, error handling
│   │   ├── modules/         # Feature modules (auth, courses, enrollments, etc.)
│   │   └── shared/          # Errors, types, utilities
│   ├── tests/               # Unit tests
│   └── docs/                # Schema diagrams
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── hooks/           # React hooks (useAuth)
│   │   ├── lib/             # API client utilities
│   │   ├── pages/           # Route pages
│   │   ├── services/        # API service layer
│   │   └── types/           # TypeScript types
│   └── public/              # Static assets
└── docs/                    # Architecture diagrams (Mermaid)
```

## Setup

### 1. Clone and install

```bash
git clone https://github.com/thrila/fuo-learn.git
cd fuo-learn

# Backend
cd backend
cp .env.example .env
npm install

# Frontend
cd ../frontend
cp .env.example .env
npm install
```

### 2. Create the database

```sql
CREATE DATABASE fuolearn;
```

Then run the schema from `backend/docs/schema.mmd` or let the application
create the tables on first start (automatic table creation is handled in
the database infrastructure module).

### 3. Configure environment variables

**backend/.env**

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/fuolearn` |
| `JWT_SECRET` | Secret for signing JWTs (min 16 chars) | — |
| `GEMINI_API_KEY` | Google Gemini API key | — |
| `PORT` | Server port | `3000` |
| `UPLOAD_DIR` | Directory for uploaded files | `./uploads` |

**frontend/.env**

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:3000/api` |

### 4. Run the applications

Open two terminals:

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

The backend runs at `http://localhost:3000`.
The frontend runs at `http://localhost:5173` and proxies API requests to the backend.

## Default Admin Account

After the backend starts, an admin account is automatically seeded.

Check `backend/password.txt` for the seeded credentials, or look at
the console output on first start.

## Usage

### Register and get approved

1. Open `http://localhost:5173/register`
2. Create an account as a student or professor
3. The account starts as **pending**
4. An admin must approve the account before the user can log in

### Admin workflow

1. Log in at `/login`
2. Go to **Admin > Users** (`/admin/users`) to approve or disable accounts
3. Go to **Admin > Courses** (`/admin/courses`) to create and manage courses

### Professor workflow

1. Log in
2. Go to **My Courses** to see assigned courses
3. **Upload materials** (PDF, PPT, PPTX) to a course
4. **Generate quizzes** from uploaded materials using AI, or create them manually
5. **Review and publish** quizzes after verifying the AI-generated questions
6. **Approve student enrollment** requests

### Student workflow

1. Log in
2. Browse the **Course Catalogue** (`/courses`)
3. **Request enrollment** in a course
4. Once approved by the professor, access **materials** and **quizzes**
5. **Take quizzes** and view results with explanations
6. Track your **progress** over time

## API Reference

The backend exposes a REST API. A live interactive API reference is
available at `http://localhost:3000/api/docs` (Scalar UI) when the
backend is running.

The raw OpenAPI spec is at `http://localhost:3000/api/openapi.json`.

### Key Endpoints

**Auth**

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/register` | Create account |
| `POST` | `/api/auth/login` | Log in, receive JWT |
| `GET` | `/api/auth/users` | List users (admin) |
| `PATCH` | `/api/auth/users/:id/approve` | Approve user (admin) |

**Courses**

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/courses` | List all courses |
| `POST` | `/api/courses` | Create course (admin) |
| `GET` | `/api/courses/:id` | Get course details |

**Enrollments**

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/courses/:id/enroll` | Request enrollment (student) |
| `GET` | `/api/enrollments/mine` | My enrollments (student) |
| `PATCH` | `/api/enrollments/:id/status` | Approve/reject (professor) |

**Materials**

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/courses/:id/materials` | List materials for course |
| `POST` | `/api/courses/:id/materials` | Upload material (professor) |
| `GET` | `/api/materials/:id/file` | Download material file |

**Quizzes**

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/courses/:id/quizzes` | List quizzes for course |
| `POST` | `/api/quizzes` | Create quiz (professor) |
| `POST` | `/api/quizzes/:id/publish` | Publish quiz (professor) |
| `POST` | `/api/materials/:id/generate-quiz` | Generate quiz with AI (professor) |

**Quiz Attempts**

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/quizzes/:id/attempts` | Start a quiz attempt (student) |
| `POST` | `/api/attempts/:id/submit` | Submit answers (student) |
| `GET` | `/api/attempts/:id` | View attempt results |

### Authentication

All protected endpoints require a JWT in the `Authorization` header:

```
Authorization: Bearer <token>
```

Tokens are returned by `POST /api/auth/login` and contain `{ id, email, role }`.

## Running Tests

```bash
cd backend
npm test          # Run once
npm run test:watch # Watch mode
```

Tests cover auth, courses, enrollments, materials, quizzes, quiz generation,
and quiz attempts. They focus on business rules rather than framework wiring.

## Architecture

The backend follows a layered architecture:

```
HTTP Request
  → Route
    → Middleware (auth, validation)
      → Controller
        → Manager (orchestration)
          → Service (business rules)
            → Repository (data access)
              → PostgreSQL
```

Each module (`auth`, `courses`, `enrollments`, `materials`, `quizzes`,
`quiz-attempts`) follows this pattern. External services (Gemini, file
storage) are isolated behind factories and clients in `infrastructure/`.

See the `docs/` directory for Mermaid diagrams covering the architecture,
auth flow, enrollment flow, quiz lifecycle, and request lifecycle.

## Frontend Routes

| Route | Page | Access |
|-------|------|--------|
| `/login` | Login | Public |
| `/register` | Register | Public |
| `/dashboard` | Dashboard | Any authenticated user |
| `/courses` | Course catalogue | Any authenticated user |
| `/courses/:id` | Course details | Any authenticated user |
| `/my-courses` | My enrolled courses | Student |
| `/progress` | Quiz results and scores | Student |
| `/admin/users` | User management | Admin |
| `/admin/courses` | Course management | Admin |
| `/profile` | User profile | Any authenticated user |

## License

ISC
