"use client";

import { useEffect, useRef, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface FirestoreSignal {
  transaction_id: string | number;
  triggered_at: string;
  channel?: string;
  event?: string;
  endpoint?: string;
  target_client?: string | null;
}

export interface LaravelEventPayload {
  event_id: string;
  transaction_id: string;
  type: string;
  channel: string;
  target_client?: string | null;
  payload: Record<string, unknown>;
  source: string;
  triggered_at: string;
}

interface UseFirestoreSignalOptions {
  autoFetch?: boolean;
  onSignal?: (signal: FirestoreSignal) => void;
}

/**
 * useFirestoreSignal — Real-time event act / trigger hook via Firestore.
 *
 * 1. Listens to `events_channel/${channel}` (and `events_channel/latest`) for a lightweight signal.
 * 2. When a new `triggered_at` arrives, it notifies the client and triggers an API fetch
 *    to the Laravel backend endpoint to securely load the full payload!
 */
export function useFirestoreSignal(
  channel: string = "latest",
  options: UseFirestoreSignalOptions = { autoFetch: true }
) {
  const [signal, setSignal]       = useState<FirestoreSignal | null>(null);
  const [data, setData]           = useState<LaravelEventPayload | null>(null);
  const [loading, setLoading]     = useState(true);
  const [fetching, setFetching]   = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const lastTriggeredAt = useRef<string | null>(null);
  const isFirstMount    = useRef(true);

  // Function to fetch the actual full event payload from Laravel API
  const fetchEventData = async (targetEndpoint?: string) => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    const endpointPath = targetEndpoint ? targetEndpoint.replace(/^\/api/, "") : `/events/${channel}`;
    const url = `${apiBase.replace(/\/api$/, "")}/api${endpointPath}`;

    setFetching(true);
    try {
      const res = await fetch(url, {
        headers: {
          "Accept": "application/json",
          "X-API-KEY": "lyr-firebase-sync-test-key-2026",
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
      }

      const json = await res.json();
      if (json.data) {
        setData(json.data);
      }
    } catch (err: any) {
      console.error("[useFirestoreSignal] API fetch error:", err);
      setError(`API fetch failed: ${err.message}`);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (!channel) return;

    setLoading(true);
    setError(null);
    isFirstMount.current = true;

    const docTarget = channel === "latest" ? "latest" : channel;
    const docRef = doc(db, "events_channel", docTarget);

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        setLoading(false);

        if (!docSnap.exists()) {
          return;
        }

        const raw = docSnap.data() as FirestoreSignal;
        setSignal(raw);

        // If this is a fresh event (new triggered_at), fire trigger action!
        if (raw.triggered_at && raw.triggered_at !== lastTriggeredAt.current) {
          lastTriggeredAt.current = raw.triggered_at;

          // Call external signal callback if provided
          options.onSignal?.(raw);

          // Trigger automatic API fetch to the specific endpoint for that event
          if (options.autoFetch !== false) {
            fetchEventData(raw.endpoint);
          }
        }
      },
      (err) => {
        console.error("[useFirestoreSignal] Firestore error:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [channel]);

  return {
    signal,
    data,
    loading,
    fetching,
    error,
    refetch: () => fetchEventData(signal?.endpoint),
  };
}
