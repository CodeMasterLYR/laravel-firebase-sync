# Firebase Setup Guide

> Get Firebase RTDB running in 10 minutes.

---

## 1. Create a Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** → name it (e.g. `my-laravel-sync`)
3. Disable Google Analytics (optional)
4. Click **Create project**

---

## 2. Create the Realtime Database

1. In the left sidebar → **Build → Realtime Database**
2. Click **Create Database**
3. Choose a region (e.g. `asia-southeast1` for Philippines)
4. Start in **Test mode** (you will harden rules later)
5. Copy the database URL: `https://my-laravel-sync-default-rtdb.firebaseio.com`

Add to `backend/.env`:
```dotenv
FIREBASE_DATABASE_URL=https://my-laravel-sync-default-rtdb.firebaseio.com
```

---

## 3. Create a Service Account (Backend Credentials)

The service account lets the Laravel backend write to RTDB with admin privileges.

1. Go to **Project Settings** (gear icon) → **Service accounts** tab
2. Click **Generate new private key** → **Generate key**
3. A JSON file downloads — save it securely (NOT inside your project folder)
4. Add the path to `backend/.env`:

```dotenv
FIREBASE_CREDENTIALS=/absolute/path/to/service-account.json
```

> **Never commit this file to git.** It has admin access to your Firebase project.

---

## 4. Frontend Web App Config (Public Keys)

1. Go to **Project Settings** → **General** tab → **Your apps**
2. Click **Add app** → **Web** (`</>`)
3. Register the app (name: `next-frontend`)
4. Copy the config object values to `frontend/.env.local`:

```dotenv
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=my-laravel-sync.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://my-laravel-sync-default-rtdb.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=my-laravel-sync
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=my-laravel-sync.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

> These are **public** values — safe to include in frontend code.

---

## 5. RTDB Security Rules

In Firebase Console → **Realtime Database → Rules**, set:

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

This ensures:
- Only authenticated clients can read event data
- Only the backend service account can write (clients cannot fake events)

---

## 6. Windows SSL Fix (Local Dev)

If you see `cURL error 60: SSL peer certificate` on Windows, the `FirebaseRtdbService` automatically checks for `storage/cacert.pem`. Download it:

```bash
cd backend
curl -o storage/cacert.pem https://curl.se/ca/cacert.pem
```

---

## Done

Verify the setup by firing a test event (see README Quick Start).
