<?php

namespace App\Services;

use Kreait\Firebase\Factory;
use Kreait\Firebase\Http\HttpClientOptions;
use Illuminate\Support\Facades\Log;

/**
 * Firebase Realtime Database Service
 *
 * Wraps kreait/laravel-firebase to write event data into RTDB paths.
 * The Next.js frontend subscribes to the same path using the Firebase JS SDK
 * and receives updates in real-time without polling.
 *
 * Credentials: use FIREBASE_CREDENTIALS (path to service-account JSON) or
 *              individual FIREBASE_* env vars (see .env.example).
 */
class FirebaseRtdbService
{
    protected ?\Kreait\Firebase\Contract\Database $db = null;

    public function __construct()
    {
        try {
            $caBundle = storage_path('cacert.pem');

            // Support both a JSON file path OR individual .env vars
            $credFile = config('services.firebase.credentials');

            if ($credFile && file_exists($credFile)) {
                $factory = (new Factory)->withServiceAccount($credFile);
            } else {
                $privateKey = str_replace('\\n', "\n", config('services.firebase.private_key', ''));
                $serviceAccount = [
                    'type'                  => 'service_account',
                    'project_id'            => config('services.firebase.project_id'),
                    'private_key_id'        => config('services.firebase.private_key_id'),
                    'private_key'           => trim($privateKey, "\"'"),
                    'client_email'          => config('services.firebase.client_email'),
                    'client_id'             => config('services.firebase.client_id'),
                    'auth_uri'              => 'https://accounts.google.com/o/oauth2/auth',
                    'token_uri'             => 'https://oauth2.googleapis.com/token',
                ];
                $factory = (new Factory)->withServiceAccount($serviceAccount);
            }

            // Windows SSL fix
            if (file_exists($caBundle)) {
                $httpOptions = HttpClientOptions::default()
                    ->withGuzzleConfigOptions(['verify' => $caBundle]);
                $factory = $factory->withHttpClientOptions($httpOptions);
            }

            $databaseUrl = config('services.firebase.database_url');
            $this->db = $factory->withDatabaseUri($databaseUrl)->createDatabase();

        } catch (\Exception $e) {
            Log::error('FirebaseRtdbService init failed', ['error' => $e->getMessage()]);
        }
    }

    /**
     * Write/merge data to a RTDB path.
     * The frontend listener fires immediately when this is called.
     *
     * @param  string  $path  e.g. 'events/orders', 'notifications/user_42'
     * @param  array   $data  Payload to store
     */
    public function write(string $path, array $data): bool
    {
        if (! $this->db) {
            Log::warning('FirebaseRtdbService: database not initialized, write skipped.', compact('path'));
            return false;
        }

        try {
            $this->db->getReference($path)->set(array_merge($data, [
                'updated_at' => now()->toIso8601String(),
            ]));
            Log::info('RTDB write success', compact('path'));
            return true;
        } catch (\Exception $e) {
            Log::error('RTDB write failed', ['path' => $path, 'error' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * Push a child into a RTDB list path (auto-generates a key).
     * Use for append-only event logs.
     *
     * @param  string  $path  e.g. 'events/log'
     */
    public function push(string $path, array $data): ?string
    {
        if (! $this->db) return null;

        try {
            $ref = $this->db->getReference($path)->push(array_merge($data, [
                'pushed_at' => now()->toIso8601String(),
            ]));
            return $ref->getKey();
        } catch (\Exception $e) {
            Log::error('RTDB push failed', ['path' => $path, 'error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Delete a RTDB path (reset after reading).
     */
    public function delete(string $path): bool
    {
        if (! $this->db) return false;

        try {
            $this->db->getReference($path)->remove();
            return true;
        } catch (\Exception $e) {
            Log::error('RTDB delete failed', ['path' => $path, 'error' => $e->getMessage()]);
            return false;
        }
    }
}
