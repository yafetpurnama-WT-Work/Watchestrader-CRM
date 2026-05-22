<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Broadcast;
use Illuminate\Http\Request;

class BroadcastController extends Controller
{
    public function index(Request $request)
    {
        $broadcasts = Broadcast::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json(['success' => true, 'data' => $broadcasts, 'message' => 'Broadcasts retrieved.']);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'template_name' => 'required|string',
            'template_language' => 'required|string',
            'template_variables' => 'nullable|array',
            'audience_filter' => 'nullable|array',
            'scheduled_at' => 'nullable|date',
        ]);

        $broadcast = Broadcast::create(array_merge($validated, ['user_id' => $request->user()->id]));

        return response()->json(['success' => true, 'data' => $broadcast, 'message' => 'Broadcast created.'], 201);
    }

    public function show(Request $request, string $id)
    {
        $broadcast = Broadcast::where('user_id', $request->user()->id)
            ->withCount([
                'recipients as pending_count' => fn($q) => $q->where('status', 'pending'),
                'recipients as sent_count' => fn($q) => $q->where('status', 'sent'),
                'recipients as delivered_count' => fn($q) => $q->where('status', 'delivered'),
                'recipients as failed_count' => fn($q) => $q->where('status', 'failed'),
            ])
            ->findOrFail($id);

        return response()->json(['success' => true, 'data' => $broadcast, 'message' => 'Broadcast retrieved.']);
    }

    public function update(Request $request, string $id)
    {
        $broadcast = Broadcast::where('user_id', $request->user()->id)->where('status', 'draft')->findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'template_name' => 'sometimes|string',
            'template_language' => 'sometimes|string',
            'template_variables' => 'nullable|array',
            'audience_filter' => 'nullable|array',
            'scheduled_at' => 'nullable|date',
        ]);

        $broadcast->update($validated);

        return response()->json(['success' => true, 'data' => $broadcast, 'message' => 'Broadcast updated.']);
    }

    public function destroy(Request $request, string $id)
    {
        Broadcast::where('user_id', $request->user()->id)->findOrFail($id)->delete();

        return response()->json(['success' => true, 'data' => null, 'message' => 'Broadcast deleted.']);
    }

    public function recipients(Request $request, string $id)
    {
        $broadcast = Broadcast::where('user_id', $request->user()->id)->findOrFail($id);
        $recipients = $broadcast->recipients()
            ->with('contact:id,name,phone')
            ->orderBy('created_at', 'desc')
            ->paginate(50);

        return response()->json(['success' => true, 'data' => $recipients, 'message' => 'Recipients retrieved.']);
    }
}
