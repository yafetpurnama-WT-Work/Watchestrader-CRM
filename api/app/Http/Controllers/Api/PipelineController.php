<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pipeline;
use App\Models\PipelineStage;
use Illuminate\Http\Request;

class PipelineController extends Controller
{
    public function index(Request $request)
    {
        $pipelines = Pipeline::where('user_id', $request->user()->id)
            ->withCount(['stages', 'deals'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['success' => true, 'data' => $pipelines, 'message' => 'Pipelines retrieved.']);
    }

    public function store(Request $request)
    {
        $validated = $request->validate(['name' => 'required|string|max:255']);

        $pipeline = Pipeline::create(['name' => $validated['name'], 'user_id' => $request->user()->id]);

        // Auto-create default stages
        $defaultStages = [
            ['name' => 'New', 'position' => 0, 'color' => '#6366f1'],
            ['name' => 'Qualified', 'position' => 1, 'color' => '#3b82f6'],
            ['name' => 'Proposal', 'position' => 2, 'color' => '#f59e0b'],
            ['name' => 'Negotiation', 'position' => 3, 'color' => '#f97316'],
            ['name' => 'Won', 'position' => 4, 'color' => '#22c55e'],
            ['name' => 'Lost', 'position' => 5, 'color' => '#ef4444'],
        ];

        foreach ($defaultStages as $stage) {
            $pipeline->stages()->create($stage);
        }

        return response()->json([
            'success' => true,
            'data' => $pipeline->load('stages'),
            'message' => 'Pipeline created with default stages.',
        ], 201);
    }

    public function show(Request $request, string $id)
    {
        $pipeline = Pipeline::where('user_id', $request->user()->id)
            ->with(['stages' => fn($q) => $q->orderBy('position'), 'deals.contact', 'deals.stage'])
            ->findOrFail($id);

        return response()->json(['success' => true, 'data' => $pipeline, 'message' => 'Pipeline retrieved.']);
    }

    public function update(Request $request, string $id)
    {
        $validated = $request->validate(['name' => 'required|string|max:255']);

        $pipeline = Pipeline::where('user_id', $request->user()->id)->findOrFail($id);
        $pipeline->update($validated);

        return response()->json(['success' => true, 'data' => $pipeline, 'message' => 'Pipeline updated.']);
    }

    public function destroy(Request $request, string $id)
    {
        Pipeline::where('user_id', $request->user()->id)->findOrFail($id)->delete();

        return response()->json(['success' => true, 'data' => null, 'message' => 'Pipeline deleted.']);
    }
}
