"use client";

import { useState } from "react";
import { EventNotificationBadge } from "@/components/EventNotificationBadge";

export default function Home() {
  const [channel, setChannel] = useState("orders");
  const [customChannel, setCustomChannel] = useState("");

  const activeChannel = customChannel.trim() || channel;

  return (
    <main className="container">
      {/* Header */}
      <header style={{ marginBottom: "2.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <span style={{
            fontSize: "0.75rem",
            background: "rgba(56, 189, 248, 0.15)",
            color: "#38bdf8",
            padding: "0.2rem 0.5rem",
            borderRadius: "4px",
            fontWeight: 700,
            letterSpacing: "0.05em"
          }}>
            OPEN SOURCE
          </span>
          <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
            Laravel 11 + Firebase RTDB
          </span>
        </div>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
          Real-Time Event Stream Monitor
        </h1>
        <p style={{ color: "#94a3b8", marginTop: "0.5rem", fontSize: "0.95rem" }}>
          Subscribed to Firebase Realtime Database. Any event posted to the Laravel backend fires here instantly.
        </p>
      </header>

      {/* Channel Selector */}
      <section style={{
        background: "rgba(20, 27, 45, 0.5)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "12px",
        padding: "1.25rem",
        marginBottom: "2rem"
      }}>
        <h3 style={{ fontSize: "0.95rem", marginBottom: "0.75rem", color: "#f1f5f9" }}>
          Active Channel
        </h3>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          {["orders", "notifications", "alerts", "live_test"].map((ch) => (
            <button
              key={ch}
              onClick={() => {
                setChannel(ch);
                setCustomChannel("");
              }}
              style={{
                background: activeChannel === ch ? "#38bdf8" : "rgba(255, 255, 255, 0.05)",
                color: activeChannel === ch ? "#0a0e17" : "#f1f5f9",
                border: "1px solid " + (activeChannel === ch ? "#38bdf8" : "rgba(255, 255, 255, 0.1)"),
                padding: "0.4rem 0.9rem",
                borderRadius: "8px",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              #{ch}
            </button>
          ))}
          <input
            type="text"
            placeholder="Custom channel..."
            value={customChannel}
            onChange={(e) => setCustomChannel(e.target.value)}
            style={{
              background: "rgba(10, 14, 23, 0.8)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              padding: "0.4rem 0.75rem",
              color: "#f1f5f9",
              fontSize: "0.85rem",
              outline: "none",
              marginLeft: "auto"
            }}
          />
        </div>
      </section>

      {/* Live Badge Display */}
      <section style={{ marginBottom: "2.5rem" }}>
        <EventNotificationBadge
          channel={activeChannel}
          label={`Live Stream: events/${activeChannel}/latest`}
        />
      </section>

      {/* Quick Test Instructions */}
      <section style={{
        background: "rgba(15, 23, 42, 0.6)",
        border: "1px dashed rgba(255, 255, 255, 0.15)",
        borderRadius: "12px",
        padding: "1.25rem"
      }}>
        <h4 style={{ fontSize: "0.9rem", color: "#f59e0b", marginBottom: "0.5rem" }}>
          Trigger an Event from Terminal / External System:
        </h4>
        <pre style={{
          background: "rgba(10, 14, 23, 0.9)",
          padding: "1rem",
          borderRadius: "8px",
          color: "#38bdf8",
          fontFamily: "var(--font-mono)",
          fontSize: "0.825rem",
          overflowX: "auto"
        }}>
{`curl -X POST http://localhost:8000/api/events \\
  -H "Content-Type: application/json" \\
  -H "X-API-KEY: lyr-firebase-sync-test-key-2026" \\
  -d '{
    "channel": "${activeChannel}",
    "type": "order.completed",
    "payload": {
      "order_id": "ORD-9902",
      "amount": 2500,
      "customer": "Juan Dela Cruz"
    }
  }'`}
        </pre>
      </section>
    </main>
  );
}
