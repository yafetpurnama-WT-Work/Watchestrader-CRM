<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = Notification::forUser($request->user()->id);

            if (filter_var($request->query('unread_only'), FILTER_VALIDATE_BOOLEAN)) {
                $query->unread();
            }

            $notifications = $query->orderByDesc('created_at')
                ->paginate($request->query('per_page', 25));

            return response()->json(['success' => true, 'data' => $notifications, 'message' => 'Notifications retrieved.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }

    public function markRead(Request $request, string $id)
    {
        try {
            $notification = Notification::where('user_id', $request->user()->id)->findOrFail($id);
            $notification->update(['read_at' => now()]);
            return response()->json(['success' => true, 'data' => $notification, 'message' => 'Notification marked as read.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }

    public function markAllRead(Request $request)
    {
        try {
            Notification::where('user_id', $request->user()->id)
                ->whereNull('read_at')
                ->update(['read_at' => now()]);
            return response()->json(['success' => true, 'data' => null, 'message' => 'All notifications marked as read.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }

    public function unreadCount(Request $request)
    {
        try {
            $count = Notification::where('user_id', $request->user()->id)->whereNull('read_at')->count();
            return response()->json(['success' => true, 'data' => ['count' => $count], 'message' => 'Unread count retrieved.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }
}
