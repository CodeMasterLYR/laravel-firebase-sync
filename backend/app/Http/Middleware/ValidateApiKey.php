<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * API Key Validation Middleware
 *
 * External systems (POS, ERP, other backends) must include:
 *   X-API-KEY: <SERVER_API_KEY from .env>
 *
 * This identifies the calling server application, not an end user.
 * Rotate SERVER_API_KEY if compromised — no code change needed.
 */
class ValidateApiKey
{
    public function handle(Request $request, Closure $next): Response
    {
        $expectedKey = config('services.server.api_key');
        $providedKey = $request->header('X-API-KEY');

        if (empty($expectedKey) || ! $providedKey || ! hash_equals($expectedKey, $providedKey)) {
            return response()->json([
                'message' => 'Unauthorized. Provide a valid X-API-KEY header.',
                'error'   => 'invalid_api_key',
            ], 401);
        }

        return $next($request);
    }
}
