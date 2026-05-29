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
            $query = Lead::with(['customer', 'source', 'status', 'assignedTo', 'outlet', 'company'])
                ->withCount('subLeads')
                ->byVisibility($request->user());

            if ($search = $request->query('search')) {
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                        ->orWhereHas('customer', fn($cq) => $cq->where('name', 'like', "%{$search}%"));
                });
            }
            if ($statusId = $request->query('status_id')) {
                $query->where('status_id', $statusId);
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
            'status_id' => 'required|uuid|exists:lead_statuses,id',
            'title' => 'required|string|max:255',
            'notes' => 'nullable|string',
            'value' => 'nullable|numeric|min:0',
            'company_id' => 'nullable|uuid',
            'outlet_id' => 'nullable|uuid',
        ]);

        try {
            $lead = Lead::create(array_merge($validated, [
                'created_by' => $request->user()->id,
                // 'updated_by' => $request->user()->id,
            ]));

            LeadHistory::create([
                'lead_id' => $lead->id,
                'action' => 'created',
                'to_status' => $lead->status_id,
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
                'data' => $lead->load(['customer', 'source', 'status', 'assignedTo']),
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
                'status',
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
            'status_id' => 'sometimes|uuid|exists:lead_statuses,id',
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
                'data' => $lead->load(['customer', 'source', 'status', 'assignedTo']),
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
            'status_id' => 'required|uuid|exists:lead_statuses,id',
            'notes' => 'nullable|string',
        ]);

        try {
            $lead = Lead::findOrFail($id);
            $oldStatusId = $lead->status_id;

            $lead->update([
                'status_id' => $validated['status_id'],
                'updated_by' => $request->user()->id,
            ]);

            LeadHistory::create([
                'lead_id' => $lead->id,
                'action' => 'status_changed',
                'from_status' => $oldStatusId,
                'to_status' => $validated['status_id'],
                'notes' => $validated['notes'] ?? null,
                'performed_by' => $request->user()->id,
            ]);

            // Notify assigned sales about status change
            if ($lead->assigned_to && $lead->assigned_to !== $request->user()->id) {
                Notification::create([
                    'user_id' => $lead->assigned_to,
                    'type' => 'lead_status_changed',
                    'title' => 'Lead Status Updated',
                    'message' => "Lead \"{$lead->title}\" status changed.",
                    'link' => "/leads?id={$lead->id}",
                    'company_id' => $lead->company_id,
                    'outlet_id' => $lead->outlet_id,
                ]);
            }

            return response()->json([
                'success' => true,
                'data' => $lead->load(['customer', 'source', 'status']),
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

            if ($companyId = $request->query('company_id')) {
                $query->where('leads.company_id', $companyId);
            }
            if ($outletId = $request->query('outlet_id')) {
                $query->where('leads.outlet_id', $outletId);
            }
            if ($dateFrom = $request->query('date_from')) {
                $query->whereDate('leads.created_at', '>=', $dateFrom);
            }
            if ($dateTo = $request->query('date_to')) {
                $query->whereDate('leads.created_at', '<=', $dateTo);
            }

            // 1. Summary
            $totalLeads = (clone $query)->count();
            
            $wonLeadsQuery = (clone $query)->whereHas('status', fn($q) => $q->where('slug', 'deal-won'));
            $totalWon = $wonLeadsQuery->count();
            $totalRevenue = $wonLeadsQuery->sum('value');
            
            $winRate = $totalLeads > 0 ? round(($totalWon / $totalLeads) * 100, 1) : 0;
            $activePipelines = \App\Models\Pipeline::count(); // Use total pipelines

            // 2. Charts
            $byStatus = (clone $query)
                ->join('lead_statuses', 'leads.status_id', '=', 'lead_statuses.id')
                ->selectRaw('lead_statuses.name, count(leads.id) as count')
                ->groupBy('lead_statuses.name')
                ->get();

            $bySource = (clone $query)
                ->join('lead_sources', 'leads.source_id', '=', 'lead_sources.id')
                ->selectRaw('lead_sources.name, count(leads.id) as value')
                ->groupBy('lead_sources.name')
                ->get();

            $trend = (clone $query)
                ->selectRaw('DATE_FORMAT(leads.created_at, "%b") as month, MONTH(leads.created_at) as month_num, count(leads.id) as leads, sum(leads.value) as revenue')
                ->groupBy('month', 'month_num')
                ->orderBy('month_num')
                ->get()
                ->map(function ($item) {
                    return [
                        'month' => $item->month,
                        'leads' => $item->leads,
                        'revenue' => (float) $item->revenue,
                    ];
                })
                ->values();

            // 3. Table
            $table = (clone $query)
                ->join('lead_sources', 'leads.source_id', '=', 'lead_sources.id')
                ->leftJoin('lead_statuses', 'leads.status_id', '=', 'lead_statuses.id')
                ->selectRaw('
                    lead_sources.name as source,
                    count(leads.id) as leads,
                    sum(case when lead_statuses.slug = "deal-won" then 1 else 0 end) as won,
                    sum(case when lead_statuses.slug = "deal-won" then leads.value else 0 end) as revenue
                ')
                ->groupBy('lead_sources.name')
                ->get()
                ->map(function ($item) {
                    $leads = (int) $item->leads;
                    $won = (int) $item->won;
                    return [
                        'source' => $item->source,
                        'leads' => $leads,
                        'won' => $won,
                        'conversion' => $leads > 0 ? round(($won / $leads) * 100, 1) : 0,
                        'revenue' => (float) $item->revenue,
                    ];
                });

            // 4. Sales KPI (for export) — detailed per-status breakdown
            $salesKpi = (clone $query)
                ->leftJoin('users', 'leads.assigned_to', '=', 'users.id')
                ->leftJoin('lead_statuses', 'leads.status_id', '=', 'lead_statuses.id')
                ->selectRaw('
                    COALESCE(users.full_name, "Unassigned") as sales_name,
                    count(leads.id) as total,
                    sum(case when lead_statuses.slug = "cold" then 1 else 0 end) as new_leads,
                    sum(case when lead_statuses.slug in ("mql", "hot") then 1 else 0 end) as in_work,
                    sum(case when lead_statuses.slug = "deal-won" then 1 else 0 end) as won,
                    sum(case when lead_statuses.slug = "junk" then 1 else 0 end) as lost,
                    sum(case when lead_statuses.slug = "deal-won" then leads.value else 0 end) as revenue,
                    COALESCE(users.email, "-") as sales_email
                ')
                ->groupBy('sales_name', 'sales_email')
                ->orderByRaw('won DESC, total DESC')
                ->get()
                ->values()
                ->map(function ($item, $index) {
                    $total = (int) $item->total;
                    $won = (int) $item->won;
                    return [
                        'rank' => $index + 1,
                        'sales_name' => $item->sales_name,
                        'sales_email' => $item->sales_email,
                        'new_leads' => (int) $item->new_leads,
                        'in_work' => (int) $item->in_work,
                        'won' => $won,
                        'lost' => (int) $item->lost,
                        'total' => $total,
                        'conversion' => $total > 0 ? round(($won / $total) * 100, 1) : 0,
                        'revenue' => (float) $item->revenue,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => [
                    'summary' => [
                        'totalLeads' => $totalLeads,
                        'winRate' => $winRate,
                        'totalRevenue' => (float) $totalRevenue,
                        'activePipelines' => $activePipelines,
                    ],
                    'charts' => [
                        'byStatus' => $byStatus,
                        'bySource' => $bySource,
                        'trend' => $trend,
                    ],
                    'table' => $table,
                    'sales_kpi' => $salesKpi,
                ],
                'message' => 'Lead report retrieved.',
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }
}
