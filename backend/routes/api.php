<?php

use App\Http\Controllers\Api\EventController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — laravel-firebase-sync
|--------------------------------------------------------------------------
|
| POST /api/events        → Fire an event to Firebase RTDB (X-API-KEY required)
| GET  /api/events/{ch}   → Get channel info (X-API-KEY required)
|
*/

Route::middleware('validate.api.key')->group(function () {
    Route::post('/events',           [EventController::class, 'fire']);
    Route::get('/events/{channel}',  [EventController::class, 'latest']);
});
