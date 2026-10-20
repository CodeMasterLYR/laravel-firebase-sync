<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\FirebaseRtdbService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

/**
 * Event Controller
 *
 * External applications (POS, ERP, mobile backends) POST events here.
 * This controller validates the request, then writes to Firebase RTDB,
 * which instantly notifies all subscribed frontend clients.
 *
 * Auth: API key via X-API-KEY header (see ValidateApiKey middleware).
 *
 * Example use cases:
 *  - POS posts a new order → frontend dashboard updates live
 *  - ERP posts an inventory update → warehouse app sees it instantly
 *  - Any server event → any connected browser is notified in < 1 second
 */
class EventController extends Controller
{
    public function __construct(protected FirebaseRtdbService $firebase) {}

    /**
     * Receive an event from an external system and broadcast to RTDB.
     *
     * POST /api/events
     * Headers: X-API-KEY: <key>
     * Body: { "type": "order.created", "channel": "orders", "payload": {...} }
     */
    public function fire(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type'    => 'required|string|max:100',   // e.g. "order.created"
            'channel' => 'required|string|max:100',   // RTDB path segment, e.g. "orders"
            'payload' => 'required|array',             // arbitrary event data
        ]);

        $eventId = (string) Str::uuid();

        $rtdbPath = 'events/' . $validated['channel'] . '/latest';

        $written = $this->firebase->write($rtdbPath, [
            'event_id'  => $eventId,
            'type'      => $validated['type'],
            'payload'   => $validated['payload'],
            'source'    => $request->header('X-Source-App', 'unknown'),
        ]);

        if (! $written) {
            return response()->json(['message' => 'Firebase write failed. Check logs.'], 500);
        }

        // Also push to event log for history
        $this->firebase->push('events/' . $validated['channel'] . '/log', [
            'event_id' => $eventId,
            'type'     => $validated['type'],
            'payload'  => $validated['payload'],
        ]);

        return response()->json([
            'message'   => 'Event fired to Firebase RTDB.',
            'event_id'  => $eventId,
            'rtdb_path' => $rtdbPath,
        ], 201);
    }

    /**
     * Get the current state of a channel from RTDB (for initial load).
     *
     * GET /api/events/{channel}
     */
    public function latest(Request $request, string $channel): JsonResponse
    {
        // Frontend can call this once on mount to get current state
        // before the RTDB listener kicks in
        return response()->json([
            'channel' => $channel,
            'rtdb_path' => 'events/' . $channel . '/latest',
            'note' => 'Subscribe to this path in Firebase JS SDK for real-time updates.',
        ]);
    }
}
