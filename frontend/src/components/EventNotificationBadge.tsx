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
  if (error)   return <span className="badge badge-error">Error: {error}</span>;
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
