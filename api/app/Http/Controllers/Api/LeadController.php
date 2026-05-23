<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\LeadHistory;
use App\Models\Notification;
use Illuminate\Http\Request;

class LeadController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = Lead::with(['customer', 'source', 'assignedTo', 'outlet', 'company'])
                ->withCount('subLeads')
                ->byVisibility($request->user());

            if ($search = $request->query('search')) {
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                        ->orWhereHas('customer', fn($cq) => $cq->where('name', 'like', "%{$search}%"));
                });
            }
            if ($status = $request->query('status')) {
                $query->where('status', $status);
            }
            if ($sourceId = $request->query('source_id')) {
                $query->where('source_id', $sourceId);
            }
            if ($assignedTo = $request->query('assigned_to')) {
                $query->where('assigned_to', $assignedTo);
            }
            if ($outletId = $request->query('outlet_id')) {
                $query->where('outlet_id', $outletId);
            }
            if ($dateFrom = $request->query('date_from')) {
                $query->whereDate('created_at', '>=', $dateFrom);
            }
            if ($dateTo = $request->query('date_to')) {
                $query->whereDate('created_at', '<=', $dateTo);
            }

            $leads = $query->orderByDesc('created_at')
                ->paginate($request->query('per_page', 25));

            return response()->json(['success' => true, 'data' => $leads, 'message' => 'Leads retrieved.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'required|uuid|exists:customers,id',
            'assigned_to' => 'nullable|uuid|exists:users,id',
            'source_id' => 'nullable|uuid|exists:lead_sources,id',
            'status' => 'nullable|in:junk,cold,mql,hot,deal_won,deal_lost',
            'title' => 'required|string|max:255',
            'notes' => 'nullable|string',
            'value' => 'nullable|numeric|min:0',
            'company_id' => 'nullable|uuid',
            'outlet_id' => 'nullable|uuid',
        ]);

        try {
            $lead = Lead::create(array_merge($validated, [
                'status' => $validated['status'] ?? 'cold',
                'created_by' => $request->user()->id,
                // 'updated_by' => $request->user()->id,
            ]));

            LeadHistory::create([
                'lead_id' => $lead->id,
                'action' => 'created',
                'to_status' => $lead->status,
                'notes' => 'Lead created.',
                'performed_by' => $request->user()->id,
            ]);

            // Notify assigned sales if different from creator
            if ($lead->assigned_to && $lead->assigned_to !== $request->user()->id) {
                Notification::create([
                    'user_id' => $lead->assigned_to,
                    'type' => 'lead_assigned',
                    'title' => 'New Lead Assigned',
                    'message' => "You have been assigned a new lead: {$lead->title}",
                    'link' => "/leads?id={$lead->id}",
                    'company_id' => $lead->company_id,
                    'outlet_id' => $lead->outlet_id,
                ]);
            }

            return response()->json([
                'success' => true,
                'data' => $lead->load(['customer', 'source', 'assignedTo']),
                'message' => 'Lead created.',
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }

    public function show(Request $request, string $id)
    {
        try {
            $lead = Lead::with([
                'customer',
                'source',
                'assignedTo',
                'outlet',
                'company',
                'subLeads.product',
                'history.performer',
                'creator',
                'updater',
            ])->findOrFail($id);

            return response()->json(['success' => true, 'data' => $lead, 'message' => 'Lead retrieved.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 404);
        }
    }

    public function update(Request $request, string $id)
    {
        $validated = $request->validate([
            'customer_id' => 'sometimes|uuid|exists:customers,id',
            'assigned_to' => 'nullable|uuid|exists:users,id',
            'source_id' => 'nullable|uuid|exists:lead_sources,id',
            'title' => 'sometimes|string|max:255',
            'notes' => 'nullable|string',
            'value' => 'nullable|numeric|min:0',
            'company_id' => 'nullable|uuid',
            'outlet_id' => 'nullable|uuid',
        ]);

        try {
            $lead = Lead::findOrFail($id);
            $lead->update(array_merge($validated, ['updated_by' => $request->user()->id]));

            return response()->json([
                'success' => true,
                'data' => $lead->load(['customer', 'source', 'assignedTo']),
                'message' => 'Lead updated.',
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }

    public function destroy(Request $request, string $id)
    {
        try {
            Lead::findOrFail($id)->delete();
            return response()->json(['success' => true, 'data' => null, 'message' => 'Lead deleted.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }

    public function changeStatus(Request $request, string $id)
    {
        $validated = $request->validate([
            'status' => 'required|in:junk,cold,mql,hot,deal_won,deal_lost',
            'notes' => 'nullable|string',
        ]);

        try {
            $lead = Lead::findOrFail($id);
            $oldStatus = $lead->status;

            $lead->update([
                'status' => $validated['status'],
                'updated_by' => $request->user()->id,
            ]);

            LeadHistory::create([
                'lead_id' => $lead->id,
                'action' => 'status_changed',
                'from_status' => $oldStatus,
                'to_status' => $validated['status'],
                'notes' => $validated['notes'] ?? null,
                'performed_by' => $request->user()->id,
            ]);

            // Notify assigned sales about status change
            if ($lead->assigned_to && $lead->assigned_to !== $request->user()->id) {
                Notification::create([
                    'user_id' => $lead->assigned_to,
                    'type' => 'lead_status_changed',
                    'title' => 'Lead Status Updated',
                    'message' => "Lead \"{$lead->title}\" changed from {$oldStatus} to {$validated['status']}.",
                    'link' => "/leads?id={$lead->id}",
                    'company_id' => $lead->company_id,
                    'outlet_id' => $lead->outlet_id,
                ]);
            }

            return response()->json([
                'success' => true,
                'data' => $lead->load(['customer', 'source']),
                'message' => 'Lead status changed.',
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }

    public function history(Request $request, string $id)
    {
        try {
            $history = LeadHistory::where('lead_id', $id)
                ->with('performer')
                ->orderByDesc('created_at')
                ->get();

            return response()->json(['success' => true, 'data' => $history, 'message' => 'Lead history retrieved.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }

    public function report(Request $request)
    {
        try {
            $query = Lead::byVisibility($request->user());

            if ($outletId = $request->query('outlet_id')) {
                $query->where('outlet_id', $outletId);
            }
            if ($dateFrom = $request->query('date_from')) {
                $query->whereDate('created_at', '>=', $dateFrom);
            }
            if ($dateTo = $request->query('date_to')) {
                $query->whereDate('created_at', '<=', $dateTo);
            }

            $total = (clone $query)->count();
            $newLeads = (clone $query)->where('status', 'cold')->count();
            $inWork = (clone $query)->whereIn('status', ['mql', 'hot'])->count();
            $deals = (clone $query)->whereIn('status', ['deal_won'])->count();
            $junk = (clone $query)->where('status', 'junk')->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'total_leads' => $total,
                    'new_leads' => $newLeads,
                    'in_work' => $inWork,
                    'deals' => $deals,
                    'junk' => $junk,
                    'conversion_rate' => $total > 0 ? round(($deals / $total) * 100, 1) : 0,
                ],
                'message' => 'Lead report retrieved.',
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }
}
