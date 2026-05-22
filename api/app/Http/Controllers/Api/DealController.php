<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Deal;
use Illuminate\Http\Request;

class DealController extends Controller
{
    public function index(Request $request)
    {
        $query = Deal::where('user_id', $request->user()->id)
            ->with(['contact:id,name,phone', 'pipeline:id,name', 'stage:id,name,color']);

        if ($pipelineId = $request->query('pipeline_id')) {
            $query->where('pipeline_id', $pipelineId);
        }
        if ($stageId = $request->query('stage_id')) {
            $query->where('stage_id', $stageId);
        }
        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        if ($assignedTo = $request->query('assigned_to')) {
            $query->where('assigned_to', $assignedTo);
        }

        $deals = $query->orderBy('created_at', 'desc')->paginate(15);

        return response()->json(['success' => true, 'data' => $deals, 'message' => 'Deals retrieved.']);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'pipeline_id' => 'required|uuid|exists:pipelines,id',
            'stage_id' => 'required|uuid|exists:pipeline_stages,id',
            'contact_id' => 'nullable|uuid|exists:contacts,id',
            'assigned_to' => 'nullable|uuid|exists:users,id',
            'value' => 'nullable|numeric|min:0',
            'currency' => 'nullable|string|max:10',
            'notes' => 'nullable|string',
            'expected_close_date' => 'nullable|date',
        ]);

        $deal = Deal::create(array_merge($validated, ['user_id' => $request->user()->id]));

        return response()->json([
            'success' => true,
            'data' => $deal->load(['contact', 'pipeline', 'stage']),
            'message' => 'Deal created.',
        ], 201);
    }

    public function show(Request $request, string $id)
    {
        $deal = Deal::where('user_id', $request->user()->id)
            ->with(['contact', 'pipeline', 'stage', 'assignedUser:id,full_name'])
            ->findOrFail($id);

        return response()->json(['success' => true, 'data' => $deal, 'message' => 'Deal retrieved.']);
    }

    public function update(Request $request, string $id)
    {
        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'stage_id' => 'sometimes|uuid|exists:pipeline_stages,id',
            'contact_id' => 'nullable|uuid',
            'assigned_to' => 'nullable|uuid',
            'value' => 'nullable|numeric|min:0',
            'currency' => 'nullable|string|max:10',
            'notes' => 'nullable|string',
            'expected_close_date' => 'nullable|date',
            'status' => 'sometimes|string|in:open,won,lost',
        ]);

        $deal = Deal::where('user_id', $request->user()->id)->findOrFail($id);
        $deal->update($validated);

        return response()->json([
            'success' => true,
            'data' => $deal->load(['contact', 'pipeline', 'stage']),
            'message' => 'Deal updated.',
        ]);
    }

    public function destroy(Request $request, string $id)
    {
        Deal::where('user_id', $request->user()->id)->findOrFail($id)->delete();

        return response()->json(['success' => true, 'data' => null, 'message' => 'Deal deleted.']);
    }
}
