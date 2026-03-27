# InsightLab — Usability Testing Platform

A full-stack, open-source usability testing platform built with **React + Vite**, **Django REST Framework**, and **PostgreSQL**. Create studies, collect participant recordings, analyse results, and share reports — all in one place.

---

## Tech Stack

| Layer     | Technology                                      |
|-----------|-------------------------------------------------|
| Frontend  | React 18, Vite, Tailwind CSS, Zustand, Recharts, @dnd-kit |
| Backend   | Python 3.12, Django 5, Django REST Framework    |
| Auth      | JWT via `djangorestframework-simplejwt`         |
| Database  | PostgreSQL 16                                   |
| Storage   | Local filesystem (dev) / AWS S3 (production)   |
| Container | Docker + Docker Compose                         |

---

## Project Structure

```
usability-platform/
├── frontend/                   # React + Vite app
│   ├── src/
│   │   ├── pages/              # Route-level pages
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── StudyBuilderPage.jsx
│   │   │   ├── StudyResultsPage.jsx
│   │   │   ├── ParticipantPage.jsx
│   │   │   └── ReportPage.jsx
│   │   ├── components/
│   │   │   ├── builder/        # Study builder UI
│   │   │   │   ├── BuilderHeader.jsx
│   │   │   │   ├── BuilderSidebar.jsx
│   │   │   │   ├── BuilderCanvas.jsx   # DnD block list
│   │   │   │   ├── BuilderPanel.jsx    # Right config panel
│   │   │   │   ├── PreviewModal.jsx
│   │   │   │   └── editors/    # Per-block editors
│   │   │   │       ├── IntroEditor.jsx
│   │   │   │       ├── ContextEditor.jsx
│   │   │   │       ├── TaskEditor.jsx
│   │   │   │       ├── QuestionEditor.jsx
│   │   │   │       ├── ThankyouEditor.jsx
│   │   │   │       └── VariantEditor.jsx
│   │   │   └── participant/    # Participant test flow
│   │   │       ├── ConsentScreen.jsx
│   │   │       ├── BlockRenderer.jsx
│   │   │       └── blocks/
│   │   │           ├── IntroBlock.jsx
│   │   │           ├── ContextBlock.jsx
│   │   │           ├── TaskBlock.jsx
│   │   │           ├── QuestionBlock.jsx
│   │   │           ├── ThankyouBlock.jsx
│   │   │           └── VariantBlock.jsx
│   │   ├── store/
│   │   │   ├── authStore.js    # Zustand auth (JWT)
│   │   │   └── builderStore.js # Zustand builder state
│   │   ├── utils/
│   │   │   ├── api.js          # Axios + auth interceptor
│   │   │   └── constants.js    # Block types, question types
│   │   └── styles/globals.css
│   ├── vite.config.js
│   └── tailwind.config.js
│
└── backend/
    ├── manage.py
    ├── requirements.txt
    ├── Dockerfile
    └── insightlab/
        ├── settings/base.py
        ├── urls.py
        ├── wsgi.py
        └── apps/
            ├── accounts/       # Custom User model + JWT auth
            ├── studies/        # Study, Block, MediaAsset models
            ├── participants/   # Session, Response, Heatmap, Recording
            └── analytics/      # Aggregation views + report
```

---

## Quick Start (Docker — Recommended)

### 1. Clone & configure

```bash
git clone <your-repo>
cd usability-platform

# Backend env
cp backend/.env.example backend/.env
# Edit backend/.env — at minimum change SECRET_KEY

# Frontend env (optional for Docker)
cp frontend/.env.example frontend/.env
```

### 2. Start everything

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api/
- API Docs (Swagger): http://localhost:5000/api/docs/
- Django Admin: http://localhost:5000/admin/

### 3. Create a superuser (optional)

```bash
docker compose exec backend python manage.py createsuperuser
```

---

## Manual Setup (without Docker)

### Prerequisites

- Python 3.12+
- Node.js 20+
- PostgreSQL 16 running locally

### Backend

```bash
cd backend

# Create virtualenv
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your DB credentials

# Run migrations
python manage.py migrate

# Create admin user
python manage.py createsuperuser

# Start server (port 5000)
python manage.py runserver 5000
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server (port 3000, proxies /api → :5000)
npm run dev
```

Open http://localhost:3000

---

## Database Schema

### Core tables

```
users                   Custom auth user (email, name, role)
studies                 Study metadata (title, status, device_target, participant_token)
blocks                  Study blocks (type, order, content JSON, media_assets JSON)
media_assets            Uploaded files linked to studies/blocks

participant_sessions    One row per participant run (device info, consent, progress)
block_responses         One answer per block per session
heatmap_events          Click/scroll/tap events (x, y, element, timestamp_offset)
recording_chunks        Uploaded video/audio blob references
```

### Key relationships

```
User         ──< Study         (owner)
Study        ──< Block         (ordered)
Study        ──< ParticipantSession
Study        ──< MediaAsset
Block        ──< BlockResponse
Block        ──< HeatmapEvent
ParticipantSession ──< BlockResponse
ParticipantSession ──< HeatmapEvent
ParticipantSession ──< RecordingChunk
```

