/**
 * EventNotificationBadge
 *
 * Drop-in component that listens to a RTDB channel and shows
 * a live notification badge whenever the backend fires an event.
 *
 * Props:
 *   channel  — RTDB channel to listen to (e.g. "orders", "alerts")
 *   label    — display label shown above the badge
 */
"use client";

import { useRtdbChannel } from "@/hooks/useRtdbChannel";

interface Props {
  channel: string;
  label?: string;
}

export function EventNotificationBadge({ channel, label }: Props) {
  const { data, loading, error } = useRtdbChannel(channel);

  if (loading) return <span className="badge badge-loading">Connecting...</span>;
  if (error) {
    const isPermissionError = error.includes("permission_denied");
    return (
      <div style={{
        background: "rgba(244, 63, 94, 0.1)",
        border: "1px solid rgba(244, 63, 94, 0.3)",
        borderRadius: "10px",
        padding: "1rem 1.25rem",
        color: "#fecdd3"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600, color: "#f43f5e", marginBottom: "0.5rem" }}>
          <span>⚠️ Firebase RTDB Permission Denied</span>
        </div>
        <p style={{ fontSize: "0.875rem", marginBottom: "0.5rem" }}>{error}</p>
        {isPermissionError && (
          <div style={{
            fontSize: "0.825rem",
            background: "rgba(0,0,0,0.3)",
            padding: "0.75rem",
            borderRadius: "6px",
            color: "#e2e8f0",
            lineHeight: 1.5
          }}>
            <strong>How to fix:</strong> In <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" style={{ color: "#38bdf8", textDecoration: "underline" }}>Firebase Console</a> → <strong>Realtime Database</strong> → <strong>Rules</strong> tab, allow read access:
            <pre style={{ color: "#a5f3fc", marginTop: "0.35rem", fontFamily: "var(--font-mono)" }}>
{`{
  "rules": {
    "events": {
      ".read": true,
      ".write": false
    }
  }
}`}
            </pre>
          </div>
        )}
      </div>
    );
  }
  if (!data)   return <span className="badge badge-idle">Waiting for events...</span>;

  return (
    <div className="event-card">
      {label && <p className="event-label">{label}</p>}
      <div className="event-header">
        <span className="event-type">{data.type}</span>
        <span className="event-source">from {data.source}</span>
        <span className="event-time">{new Date(data.updated_at).toLocaleTimeString()}</span>
      </div>
      <pre className="event-payload">
        {JSON.stringify(data.payload, null, 2)}
      </pre>
    </div>
  );
}
