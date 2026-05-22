<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    public function index(Request $request, string $conversationId)
    {
        $conversation = Conversation::where('user_id', $request->user()->id)->findOrFail($conversationId);

        $messages = $conversation->messages()
            ->with('reactions')
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json(['success' => true, 'data' => $messages, 'message' => 'Messages retrieved.']);
    }

    public function store(Request $request, string $conversationId)
    {
        $validated = $request->validate([
            'content_type' => 'required|string|in:text,image,video,audio,document,template',
            'content_text' => 'nullable|string',
            'media_url' => 'nullable|string',
            'template_name' => 'nullable|string',
            'reply_to_message_id' => 'nullable|uuid',
        ]);

        $conversation = Conversation::where('user_id', $request->user()->id)->findOrFail($conversationId);

        $message = $conversation->messages()->create(array_merge($validated, [
            'sender_type' => 'user',
            'sender_id' => $request->user()->id,
            'status' => 'sent',
        ]));

        // Update conversation last message
        $conversation->update([
            'last_message_text' => $validated['content_text'] ?? '[Media]',
            'last_message_at' => now(),
        ]);

        return response()->json(['success' => true, 'data' => $message, 'message' => 'Message sent.'], 201);
    }

    public function update(Request $request, string $conversationId, string $id)
    {
        $validated = $request->validate([
            'status' => 'required|string|in:sent,delivered,read,failed',
        ]);

        $conversation = Conversation::where('user_id', $request->user()->id)->findOrFail($conversationId);
        $message = $conversation->messages()->findOrFail($id);
        $message->update($validated);

        return response()->json(['success' => true, 'data' => $message, 'message' => 'Message updated.']);
    }
}
