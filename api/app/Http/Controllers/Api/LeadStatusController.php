<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LeadStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class LeadStatusController extends Controller
{
    public function index(Request $request)
    {
        try {
            $statuses = LeadStatus::orderBy('position', 'asc')->get();
            return response()->json(['success' => true, 'data' => $statuses, 'message' => 'Lead statuses retrieved.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:lead_statuses,slug',
            'color' => 'nullable|string|max:50',
            'position' => 'nullable|integer',
            'is_default' => 'nullable|boolean',
        ]);

        try {
            if (empty($validated['slug'])) {
                $validated['slug'] = Str::slug($validated['name']);
            }

            if (!empty($validated['is_default']) && $validated['is_default']) {
                LeadStatus::where('is_default', true)->update(['is_default' => false]);
            }

            $status = LeadStatus::create(array_merge($validated, [
                'created_by' => $request->user()->id,
                'position' => $validated['position'] ?? LeadStatus::max('position') + 1,
            ]));

            return response()->json(['success' => true, 'data' => $status, 'message' => 'Lead status created.'], 201);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, string $id)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'slug' => 'sometimes|string|max:255|unique:lead_statuses,slug,' . $id,
            'color' => 'nullable|string|max:50',
            'position' => 'nullable|integer',
            'is_default' => 'nullable|boolean',
        ]);

        try {
            $status = LeadStatus::findOrFail($id);

            if (isset($validated['slug']) && empty($validated['slug'])) {
                $validated['slug'] = Str::slug($validated['name'] ?? $status->name);
            }

            if (!empty($validated['is_default']) && $validated['is_default']) {
                LeadStatus::where('is_default', true)->where('id', '!=', $id)->update(['is_default' => false]);
            }

            $status->update(array_merge($validated, [
                'updated_by' => $request->user()->id,
            ]));

            return response()->json(['success' => true, 'data' => $status, 'message' => 'Lead status updated.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }

    public function destroy(Request $request, string $id)
    {
        try {
            $status = LeadStatus::findOrFail($id);
            if ($status->is_default) {
                return response()->json(['success' => false, 'data' => null, 'message' => 'Cannot delete default status.'], 400);
            }
            $status->delete();
            return response()->json(['success' => true, 'data' => null, 'message' => 'Lead status deleted.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }

    public function reorder(Request $request)
    {
        $validated = $request->validate([
            'ordered_ids' => 'required|array',
            'ordered_ids.*' => 'required|uuid|exists:lead_statuses,id',
        ]);

        try {
            foreach ($validated['ordered_ids'] as $index => $id) {
                LeadStatus::where('id', $id)->update(['position' => $index + 1]);
            }
            return response()->json(['success' => true, 'data' => null, 'message' => 'Lead statuses reordered.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }
}