---

## API Reference

All authenticated endpoints require:
```
Authorization: Bearer <access_token>
```

### Auth  `/api/auth/`

| Method | Path         | Auth | Description              |
|--------|--------------|------|--------------------------|
| POST   | `register/`  | No   | Create account           |
| POST   | `login/`     | No   | Get JWT tokens           |
| POST   | `logout/`    | Yes  | Blacklist refresh token  |
| GET    | `me/`        | Yes  | Get current user         |
| PATCH  | `me/`        | Yes  | Update profile           |

**Register / Login response:**
```json
{
  "token": "<access_jwt>",
  "refresh": "<refresh_jwt>",
  "user": { "id": "...", "email": "...", "name": "...", "role": "researcher" }
}
```

---

### Studies  `/api/studies/`

| Method | Path                              | Auth | Description              |
|--------|-----------------------------------|------|--------------------------|
| GET    | ``                                | Yes  | List your studies        |
| POST   | ``                                | Yes  | Create study             |
| GET    | `<id>/`                           | Yes  | Get study + blocks       |
| PUT    | `<id>/`                           | Yes  | Update study + blocks    |
| DELETE | `<id>/`                           | Yes  | Delete study             |
| POST   | `<id>/publish/`                   | Yes  | Publish → get share link |
| POST   | `<id>/unpublish/`                 | Yes  | Unpublish                |
| POST   | `<id>/duplicate/`                 | Yes  | Duplicate study          |
| POST   | `<id>/blocks/`                    | Yes  | Add a block              |
| POST   | `<id>/blocks/reorder/`            | Yes  | Reorder blocks           |
| PUT    | `<id>/blocks/<block_id>/`         | Yes  | Update a block           |
| DELETE | `<id>/blocks/<block_id>/`         | Yes  | Delete a block           |
| POST   | `<id>/media/`                     | Yes  | Upload media (multipart) |
| GET    | `public/<participant_token>/`     | No   | Public study for participant |

**Publish response:**
```json
{
  "status": "published",
  "participantToken": "uuid",
  "participantUrl": "/t/uuid"
}
```

**Reorder blocks:**
```json
{ "order": ["block-uuid-1", "block-uuid-2", "block-uuid-3"] }
```

---

### Participant Sessions  `/api/sessions/`

| Method | Path                                         | Auth | Description                  |
|--------|----------------------------------------------|------|------------------------------|
| POST   | `start/<participant_token>/`                 | No   | Start a session              |
| POST   | `<session_token>/consent/`                   | No   | Record consent               |
| POST   | `<session_token>/response/`                  | No   | Submit block response        |
| POST   | `<session_token>/complete/`                  | No   | Mark session complete        |
| POST   | `<session_token>/heatmap/`                   | No   | Batch heatmap events         |
| POST   | `<session_token>/recording/`                 | No   | Upload recording chunk       |
| GET    | `study/<study_id>/`                          | Yes  | List sessions (researcher)   |
| GET    | `study/<study_id>/session/<session_id>/`     | Yes  | Session detail               |
| GET    | `study/<study_id>/block/<block_id>/heatmap/` | Yes  | Heatmap data for a block     |

**Start session request:**
```json
{
  "device_type": "desktop",
  "browser": "Chrome",
  "os": "macOS",
  "screen_width": 1920,
  "screen_height": 1080,
  "user_agent": "Mozilla/5.0 ..."
}
```

**Start session response:**
```json
{
  "sessionId": "uuid",
  "sessionToken": "uuid",
  "variantAssigned": "Variant A"
}
```

**Consent request:**
```json
{
  "screen_recording": true,
  "camera": false,
  "audio": true
}
```

**Submit response request:**
```json
{
  "block_id": "uuid",
  "task_completed": true,
  "task_completion_status": "success",
  "answer": null,
  "time_spent_seconds": 42
}
```

**Heatmap batch request:**
```json
{
  "events": [
    {
      "block_id": "uuid",
      "event_type": "click",
      "x": 0.45,
      "y": 0.32,
      "element_selector": "button.add-to-cart",
      "element_text": "Add to cart",
      "timestamp_offset": 12.4
    }
  ]
}
```

---

### Analytics  `/api/analytics/`

| Method | Path                          | Auth | Description                  |
|--------|-------------------------------|------|------------------------------|
| GET    | `<study_id>/`                 | Yes  | Study-level analytics        |
| GET    | `<study_id>/blocks/<block_id>/` | Yes | Per-block analytics        |
| GET    | `<study_id>/report/`          | Yes  | Full report summary          |

**Study analytics response:**
```json
{
  "total_sessions": 42,
  "completed_sessions": 35,
  "completion_rate": 83.3,
  "avg_duration_seconds": 312,
  "drop_off_by_block": [...],
  "device_breakdown": [{"device_type": "desktop", "count": 28}],
  "variant_breakdown": [...],
  "daily_responses": [{"date": "2025-01-15", "count": 5}]
}
```

---

## Block Type Reference

