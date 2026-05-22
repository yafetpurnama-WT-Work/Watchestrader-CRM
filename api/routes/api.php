<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\TagController;
use App\Http\Controllers\Api\ContactNoteController;
use App\Http\Controllers\Api\CustomFieldController;
use App\Http\Controllers\Api\ConversationController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\MessageTemplateController;
use App\Http\Controllers\Api\WhatsappConfigController;
use App\Http\Controllers\Api\PipelineController;
use App\Http\Controllers\Api\PipelineStageController;
use App\Http\Controllers\Api\DealController;
use App\Http\Controllers\Api\BroadcastController;
use App\Http\Controllers\Api\AutomationController;
use App\Http\Controllers\Api\DashboardController;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

/*
|--------------------------------------------------------------------------
| Protected Routes (Sanctum)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::put('/auth/profile', [AuthController::class, 'updateProfile']);
    Route::put('/auth/change-password', [AuthController::class, 'changePassword']);
    Route::post('/auth/revoke-all', [AuthController::class, 'revokeAll']);

    // Dashboard
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

    // Users (list profiles for assignment)
    Route::get('/users', function (\Illuminate\Http\Request $request) {
        $users = \App\Models\User::select('id', 'full_name', 'email', 'avatar_url')
            ->orderBy('full_name')
            ->get();
        return response()->json([
            'success' => true,
            'data' => $users,
            'message' => 'Users retrieved.',
        ]);
    });

    // Contacts
    Route::apiResource('contacts', ContactController::class);
    Route::post('/contacts/import', [ContactController::class, 'import']);
    Route::apiResource('contacts.notes', ContactNoteController::class)->only(['index', 'store', 'destroy']);

    // Contact sub-resources
    Route::get('/contacts/{contact}/tags', [ContactController::class, 'tags']);
    Route::post('/contacts/{contact}/tags', [ContactController::class, 'syncTags']);
    Route::get('/contacts/{contact}/custom-values', [ContactController::class, 'customValues']);
    Route::put('/contacts/{contact}/custom-values', [ContactController::class, 'updateCustomValues']);
    Route::get('/contacts/{contact}/deals', [ContactController::class, 'deals']);

    // Tags
    Route::apiResource('tags', TagController::class);

    // Custom Fields
    Route::apiResource('custom-fields', CustomFieldController::class)->except(['show']);

    // Conversations & Messages
    Route::apiResource('conversations', ConversationController::class)->except(['store']);
    Route::apiResource('conversations.messages', MessageController::class)->only(['index', 'store', 'update']);

    // Message Templates
    Route::apiResource('message-templates', MessageTemplateController::class);

    // WhatsApp Config
    Route::get('/whatsapp-config', [WhatsappConfigController::class, 'show']);
    Route::post('/whatsapp-config', [WhatsappConfigController::class, 'store']);
    Route::delete('/whatsapp-config', [WhatsappConfigController::class, 'destroy']);

    // Pipelines & Stages
    Route::apiResource('pipelines', PipelineController::class);
    Route::apiResource('pipelines.stages', PipelineStageController::class)->except(['show']);
    Route::post('/pipelines/{pipeline}/stages/reorder', [PipelineStageController::class, 'reorder']);

    // Deals
    Route::apiResource('deals', DealController::class);

    // Broadcasts
    Route::apiResource('broadcasts', BroadcastController::class);
    Route::get('/broadcasts/{broadcast}/recipients', [BroadcastController::class, 'recipients']);

    // Automations
    Route::apiResource('automations', AutomationController::class);
    Route::post('/automations/{automation}/toggle', [AutomationController::class, 'toggle']);
    Route::post('/automations/{automation}/duplicate', [AutomationController::class, 'duplicate']);
    Route::get('/automations/{automation}/logs', [AutomationController::class, 'logs']);
    Route::get('/automations/{automation}/steps', [AutomationController::class, 'steps']);
    Route::put('/automations/{automation}/steps', [AutomationController::class, 'saveSteps']);
});
