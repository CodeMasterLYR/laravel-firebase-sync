# laravel-firebase-sync

> **Open-Source Learning Blueprint**
> **Maintained by:** Jerald Jose (CodeMasterLYR)

A lightweight starter kit demonstrating how to use **Firebase Realtime Database (RTDB)** as a real-time event bridge between a **Laravel 11 API backend** and a **Next.js 14 frontend**.

When an external system (POS, ERP, mobile backend) calls the Laravel API, the backend writes to RTDB. The frontend listens to the same RTDB path and updates instantly — no polling, no WebSockets to manage.

---

## How It Works

```
External App / API
      │
      │  POST /api/events  (X-API-KEY header)
      ▼
Laravel 11 Backend
      │
      │  FirebaseRtdbService::write("events/orders/latest", {...})
      ▼
Firebase Realtime Database
      │
      │  onValue listener fires (< 200ms)
      ▼
Next.js Frontend (any connected browser)
      │
      └─ useRtdbChannel("orders") → state updates → UI re-renders
```

---

## Features

- `FirebaseRtdbService` — clean Laravel service for RTDB `write`, `push`, `delete`
- `EventController` — authenticated endpoint for external systems to fire events
- `ValidateApiKey` middleware — `X-API-KEY` server-to-server auth
- `ForceJsonResponse` — API-only, never returns HTML
- `useRtdbChannel` — React hook, subscribes to any RTDB path live
- `EventNotificationBadge` — drop-in component, shows event type + payload
- Supports both `FIREBASE_CREDENTIALS` JSON file OR individual env vars

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
