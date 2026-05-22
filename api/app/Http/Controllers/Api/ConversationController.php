<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use Illuminate\Http\Request;

class ConversationController extends Controller
{
    public function index(Request $request)
    {
        $query = Conversation::where('user_id', $request->user()->id)
            ->with(['contact:id,name,phone,avatar_url', 'assignedAgent:id,full_name']);

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($search = $request->query('search')) {
            $query->whereHas('contact', fn($q) => $q->where('name', 'like', "%{$search}%")->orWhere('phone', 'like', "%{$search}%"));
        }

        $conversations = $query->orderBy('last_message_at', 'desc')->paginate(15);

        return response()->json(['success' => true, 'data' => $conversations, 'message' => 'Conversations retrieved.']);
    }

    public function show(Request $request, string $id)
    {
        $conversation = Conversation::where('user_id', $request->user()->id)
            ->with(['contact', 'messages' => fn($q) => $q->orderBy('created_at', 'desc')->limit(50)])
            ->findOrFail($id);

        return response()->json(['success' => true, 'data' => $conversation, 'message' => 'Conversation retrieved.']);
    }

    public function update(Request $request, string $id)
    {
        $validated = $request->validate([
            'status' => 'sometimes|string|in:open,closed,archived',
            'assigned_agent_id' => 'nullable|uuid|exists:users,id',
        ]);

        $conversation = Conversation::where('user_id', $request->user()->id)->findOrFail($id);
        $conversation->update($validated);

        return response()->json(['success' => true, 'data' => $conversation->load('contact'), 'message' => 'Conversation updated.']);
    }

    public function destroy(Request $request, string $id)
    {
        Conversation::where('user_id', $request->user()->id)->findOrFail($id)->delete();

        return response()->json(['success' => true, 'data' => null, 'message' => 'Conversation deleted.']);
    }
}
