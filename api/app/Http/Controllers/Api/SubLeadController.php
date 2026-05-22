<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SubLead;
use App\Models\LeadHistory;
use Illuminate\Http\Request;

class SubLeadController extends Controller
{
    public function index(Request $request, string $leadId)
    {
        try {
            $subLeads = SubLead::where('lead_id', $leadId)
                ->with('product')
                ->orderByDesc('created_at')
                ->get();

            return response()->json(['success' => true, 'data' => $subLeads, 'message' => 'Sub-leads retrieved.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request, string $leadId)
    {
        $validated = $request->validate([
            'product_id' => 'nullable|uuid|exists:products,id',
            'title' => 'required|string|max:255',
            'notes' => 'nullable|string',
            'value' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:junk,cold,mql,hot,deal_won,deal_lost',
        ]);

        try {
            $subLead = SubLead::create(array_merge($validated, [
                'lead_id' => $leadId,
                'status' => $validated['status'] ?? 'cold',
                'created_by' => $request->user()->id,
            ]));

            LeadHistory::create([
                'lead_id' => $leadId,
                'action' => 'sub_lead_added',
                'notes' => "Sub-lead \"{$subLead->title}\" added.",
                'performed_by' => $request->user()->id,
            ]);

            return response()->json([
                'success' => true,
                'data' => $subLead->load('product'),
                'message' => 'Sub-lead created.',
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, string $leadId, string $id)
    {
        $validated = $request->validate([
            'product_id' => 'nullable|uuid|exists:products,id',
            'title' => 'sometimes|string|max:255',
            'notes' => 'nullable|string',
            'value' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:junk,cold,mql,hot,deal_won,deal_lost',
        ]);

        try {
            $subLead = SubLead::where('lead_id', $leadId)->findOrFail($id);
            $oldStatus = $subLead->status;
            $subLead->update($validated);

            if (isset($validated['status']) && $oldStatus !== $validated['status']) {
                LeadHistory::create([
                    'lead_id' => $leadId,
                    'action' => 'sub_lead_status_changed',
                    'from_status' => $oldStatus,
                    'to_status' => $validated['status'],
                    'notes' => "Sub-lead \"{$subLead->title}\" status changed.",
                    'performed_by' => $request->user()->id,
                ]);
            }

            return response()->json([
                'success' => true,
                'data' => $subLead->load('product'),
                'message' => 'Sub-lead updated.',
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }

    public function destroy(Request $request, string $leadId, string $id)
    {
        try {
            SubLead::where('lead_id', $leadId)->findOrFail($id)->delete();
            return response()->json(['success' => true, 'data' => null, 'message' => 'Sub-lead deleted.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }
}
