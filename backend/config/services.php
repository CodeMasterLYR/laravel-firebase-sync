<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Firebase Configuration
    |--------------------------------------------------------------------------
    | Option A: Set FIREBASE_CREDENTIALS to the path of your service account JSON.
    | Option B: Set individual FIREBASE_* env vars (see .env.example).
    */
    'firebase' => [
        'credentials'    => env('FIREBASE_CREDENTIALS'),          // path to JSON file
        'project_id'     => env('FIREBASE_PROJECT_ID'),
        'private_key_id' => env('FIREBASE_PRIVATE_KEY_ID'),
        'private_key'    => env('FIREBASE_PRIVATE_KEY'),
        'client_email'   => env('FIREBASE_CLIENT_EMAIL'),
        'client_id'      => env('FIREBASE_CLIENT_ID'),
        'database_url'   => env('FIREBASE_DATABASE_URL'),         // https://<project>.firebaseio.com
    ],

    /*
    |--------------------------------------------------------------------------
    | Server API Key
    |--------------------------------------------------------------------------
    | External systems send X-API-KEY: <SERVER_API_KEY> to authenticate.
    | Generate with: php artisan tinker --execute="echo Str::random(64);"
    */
    'server' => [
        'api_key' => env('SERVER_API_KEY'),
    ],

];
