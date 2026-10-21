<?php

namespace App\Services;

use Google\Cloud\Firestore\FirestoreClient;
use Google\Auth\Credentials\ServiceAccountCredentials;
use GuzzleHttp\Client as GuzzleClient;
use Google\Auth\HttpHandler\HttpHandlerFactory;
use Illuminate\Support\Facades\Log;

/**
 * FirebaseFirestoreService
 *
 * Emits lightweight real-time event signals / acts to Firestore.
 * No heavy or sensitive payload is stored in Firestore — it serves purely as
 * a real-time notification trigger. Connected clients (general or specific)
 * catch the signal via Firestore onSnapshot, and then call the designated
 * Laravel REST API endpoint to retrieve the full, authenticated data.
 */
class FirebaseFirestoreService
{
    protected ?FirestoreClient $firestore = null;

    public function __construct()
    {
        try {
            $caBundle = storage_path('cacert.pem');
            if (file_exists($caBundle)) {
                ini_set('curl.cainfo', $caBundle);
                ini_set('openssl.cafile', $caBundle);
            }

            $credentialsFile = config('services.firebase.credentials');
            $serviceAccount = null;

            if ($credentialsFile && file_exists($credentialsFile)) {
                $serviceAccount = json_decode(file_get_contents($credentialsFile), true);
            } else {
                $privateKey = config('services.firebase.private_key');
                if (!empty($privateKey) && !empty(config('services.firebase.client_email'))) {
                    $privateKey = str_replace('\\n', "\n", $privateKey);
                    $privateKey = trim($privateKey, '"\'');

                    $serviceAccount = [
                        'type'         => 'service_account',
                        'project_id'   => config('services.firebase.project_id'),
                        'private_key'  => $privateKey,
                        'client_email' => config('services.firebase.client_email'),
                        'client_id'    => config('services.firebase.client_id'),
                    ];
                }
            }

            if (!$serviceAccount) {
                Log::warning('FirebaseFirestoreService: credentials not configured.');
                return;
            }

            $projectId = $serviceAccount['project_id'] ?? config('services.firebase.project_id', 'default');
            $scopes = ['https://www.googleapis.com/auth/datastore', 'https://www.googleapis.com/auth/cloud-platform'];
            $creds = new ServiceAccountCredentials($scopes, $serviceAccount);

            $firestoreConfig = [
                'projectId'   => $projectId,
                'credentials' => $creds,
                'transport'   => 'rest',
            ];

            if (file_exists($caBundle)) {
                $guzzleClient = new GuzzleClient(['verify' => $caBundle]);
                $httpHandlerSync = HttpHandlerFactory::build($guzzleClient);
                $firestoreConfig['credentialsConfig'] = [
                    'authHttpHandler' => $httpHandlerSync,
                ];
                $firestoreConfig['transportConfig'] = [
                    'rest' => [
                        'httpHandler' => [$httpHandlerSync, 'async'],
                    ],
                ];
            }

            $this->firestore = new FirestoreClient($firestoreConfig);

        } catch (\Throwable $e) {
            Log::error('FirebaseFirestoreService init failed', ['error' => $e->getMessage()]);
        }
    }

    /**
     * Trigger an event signal to Firestore.
     * Writes only metadata (timestamp, channel, event type, endpoint, and id)
     * so that clients can immediately react and fetch full details via API.
     *
     * @param string      $channel        Channel name (e.g. 'alerts', 'orders', 'notifications')
     * @param string|null $transactionId  Unique event or transaction ID
     * @param string|null $eventType      Type of event (e.g. 'order.completed')
     * @param string|null $endpoint       Endpoint URL client should call to fetch data
     * @param string|null $targetClient   Specific client ID or null for general broadcast
     */
    public function triggerEventSignal(
        string $channel = 'general',
        ?string $transactionId = null,
        ?string $eventType = null,
        ?string $endpoint = null,
        ?string $targetClient = null
    ): bool {
        if (!$this->firestore) {
            Log::warning('FirebaseFirestoreService: Firestore not initialized.');
            return false;
        }

        try {
            $signal = [
                'transaction_id' => $transactionId ?: (string) rand(100000, 999999),
                'channel'        => $channel,
                'event'          => $eventType ?: 'event.triggered',
                'endpoint'       => $endpoint ?: "/api/events/{$channel}",
                'target_client'  => $targetClient,
                'triggered_at'   => date('c'),
            ];

            // 1. Always update the general latest document for broad listeners
            $this->firestore->collection('events_channel')->document('latest')->set($signal);

            // 2. Also update channel-specific document so clients can listen to only their channel
            if ($channel !== 'latest') {
                $this->firestore->collection('events_channel')->document($channel)->set($signal);
            }

            // 3. If a specific client is targeted, update their client-specific document
            if ($targetClient) {
                $this->firestore->collection('events_channel')->document("client_{$targetClient}")->set($signal);
            }

            Log::info('Firestore event signal dispatched', $signal);
            return true;

        } catch (\Throwable $e) {
            Log::error('FirebaseFirestoreService: failed to send signal', [
                'channel' => $channel,
                'error'   => $e->getMessage(),
            ]);
            return false;
        }
    }
}
