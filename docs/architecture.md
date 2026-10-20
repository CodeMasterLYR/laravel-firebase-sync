# Architecture — `laravel-firebase-sync`

> **Maintained by:** Jerald Jose (CodeMasterLYR) • MIT License

---

## 1. Purpose

Demonstrate how Firebase Realtime Database (RTDB) acts as a **real-time message bus** between a Laravel API backend and a Next.js frontend.

The backend writes, the frontend listens. No WebSocket server to maintain, no polling, no long-polling — Firebase RTDB handles the connection for you.

---

## 2. Getting Started (Learning Path)

1. [ ] Read this file.
2. [ ] Follow `docs/firebase-setup.md` — create a Firebase project and RTDB.
3. [ ] Set up the Laravel backend (`backend/.env.example` → `backend/.env`).
4. [ ] Set up the Next.js frontend (`frontend/.env.local.example` → `.env.local`).
5. [ ] Fire a test event with curl (see README Quick Start).
6. [ ] Watch the frontend update in real time.
7. [ ] Read the key files in Section 4.

---

## 3. System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  External System (POS / ERP / Mobile Backend / Cron)            │
│                                                                  │
│  POST /api/events                                                │
│  Headers: X-API-KEY: <SERVER_API_KEY>                            │
│  Body: { type, channel, payload }                                │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│  Laravel 11 Backend  (localhost:8000)                           │
│                                                                  │
│  ┌────────────────┐   validates X-API-KEY                       │
│  │ ValidateApiKey │ ─────────────────────────────────────────►  │
│  └────────────────┘                                              │
│                                                                  │
│  ┌──────────────────┐                                            │
│  │ EventController  │ ─► FirebaseRtdbService::write(path, data) │
│  └──────────────────┘                                            │
│                                                                  │
│  ┌─────────────────────────┐                                     │
│  │ FirebaseRtdbService     │  uses kreait/laravel-firebase       │
│  │ write(path, data)       │  service account auth (server-side) │
│  │ push(path, data)        │                                     │
│  │ delete(path)            │                                     │
│  └────────────┬────────────┘                                     │
└───────────────┼──────────────────────────────────────────────────┘
                │
                │  HTTPS REST to Firebase API
                ▼
┌──────────────────────────────────────────────────────────────────┐
│  Firebase Realtime Database                                     │
│                                                                  │
│  events/                                                         │
│    orders/                                                       │
│      latest: { event_id, type, payload, updated_at }  ← write  │
│      log/                                                        │
│        <auto-key>: { ... }                            ← push    │
│    alerts/latest: { ... }                                        │
│    inventory/latest: { ... }                                     │
└───────────────┬──────────────────────────────────────────────────┘
                │
                │  WebSocket (Firebase JS SDK manages this)
                ▼
┌──────────────────────────────────────────────────────────────────┐
│  Next.js 14 Frontend  (localhost:3000)                          │
│                                                                  │
│  useRtdbChannel("orders")                                        │
│    → onValue(ref(rtdb, "events/orders/latest"))                  │
│    → fires on every write above                                  │
│    → React state updates → component re-renders                  │
│                                                                  │
│  <EventNotificationBadge channel="orders" />                     │
│    shows: type, payload, source, time                            │
└──────────────────────────────────────────────────────────────────┘
```

---

## 4. Key Files

### Backend

| File | Role |
|------|------|
| `app/Services/FirebaseRtdbService.php` | Core service — `write`, `push`, `delete` to RTDB via kreait |
| `app/Http/Controllers/Api/EventController.php` | Receives external events, writes to RTDB |
| `app/Http/Middleware/ValidateApiKey.php` | `X-API-KEY` server-to-server auth |
| `app/Http/Middleware/ForceJsonResponse.php` | All responses are JSON |
| `config/services.php` | Firebase + server API key config |
| `routes/api.php` | Route definitions |

### Frontend

| File | Role |
|------|------|
| `src/lib/firebase.ts` | Firebase JS SDK init — safe to use in browser (public keys only) |
| `src/hooks/useRtdbChannel.ts` | `onValue` listener hook — returns live RTDB data |
| `src/components/EventNotificationBadge.tsx` | Drop-in live event display component |

---

## 5. RTDB Data Structure

```
events/
  {channel}/
    latest/           ← set() — always overwrites with newest event
      event_id: uuid
      type: "order.created"
      payload: { ... }
      source: "pos-app"
      updated_at: ISO8601
    log/              ← push() — append-only history
      -NxAbc...: { event_id, type, payload, pushed_at }
      -NxDef...: { ... }
```

**Why two paths?**
- `latest/` — frontend always shows the current state (1 write = 1 notification)
- `log/` — historical record of all events (queryable, auditable)

---

## 6. Firebase Security Rules (RTDB)

Set these rules in the Firebase Console (`Realtime Database > Rules`):

```json
{
  "rules": {
    "events": {
      ".read":  "auth != null",
      ".write": false
    }
  }
}
```

- **Write** is disabled from the client — only the service account (backend) can write.
- **Read** requires Firebase Authentication — prevents unauthorized data access.
- Adjust rules per channel as your security needs grow.

---

## 7. Community

| Field | Value |
|-------|-------|
| Author | Jerald Jose (CodeMasterLYR) |
| GitHub | [@CodeMasterLYR](https://github.com/CodeMasterLYR) |
| License | MIT |
| Stack | Laravel 11, kreait/laravel-firebase, Next.js 14, Firebase JS SDK |

*Contributions and pull requests are welcome.*
