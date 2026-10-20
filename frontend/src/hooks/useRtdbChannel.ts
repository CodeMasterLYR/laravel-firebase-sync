/**
 * useRtdbChannel — React hook for listening to a Firebase RTDB path.
 *
 * The hook subscribes to `events/<channel>/latest` and returns the
 * latest event data in real time. When the Laravel backend writes to
 * that path (triggered by an external API call), this hook fires.
 *
 * Usage:
 *   const { data, loading } = useRtdbChannel("orders");
 *   // data updates live whenever the backend fires an order event
 */
"use client";

import { useEffect, useState } from "react";
import { ref, onValue, off } from "firebase/database";
import { rtdb } from "@/lib/firebase";

export interface RtdbEvent {
  event_id: string;
  type: string;
  payload: Record<string, unknown>;
  source: string;
  updated_at: string;
}

export function useRtdbChannel(channel: string) {
  const [data, setData]       = useState<RtdbEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!channel) return;

    const path   = `events/${channel}/latest`;
    const dbRef  = ref(rtdb, path);

    // onValue fires immediately with current value, then on every change
    const unsubscribe = onValue(
      dbRef,
      (snapshot) => {
        setData(snapshot.val() as RtdbEvent | null);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    // Cleanup listener on unmount or channel change
    return () => off(dbRef, "value", unsubscribe);
  }, [channel]);

  return { data, loading, error };
}
