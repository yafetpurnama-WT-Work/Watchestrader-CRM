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
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\LeadController;
use App\Http\Controllers\Api\SubLeadController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\PermissionController;
use App\Http\Controllers\Api\CompanyController;
use App\Http\Controllers\Api\OutletController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\MasterDataController;

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

    // Users (full CRUD)
    Route::apiResource('users', UserController::class);
    Route::post('/users/{user}/activate', [UserController::class, 'activate']);
    Route::post('/users/{user}/deactivate', [UserController::class, 'deactivate']);

    // Contacts (legacy)
    Route::apiResource('contacts', ContactController::class);
    Route::post('/contacts/import', [ContactController::class, 'import']);
    Route::apiResource('contacts.notes', ContactNoteController::class)->only(['index', 'store', 'destroy']);
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

    // =====================================================
    // CRM Module Routes
    // =====================================================

    // Customers
    Route::apiResource('customers', CustomerController::class);
    Route::post('/customers/{customer}/change-status', [CustomerController::class, 'changeStatus']);
    Route::get('/customers/{customer}/status-history', [CustomerController::class, 'statusHistory']);

    // Leads
    Route::apiResource('leads', LeadController::class);
    Route::post('/leads/{lead}/change-status', [LeadController::class, 'changeStatus']);
    Route::get('/leads/{lead}/history', [LeadController::class, 'history']);
    Route::get('/leads-report', [LeadController::class, 'report']);

    // Sub-Leads (nested under leads)
    Route::get('/leads/{lead}/sub-leads', [SubLeadController::class, 'index']);
    Route::post('/leads/{lead}/sub-leads', [SubLeadController::class, 'store']);
    Route::put('/leads/{lead}/sub-leads/{subLead}', [SubLeadController::class, 'update']);
    Route::delete('/leads/{lead}/sub-leads/{subLead}', [SubLeadController::class, 'destroy']);

    // Products
    Route::apiResource('products', ProductController::class);

    // Companies
    Route::apiResource('companies', CompanyController::class);

    // Outlets
    Route::apiResource('outlets', OutletController::class);

    // Roles & Permissions
    Route::apiResource('roles', RoleController::class);
    Route::get('/roles/{role}/permissions', [RoleController::class, 'permissions']);
    Route::put('/roles/{role}/permissions', [RoleController::class, 'syncPermissions']);
    Route::get('/permissions', [PermissionController::class, 'index']);
    Route::get('/permissions/grouped', [PermissionController::class, 'grouped']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);

    // Customer Statuses (master data)
    Route::get('/customer-statuses', [MasterDataController::class, 'customerStatuses']);
    Route::post('/customer-statuses', [MasterDataController::class, 'storeCustomerStatus']);
    Route::put('/customer-statuses/{id}', [MasterDataController::class, 'updateCustomerStatus']);
    Route::delete('/customer-statuses/{id}', [MasterDataController::class, 'destroyCustomerStatus']);
    Route::post('/customer-statuses/reorder', [MasterDataController::class, 'reorderCustomerStatuses']);

    // Lead Sources (master data)
    Route::get('/lead-sources', [MasterDataController::class, 'leadSources']);
    Route::post('/lead-sources', [MasterDataController::class, 'storeLeadSource']);
    Route::put('/lead-sources/{id}', [MasterDataController::class, 'updateLeadSource']);
    Route::delete('/lead-sources/{id}', [MasterDataController::class, 'destroyLeadSource']);

    // Indonesia Address API (cascading dropdown)
    Route::get('/indonesia/provinces', [MasterDataController::class, 'provinces']);
    Route::get('/indonesia/cities', [MasterDataController::class, 'cities']);
    Route::get('/indonesia/districts', [MasterDataController::class, 'districts']);
    Route::get('/indonesia/villages', [MasterDataController::class, 'villages']);
});
