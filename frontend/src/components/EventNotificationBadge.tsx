/**
 * EventNotificationBadge
 *
 * Listens to Firestore `events_channel` for lightweight signals / acts.
 * Upon detecting a trigger, it alerts the UI and fetches the complete event
 * data from the designated Laravel API endpoint.
 */
"use client";

import { useFirestoreSignal } from "@/hooks/useFirestoreSignal";

interface Props {
  channel: string;
  label?: string;
}

export function EventNotificationBadge({ channel, label }: Props) {
  const { signal, data, loading, fetching, error, refetch } = useFirestoreSignal(channel);

  if (loading) {
    return <span className="badge badge-loading">Connecting to Firestore...</span>;
  }

  if (error) {
    return (
      <div style={{
        background: "rgba(244, 63, 94, 0.1)",
        border: "1px solid rgba(244, 63, 94, 0.3)",
        borderRadius: "10px",
        padding: "1rem 1.25rem",
        color: "#fecdd3"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600, color: "#f43f5e", marginBottom: "0.5rem" }}>
          <span>⚠️ Firestore Error</span>
        </div>
        <p style={{ fontSize: "0.875rem" }}>{error}</p>
      </div>
    );
  }

  if (!signal) {
    return <span className="badge badge-idle">Waiting for Firestore trigger signal...</span>;
  }

  return (
    <div className="event-card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
        {label && <p className="event-label" style={{ margin: 0 }}>{label}</p>}
        {fetching && (
          <span style={{
            fontSize: "0.75rem",
            color: "#f59e0b",
            background: "rgba(245, 158, 11, 0.15)",
            padding: "0.2rem 0.6rem",
            borderRadius: "6px",
            fontWeight: 600
          }}>
            ⚡ Triggering API fetch...
          </span>
        )}
      </div>

      {/* Stage 1: Firestore Act / Signal Details */}
      <div style={{
        background: "rgba(10, 14, 23, 0.6)",
        border: "1px solid rgba(56, 189, 248, 0.2)",
        borderRadius: "8px",
        padding: "0.75rem 1rem",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        flexWrap: "wrap",
        fontSize: "0.825rem"
      }}>
        <span style={{ color: "#38bdf8", fontWeight: 700 }}>
          🔥 Firestore Signal:
        </span>
        <span style={{ color: "#e2e8f0" }}>
          <strong>TX ID:</strong> <code style={{ color: "#f59e0b" }}>{signal.transaction_id}</code>
        </span>
        <span style={{ color: "#e2e8f0" }}>
          <strong>Event:</strong> <code style={{ color: "#10b981" }}>{signal.event || "signal"}</code>
        </span>
        <span style={{ color: "#94a3b8", marginLeft: "auto", fontFamily: "var(--font-mono)" }}>
          {new Date(signal.triggered_at).toLocaleTimeString()}
        </span>
      </div>

      {/* Stage 2: Full Data fetched from Laravel API */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
          <span style={{ fontSize: "0.8rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>
            📥 Secure Data Loaded from Laravel API ({signal.endpoint || `/api/events/${channel}`}):
          </span>
          <button
            onClick={() => refetch()}
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "#94a3b8",
              fontSize: "0.75rem",
              padding: "0.2rem 0.5rem",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Refetch API
          </button>
        </div>

        {data ? (
          <pre className="event-payload">
            {JSON.stringify(data, null, 2)}
          </pre>
        ) : (
          <div style={{
            background: "rgba(10, 14, 23, 0.4)",
            border: "1px dashed rgba(255, 255, 255, 0.1)",
            padding: "1rem",
            borderRadius: "8px",
            color: "#94a3b8",
            fontSize: "0.85rem"
          }}>
            Signal received. Full payload has not been cached yet or endpoint returned empty.
          </div>
        )}
      </div>
    </div>
  );
}
