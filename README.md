# laravel-firebase-sync

> **Open-Source Learning Blueprint**
> **Maintained by:** Jerald Jose (CodeMasterLYR)

A lightweight starter kit demonstrating real-time event bridging between a **Laravel 11 API backend** and a **Next.js frontend** using **Firebase Firestore Signals** (event act/trigger + secure REST fetch) and **Firebase Realtime Database (RTDB)**.

When an external system (POS, ERP, mobile app) calls the Laravel API, the backend dispatches a lightweight trigger signal to Firestore. Subscribed clients detect the signal in real time and automatically fetch the full, authenticated payload from the Laravel API endpoint.

---

## How It Works

```
External App / System (POS, ERP, KMP Mobile)
       │
       │  POST /api/events  (X-API-KEY header)
       ▼
Laravel 11 Backend
       │
       ├─► 1. Caches / stores full payload securely in backend
       │
       └─► 2. Emits lightweight trigger signal to Firestore
              { "transaction_id": "100192", "triggered_at": "...", "endpoint": "/api/events/alerts" }
                     │
                     ▼
             Firestore onSnapshot (< 100ms)
                     │
                     ▼
Next.js Frontend (useFirestoreSignal Hook)
       │
       └─► 3. Catches trigger signal, alerts UI, and executes API fetch
              GET /api/events/alerts ➔ Secure full data loaded and rendered!
```

---

## Features

- **Firestore Event Act / Signal Pattern** — sends only lightweight metadata (timestamp, ID, endpoint) through Firebase, keeping cloud DB usage minimal while preserving full data security in Laravel.
- **`FirebaseFirestoreService`** — Laravel service for emitting Firestore event triggers.
- **`useFirestoreSignal`** — React hook subscribing to Firestore signals and automatically triggering API data fetches.
- **`FirebaseRtdbService` & `useRtdbChannel`** — full RTDB direct streaming connector support.
- **`EventController`** — authenticated endpoints: `POST /api/events` (dispatch) & `GET /api/events/{channel}` (fetch).
- **`ValidateApiKey`** middleware — `X-API-KEY` server-to-server and mobile identification.
- **Multi-Platform CLI Examples** — one-click copyable snippets for Windows CMD (single-line, multi-line `^`), PowerShell, and Bash.

---

## Project Structure

```
laravel-firebase-sync/
├── backend/                           # Laravel 11 API
│   ├── app/
│   │   ├── Services/
│   │   │   └── FirebaseRtdbService.php    # Core RTDB write/push/delete
│   │   ├── Http/
│   │   │   ├── Controllers/Api/
│   │   │   │   └── EventController.php    # POST /api/events
│   │   │   └── Middleware/
│   │   │       ├── ValidateApiKey.php     # X-API-KEY server auth
│   │   │       └── ForceJsonResponse.php  # JSON-only responses
│   │   └── config/
│   │       └── services.php              # Firebase + API key config
│   ├── routes/api.php
│   └── .env.example
│
├── frontend/                          # Next.js 14 playground
│   └── src/
│       ├── lib/firebase.ts            # Firebase JS SDK init (RTDB)
│       ├── hooks/useRtdbChannel.ts    # Real-time RTDB listener hook
│       ├── components/
│       │   └── EventNotificationBadge.tsx  # Drop-in live event UI
│       └── app/page.tsx              # Demo dashboard
│
└── docs/
    ├── architecture.md               # System design & flow
    └── firebase-setup.md             # Firebase Console setup guide
```

---

## Quick Start

### 1. Backend (Laravel)

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve   # http://localhost:8000
```

Add to `backend/.env`:
```dotenv
FIREBASE_CREDENTIALS=/path/to/service-account.json
FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
SERVER_API_KEY=your-secure-random-key
```

### 2. Frontend (Next.js)

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev   # http://localhost:3000
```

Add to `frontend/.env.local`:
```dotenv
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
```

### 3. Fire an Event (Test with Terminal)

**Windows CMD (Single-Line):**
```cmd
curl -X POST http://localhost:8000/api/events -H "Content-Type: application/json" -H "X-API-KEY: lyr-firebase-sync-test-key-2026" -d "{\"channel\": \"alerts\", \"type\": \"order.completed\", \"payload\": {\"order_id\": \"ORD-9902\", \"amount\": 2500, \"customer\": \"Juan Dela Cruz\"}}"
```

**Windows CMD (Multi-Line `^`):**
```cmd
curl -X POST http://localhost:8000/api/events ^
  -H "Content-Type: application/json" ^
  -H "X-API-KEY: lyr-firebase-sync-test-key-2026" ^
  -d "{\"channel\": \"alerts\", \"type\": \"order.completed\", \"payload\": {\"order_id\": \"ORD-9902\", \"amount\": 2500, \"customer\": \"Juan Dela Cruz\"}}"
```

**PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/events" -Method Post `
  -Headers @{ "X-API-KEY" = "lyr-firebase-sync-test-key-2026" } `
  -ContentType "application/json" `
  -Body (@{
    channel = "alerts"
    type    = "order.completed"
    payload = @{
      order_id = "ORD-9902"
      amount   = 2500
      customer = "Juan Dela Cruz"
    }
  } | ConvertTo-Json -Depth 5)
```

**Bash / macOS / Linux:**
```bash
curl -X POST http://localhost:8000/api/events \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: lyr-firebase-sync-test-key-2026" \
  -d '{
    "channel": "alerts",
    "type": "order.completed",
    "payload": {
      "order_id": "ORD-9902",
      "amount": 2500,
      "customer": "Juan Dela Cruz"
    }
  }'
```

The Next.js dashboard updates in < 200ms without page reload.

---

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/events` | `X-API-KEY` | Fire event → writes to RTDB |
| GET  | `/api/events/{channel}` | `X-API-KEY` | Get channel info |

---

## Documentation

| Guide | Description |
|-------|-------------|
| [`docs/architecture.md`](docs/architecture.md) | Full system design, sequence diagram, learning path |
| [`docs/firebase-setup.md`](docs/firebase-setup.md) | Firebase Console setup: RTDB, service account, rules |

---

## Contributing

Pull requests are welcome. Read `docs/architecture.md` first.
Never commit `.env` files or service account JSON files.

---

*MIT Licensed • Maintained by Jerald Jose (CodeMasterLYR)*
