<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\CustomerStatusHistory;
use App\Models\Contact;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = Customer::with(['status', 'outlet', 'assignedSales', 'company'])
                ->byVisibility($request->user());

            if ($search = $request->query('search')) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            }

            if ($statusId = $request->query('status_id')) {
                $query->where('status_id', $statusId);
            }
            if ($outletId = $request->query('outlet_id')) {
                $query->where('outlet_id', $outletId);
            }
            if ($salesId = $request->query('assigned_sales_id')) {
                $query->where('assigned_sales_id', $salesId);
            }

            $customers = $query->orderByDesc('created_at')
                ->paginate($request->query('per_page', 25));

            return response()->json(['success' => true, 'data' => $customers, 'message' => 'Customers retrieved.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        if ($request->has('phone')) {
            $request->merge([
                'phone' => $this->normalizePhone($request->input('phone'))
            ]);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|regex:/^0[0-9]{8,13}$/',
            'email' => 'required|email|max:255',
            'address' => 'nullable|string',
            'province_code' => 'required|string|max:2',
            'city_code' => 'required|string|max:4',
            'district_code' => 'required|string|max:7',
            'village_code' => 'required|string|max:10',
            'rt' => 'nullable|string|max:5',
            'rw' => 'nullable|string|max:5',
            'postal_code' => 'nullable|string|max:5',
            'company_id' => 'required|uuid|exists:companies,id',
            'outlet_id' => 'required|uuid|exists:outlets,id',
            'assigned_sales_id' => 'nullable|uuid|exists:users,id',
            'status_id' => 'required|uuid|exists:customer_statuses,id',
            'source' => 'required|string',
        ], [
            'phone.regex' => 'The phone number must be a valid Indonesian number (8-13 digits after +62).',
        ]);

        try {
            $customer = Customer::create(array_merge($validated, [
                'created_by' => $request->user()->id,
            ]));

            // Auto-sync to Contact
            $companyName = $customer->company ? $customer->company->name : null;
            if (!$companyName && $customer->outlet && $customer->outlet->company) {
                $companyName = $customer->outlet->company->name;
            }

            Contact::firstOrCreate(
                [
                    'phone' => $customer->phone,
                    'user_id' => $request->user()->id,
                ],
                [
                    'name' => $customer->name,
                    'email' => $customer->email,
                    'company' => $companyName,
                    'customer_id' => $customer->id,
                ]
            );

            return response()->json([
                'success' => true,
                'data' => $customer->load(['status', 'outlet', 'assignedSales']),
                'message' => 'Customer created.',
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }

    public function show(Request $request, string $id)
    {
        try {
            $customer = Customer::with([
                'status',
                'outlet',
                'company',
                'assignedSales',
                'province',
                'city',
                'district',
                'village',
                'creator',
                'updater',
            ])->findOrFail($id);

            return response()->json(['success' => true, 'data' => $customer, 'message' => 'Customer retrieved.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 404);
        }
    }

    public function update(Request $request, string $id)
    {
        if ($request->has('phone')) {
            $request->merge([
                'phone' => $this->normalizePhone($request->input('phone'))
            ]);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'phone' => 'sometimes|string|regex:/^0[0-9]{8,13}$/',
            'email' => 'sometimes|email|max:255',
            'address' => 'nullable|string',
            'province_code' => 'sometimes|string|max:2',
            'city_code' => 'sometimes|string|max:4',
            'district_code' => 'sometimes|string|max:7',
            'village_code' => 'sometimes|string|max:10',
            'rt' => 'nullable|string|max:5',
            'rw' => 'nullable|string|max:5',
            'postal_code' => 'nullable|string|max:5',
            'company_id' => 'sometimes|uuid|exists:companies,id',
            'outlet_id' => 'sometimes|uuid|exists:outlets,id',
            'assigned_sales_id' => 'nullable|uuid|exists:users,id',
            'status_id' => 'sometimes|uuid|exists:customer_statuses,id',
            'source' => 'sometimes|string',
        ], [
            'phone.regex' => 'The phone number must be a valid Indonesian number (8-13 digits after +62).',
        ]);

        try {
            $customer = Customer::findOrFail($id);
            $customer->update(array_merge($validated, ['updated_by' => $request->user()->id]));

            // Auto-sync updates to Contact
            $contact = Contact::where('customer_id', $customer->id)->first();
            if ($contact) {
                $contact->update([
                    'name' => $customer->name,
                    'email' => $customer->email,
                    'phone' => $customer->phone,
                ]);
            }

            return response()->json([
                'success' => true,
                'data' => $customer->load(['status', 'outlet', 'assignedSales']),
                'message' => 'Customer updated.',
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }

    public function destroy(Request $request, string $id)
    {
        try {
            Customer::findOrFail($id)->delete();
            return response()->json(['success' => true, 'data' => null, 'message' => 'Customer deleted.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }

    public function changeStatus(Request $request, string $id)
    {
        $validated = $request->validate([
            'status_id' => 'required|uuid|exists:customer_statuses,id',
            'notes' => 'nullable|string',
        ]);

        try {
            $customer = Customer::findOrFail($id);
            $oldStatusId = $customer->status_id;

            $customer->update([
                'status_id' => $validated['status_id'],
                'updated_by' => $request->user()->id,
            ]);

            CustomerStatusHistory::create([
                'customer_id' => $customer->id,
                'from_status_id' => $oldStatusId,
                'to_status_id' => $validated['status_id'],
                'changed_by' => $request->user()->id,
                'notes' => $validated['notes'] ?? null,
            ]);

            return response()->json([
                'success' => true,
                'data' => $customer->load('status'),
                'message' => 'Customer status changed.',
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }

    public function statusHistory(Request $request, string $id)
    {
        try {
            $history = CustomerStatusHistory::where('customer_id', $id)
                ->with(['fromStatus', 'toStatus', 'changedByUser'])
                ->orderByDesc('created_at')
                ->get();

            return response()->json(['success' => true, 'data' => $history, 'message' => 'Status history retrieved.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Normalize phone number to 0-prefixed format.
     */
    private function normalizePhone(?string $phone): ?string
    {
        if (empty($phone)) {
            return $phone;
        }

        // Remove all non-digits except +
        $phone = preg_replace('/[^\d+]/', '', $phone);

        if (str_starts_with($phone, '+62')) {
            $phone = '0' . substr($phone, 3);
        } elseif (str_starts_with($phone, '62')) {
            $phone = '0' . substr($phone, 2);
        } elseif (!str_starts_with($phone, '0') && $phone !== '') {
            $phone = '0' . $phone;
        }

        return $phone;
    }
}
