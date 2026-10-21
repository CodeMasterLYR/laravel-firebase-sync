<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\FirebaseFirestoreService;
use App\Services\FirebaseRtdbService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

/**
 * Event Controller
 *
 * External applications (POS, ERP, mobile backends) POST events here.
 *
 * Architecture:
 *  1. Full payload is securely stored/cached in Laravel backend.
 *  2. A lightweight "event act" signal is emitted to Firestore (events_channel/latest & events_channel/{channel})
 *     containing only metadata: transaction_id, triggered_at, channel, event type, and API endpoint.
 *  3. Subscribed clients (general or specific) detect the Firestore signal in real-time,
 *     and automatically call the Laravel API endpoint (GET /api/events/{channel}) to fetch the full data!
 */
class EventController extends Controller
{
    public function __construct(
        protected FirebaseFirestoreService $firestore,
        protected FirebaseRtdbService $rtdb
    ) {}

    /**
     * Receive an event from an external system.
     *
     * POST /api/events
     * Headers: X-API-KEY: <key>
     * Body: {
     *   "type": "order.completed",
     *   "channel": "alerts",
     *   "transaction_id": "100192", // optional
     *   "target_client": "client_123", // optional
     *   "payload": { ... }
     * }
     */
    public function fire(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type'           => 'required|string|max:100',
            'channel'        => 'required|string|max:100',
            'payload'        => 'required|array',
            'transaction_id' => 'nullable|string|max:100',
            'target_client'  => 'nullable|string|max:100',
        ]);

        $eventId = (string) Str::uuid();
        $transactionId = $validated['transaction_id'] ?? (string) rand(100000, 999999);
        $channel = $validated['channel'];
        $source = $request->header('X-Source-App', 'External System');

        $fullEventData = [
            'event_id'       => $eventId,
            'transaction_id' => $transactionId,
            'type'           => $validated['type'],
            'channel'        => $channel,
            'target_client'  => $validated['target_client'] ?? null,
            'payload'        => $validated['payload'],
            'source'         => $source,
            'triggered_at'   => now()->toIso8601String(),
        ];

        // 1. Securely cache the full event data in Laravel
        Cache::put("events:{$channel}:latest", $fullEventData, now()->addHours(24));
        Cache::put("events:latest", $fullEventData, now()->addHours(24));

        // 2. Dispatch lightweight Firestore trigger signal (no heavy payload in cloud DB)
        $endpoint = "/api/events/{$channel}";
        $firestoreSuccess = $this->firestore->triggerEventSignal(
            channel: $channel,
            transactionId: $transactionId,
            eventType: $validated['type'],
            endpoint: $endpoint,
            targetClient: $validated['target_client'] ?? null
        );

        // 3. Dual-sync with RTDB as well
        $this->rtdb->write("events/{$channel}/latest", $fullEventData);

        return response()->json([
            'message'          => 'Event signal emitted to Firestore & stored in Laravel.',
            'event_id'         => $eventId,
            'transaction_id'   => $transactionId,
            'channel'          => $channel,
            'endpoint'         => $endpoint,
            'firestore_signal' => $firestoreSuccess,
        ], 201);
    }

    /**
     * Fetch the full event data for a channel.
     * Called automatically by clients when they receive a Firestore trigger signal.
     *
     * GET /api/events/{channel}
     */
    public function latest(Request $request, string $channel): JsonResponse
    {
        $cached = Cache::get("events:{$channel}:latest");

        if (!$cached) {
            // Check general latest fallback
            if ($channel === 'general' || $channel === 'latest') {
                $cached = Cache::get("events:latest");
            }
        }

        if (!$cached) {
            return response()->json([
                'channel' => $channel,
                'data'    => null,
                'message' => 'No events have been fired on this channel yet.',
            ], 200);
        }

        return response()->json([
            'channel'    => $channel,
            'data'       => $cached,
            'fetched_at' => now()->toIso8601String(),
        ]);
    }
}