Every block has a `type` field and a `content` JSON object.

### `intro`
```json
{
  "title": "Welcome",
  "description": "Thank you for participating.",
  "researcherNote": "Internal note",
  "mediaUrl": null,
  "continueLabel": "Get started"
}
```

### `context`
```json
{
  "scenarioText": "Imagine you are...",
  "mediaUrl": null,
  "deviceInstructions": "Please use your phone",
  "continueLabel": "Continue"
}
```

### `task`
```json
{
  "taskTitle": "Find the pricing page",
  "instructions": "Navigate to pricing and choose a plan.",
  "taskType": "website",
  "embedUrl": "https://example.com",
  "successCriteria": "Reaches /pricing",
  "timeLimit": 120,
  "followUpQuestions": []
}
```

### `question` / `followup`
```json
{
  "questionText": "How easy was that?",
  "questionType": "rating",
  "options": [],
  "required": true,
  "scale": { "min": 1, "max": 5, "minLabel": "Very hard", "maxLabel": "Very easy" }
}
```

**Supported `questionType` values:**
`open_text` · `multiple_choice` · `single_choice` · `rating` · `opinion` · `yes_no` · `ranking` · `nps`

### `thankyou`
```json
{
  "title": "Thank you!",
  "message": "Your responses have been recorded.",
  "nextSteps": "",
  "redirectUrl": "",
  "redirectLabel": ""
}
```

### `variant`
```json
{
  "variantName": "A/B Test",
  "assignmentMethod": "random",
  "variants": [
    { "id": "uuid", "name": "Variant A", "embedUrl": "https://v1.example.com", "description": "" },
    { "id": "uuid", "name": "Variant B", "embedUrl": "https://v2.example.com", "description": "" }
  ]
}
```

---

## Researcher Flow

1. Register / log in at `/`
2. Click **New study** on the dashboard
3. Select device target in the left sidebar
4. Add blocks by clicking block types in the sidebar
5. Click any block to edit its content in the right panel
6. Drag blocks to reorder them on the canvas
7. Click **Preview** to test the participant experience
8. Click **Publish** to generate a shareable link
9. Share `/t/<token>` with participants
10. View results at `/studies/<id>/results`
11. Share a report at `/studies/<id>/report`

## Participant Flow

1. Open `/t/<token>` — study loads automatically
2. Read the intro screen
3. Grant consent for recordings
4. Read context screen
5. Complete tasks (embedded in-page or via new tab)
6. Answer questions and follow-ups
7. Reach the thank-you screen

---

## Environment Variables

### Backend (`backend/.env`)

| Variable                | Default        | Description                       |
|-------------------------|----------------|-----------------------------------|
| `SECRET_KEY`            | (insecure)     | Django secret key — **change this** |
| `DEBUG`                 | `True`         | Set to `False` in production      |
| `ALLOWED_HOSTS`         | `localhost,...`| Comma-separated allowed hosts     |
| `DB_NAME`               | `insightlab`   | PostgreSQL database name          |
| `DB_USER`               | `postgres`     | PostgreSQL user                   |
| `DB_PASSWORD`           | `postgres`     | PostgreSQL password               |
| `DB_HOST`               | `localhost`    | PostgreSQL host                   |
| `DB_PORT`               | `5432`         | PostgreSQL port                   |
| `CORS_ALLOWED_ORIGINS`  | `http://localhost:3000` | Allowed frontend origins |
| `USE_S3`                | `False`        | Set `True` to use S3 for uploads  |
| `AWS_ACCESS_KEY_ID`     | —              | S3 credentials (if `USE_S3=True`) |
| `AWS_SECRET_ACCESS_KEY` | —              | S3 credentials                    |
| `AWS_STORAGE_BUCKET_NAME` | —            | S3 bucket name                    |

---

## Production Checklist

- [ ] Set `DEBUG=False` in `.env`
- [ ] Set a strong random `SECRET_KEY`
- [ ] Set `ALLOWED_HOSTS` to your domain
- [ ] Set `CORS_ALLOWED_ORIGINS` to your frontend domain
- [ ] Set `USE_S3=True` and configure AWS credentials
- [ ] Run `python manage.py collectstatic`
- [ ] Use HTTPS (Let's Encrypt / Cloudflare)
- [ ] Set up a process manager (gunicorn + systemd, or Docker)
- [ ] Configure database backups

---

## P1 Features (Next to Build)

The following features from the PRD are marked P1 (post-launch) and are **not yet implemented**:

- **Screen / camera / audio recording** — The consent UI and upload endpoints exist. The browser-side `MediaRecorder` API integration in `TaskBlock.jsx` needs to be added.
- **Heatmap visualisation overlay** — Heatmap data is stored and queryable. A canvas overlay renderer in the results dashboard needs to be built.
- **Advanced result filters** — Filter sessions by date range, device, variant.
- **CSV export** — `GET /api/analytics/<id>/export/` endpoint.
- **Team sharing / role invites** — Multi-user workspace support.
- **Recording timeline viewer** — Playback with task timestamps.

---

## License

MIT
