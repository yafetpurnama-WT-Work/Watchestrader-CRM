<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Message;
use App\Models\Broadcast;
use App\Models\Automation;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class DashboardController extends Controller
{
    public function stats(Request $request)
    {
        $userId = $request->user()->id;
        $today = Carbon::today();

        try {
            $activeConversations = Conversation::where('user_id', $userId)
                ->where('status', 'open')
                ->count();

            $newContactsToday = Contact::where('user_id', $userId)
                ->whereDate('created_at', $today)
                ->count();

            $openDeals = Deal::where('user_id', $userId)
                ->where('status', 'open');

            $openDealsCount = $openDeals->count();
            $openDealsValue = $openDeals->sum('value');

            $messagesSentToday = Message::whereHas('conversation', function ($q) use ($userId) {
                $q->where('user_id', $userId);
            })
                ->where('sender_type', 'user')
                ->whereDate('created_at', $today)
                ->count();

            $totalContacts = Contact::where('user_id', $userId)->count();
            $totalBroadcasts = Broadcast::where('user_id', $userId)->count();
            $activeAutomations = Automation::where('user_id', $userId)
                ->where('is_active', true)
                ->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'active_conversations' => $activeConversations,
                    'new_contacts_today' => $newContactsToday,
                    'open_deals_count' => $openDealsCount,
                    'open_deals_value' => $openDealsValue,
                    'messages_sent_today' => $messagesSentToday,
                    'total_contacts' => $totalContacts,
                    'total_broadcasts' => $totalBroadcasts,
                    'active_automations' => $activeAutomations,
                ],
                'message' => 'Dashboard stats retrieved.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Failed to fetch dashboard stats: ' . $e->getMessage(),
            ], 500);
        }
    }
}
