<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Automation;
use Illuminate\Http\Request;

class AutomationController extends Controller
{
    public function index(Request $request)
    {
        $automations = Automation::where('user_id', $request->user()->id)
            ->withCount('steps')
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json(['success' => true, 'data' => $automations, 'message' => 'Automations retrieved.']);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'trigger_type' => 'required|string',
            'trigger_config' => 'nullable|array',
        ]);

        $automation = Automation::create(array_merge($validated, ['user_id' => $request->user()->id]));

        return response()->json(['success' => true, 'data' => $automation, 'message' => 'Automation created.'], 201);
    }

    public function show(Request $request, string $id)
    {
        $automation = Automation::where('user_id', $request->user()->id)
            ->with(['steps' => fn($q) => $q->orderBy('position'), 'logs' => fn($q) => $q->latest()->limit(10)])
            ->findOrFail($id);

        return response()->json(['success' => true, 'data' => $automation, 'message' => 'Automation retrieved.']);
    }

    public function update(Request $request, string $id)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'trigger_type' => 'sometimes|string',
            'trigger_config' => 'nullable|array',
        ]);

        $automation = Automation::where('user_id', $request->user()->id)->findOrFail($id);
        $automation->update($validated);

        return response()->json(['success' => true, 'data' => $automation, 'message' => 'Automation updated.']);
    }

    public function destroy(Request $request, string $id)
    {
        Automation::where('user_id', $request->user()->id)->findOrFail($id)->delete();

        return response()->json(['success' => true, 'data' => null, 'message' => 'Automation deleted.']);
    }

    public function toggle(Request $request, string $id)
    {
        $automation = Automation::where('user_id', $request->user()->id)->findOrFail($id);
        $automation->update(['is_active' => !$automation->is_active]);

        $status = $automation->is_active ? 'activated' : 'deactivated';

        return response()->json(['success' => true, 'data' => $automation, 'message' => "Automation {$status}."]);
    }

    public function duplicate(Request $request, string $id)
    {
        $automation = Automation::where('user_id', $request->user()->id)->with('steps')->findOrFail($id);

        $newAutomation = $automation->replicate();
        $newAutomation->name = $automation->name . ' (Copy)';
        $newAutomation->is_active = false;
        $newAutomation->execution_count = 0;
        $newAutomation->last_executed_at = null;
        $newAutomation->save();

        // Duplicate steps with new parent IDs
        $idMap = [];
        foreach ($automation->steps()->orderBy('position')->get() as $step) {
            $newStep = $step->replicate();
            $newStep->automation_id = $newAutomation->id;
            $newStep->save();
            $idMap[$step->id] = $newStep->id;
        }

        // Remap parent_step_id references
        foreach ($newAutomation->steps as $step) {
            if ($step->parent_step_id && isset($idMap[$step->parent_step_id])) {
                $step->update(['parent_step_id' => $idMap[$step->parent_step_id]]);
            }
        }

        return response()->json([
            'success' => true,
            'data' => $newAutomation->load('steps'),
            'message' => 'Automation duplicated.',
        ], 201);
    }

    public function logs(Request $request, string $id)
    {
        $automation = Automation::where('user_id', $request->user()->id)->findOrFail($id);
        $logs = $automation->logs()
            ->with('contact:id,name,phone')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json(['success' => true, 'data' => $logs, 'message' => 'Logs retrieved.']);
    }

    public function steps(Request $request, string $id)
    {
        $automation = Automation::where('user_id', $request->user()->id)->findOrFail($id);
        $steps = $automation->steps()->orderBy('position')->get();

        return response()->json(['success' => true, 'data' => $steps, 'message' => 'Steps retrieved.']);
    }

    public function saveSteps(Request $request, string $id)
    {
        $validated = $request->validate(['steps' => 'required|array']);

        $automation = Automation::where('user_id', $request->user()->id)->findOrFail($id);

        // Delete existing steps and recreate
        $automation->steps()->delete();

        foreach ($validated['steps'] as $stepData) {
            \App\Models\AutomationStep::create(array_merge($stepData, [
                'automation_id' => $automation->id,
            ]));
        }

        return response()->json([
            'success' => true,
            'data' => $automation->steps()->orderBy('position')->get(),
            'message' => 'Steps saved.',
        ]);
    }
}
