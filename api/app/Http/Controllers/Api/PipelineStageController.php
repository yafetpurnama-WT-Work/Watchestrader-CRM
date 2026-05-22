<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pipeline;
use App\Models\PipelineStage;
use Illuminate\Http\Request;

class PipelineStageController extends Controller
{
    public function index(Request $request, string $pipelineId)
    {
        $pipeline = Pipeline::where('user_id', $request->user()->id)->findOrFail($pipelineId);

        $stages = $pipeline->stages()->withCount('deals')->orderBy('position')->get();

        return response()->json(['success' => true, 'data' => $stages, 'message' => 'Stages retrieved.']);
    }

    public function store(Request $request, string $pipelineId)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'position' => 'required|integer',
            'color' => 'nullable|string|max:20',
        ]);

        $pipeline = Pipeline::where('user_id', $request->user()->id)->findOrFail($pipelineId);
        $stage = $pipeline->stages()->create($validated);

        return response()->json(['success' => true, 'data' => $stage, 'message' => 'Stage created.'], 201);
    }

    public function update(Request $request, string $pipelineId, string $id)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'position' => 'sometimes|integer',
            'color' => 'nullable|string|max:20',
        ]);

        $pipeline = Pipeline::where('user_id', $request->user()->id)->findOrFail($pipelineId);
        $stage = $pipeline->stages()->findOrFail($id);
        $stage->update($validated);

        return response()->json(['success' => true, 'data' => $stage, 'message' => 'Stage updated.']);
    }

    public function destroy(Request $request, string $pipelineId, string $id)
    {
        $pipeline = Pipeline::where('user_id', $request->user()->id)->findOrFail($pipelineId);
        $pipeline->stages()->findOrFail($id)->delete();

        return response()->json(['success' => true, 'data' => null, 'message' => 'Stage deleted.']);
    }

    public function reorder(Request $request, string $pipelineId)
    {
        $validated = $request->validate([
            'stages' => 'required|array',
            'stages.*.id' => 'required|uuid',
            'stages.*.position' => 'required|integer',
        ]);

        $pipeline = Pipeline::where('user_id', $request->user()->id)->findOrFail($pipelineId);

        foreach ($validated['stages'] as $item) {
            $pipeline->stages()->where('id', $item['id'])->update(['position' => $item['position']]);
        }

        return response()->json(['success' => true, 'data' => null, 'message' => 'Stages reordered.']);
    }
}
