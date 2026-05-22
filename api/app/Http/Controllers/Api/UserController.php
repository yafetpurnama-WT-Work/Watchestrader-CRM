<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = User::with(['roleRelation', 'company', 'companies', 'outlet', 'supervisor']);

            if ($search = $request->query('search')) {
                $query->where(function ($q) use ($search) {
                    $q->where('full_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            }
            if ($roleId = $request->query('role_id')) {
                $query->where('role_id', $roleId);
            }
            if ($companyId = $request->query('company_id')) {
                $query->where('company_id', $companyId);
            }
            if ($outletId = $request->query('outlet_id')) {
                $query->where('outlet_id', $outletId);
            }
            if ($status = $request->query('status')) {
                $query->where('status', $status);
            }

            $users = $query->orderByDesc('created_at')
                ->paginate($request->query('per_page', 25));

            return response()->json(['success' => true, 'data' => $users, 'message' => 'Users retrieved.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:8',
            'phone' => 'nullable|string|max:20',
            'role' => 'nullable|string',
            'role_id' => 'nullable|uuid|exists:roles,id',
            'company_id' => 'nullable|uuid|exists:companies,id',
            'company_ids' => 'nullable|array',
            'company_ids.*' => 'uuid|exists:companies,id',
            'outlet_id' => 'nullable|uuid|exists:outlets,id',
            'supervisor_id' => 'nullable|uuid|exists:users,id',
            'status' => 'nullable|in:active,inactive,suspended',
        ]);

        try {
            $validated['password'] = Hash::make($validated['password']);

            // Extract company_ids before creating user
            $companyIds = $validated['company_ids'] ?? [];
            unset($validated['company_ids']);

            // Set primary company_id from first company in the list
            if (!empty($companyIds)) {
                $validated['company_id'] = $companyIds[0];
            }

            $user = User::create($validated);

            // Sync many-to-many companies
            if (!empty($companyIds)) {
                $user->companies()->sync($companyIds);
            }

            return response()->json([
                'success' => true,
                'data' => $user->load(['roleRelation', 'company', 'companies', 'outlet']),
                'message' => 'User created.',
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }

    public function show(string $id)
    {
        try {
            $user = User::with(['roleRelation.permissions', 'company', 'outlet', 'supervisor'])->findOrFail($id);
            return response()->json(['success' => true, 'data' => $user, 'message' => 'User retrieved.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 404);
        }
    }

    public function update(Request $request, string $id)
    {
        $validated = $request->validate([
            'full_name' => 'sometimes|string|max:255',
            'email' => "sometimes|email|unique:users,email,{$id}",
            'password' => 'nullable|string|min:8',
            'phone' => 'nullable|string|max:20',
            'role' => 'nullable|string',
            'role_id' => 'nullable|uuid|exists:roles,id',
            'company_id' => 'nullable|uuid|exists:companies,id',
            'company_ids' => 'nullable|array',
            'company_ids.*' => 'uuid|exists:companies,id',
            'outlet_id' => 'nullable|uuid|exists:outlets,id',
            'supervisor_id' => 'nullable|uuid|exists:users,id',
            'status' => 'nullable|in:active,inactive,suspended',
        ]);

        try {
            $user = User::findOrFail($id);

            if (!empty($validated['password'])) {
                $validated['password'] = Hash::make($validated['password']);
            } else {
                unset($validated['password']);
            }

            // Extract company_ids before updating user
            $companyIds = $validated['company_ids'] ?? null;
            unset($validated['company_ids']);

            // Set primary company_id from first company in the list
            if ($companyIds !== null) {
                $validated['company_id'] = !empty($companyIds) ? $companyIds[0] : null;
            }

            $user->update($validated);

            // Sync many-to-many companies if provided
            if ($companyIds !== null) {
                $user->companies()->sync($companyIds);
            }

            return response()->json([
                'success' => true,
                'data' => $user->load(['roleRelation', 'company', 'companies', 'outlet']),
                'message' => 'User updated.',
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }

    public function destroy(string $id)
    {
        try {
            User::findOrFail($id)->delete();
            return response()->json(['success' => true, 'data' => null, 'message' => 'User deleted.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }

    public function activate(Request $request, string $id)
    {
        try {
            $user = User::findOrFail($id);
            $user->update(['status' => 'active']);
            return response()->json(['success' => true, 'data' => $user, 'message' => 'User activated.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }

    public function deactivate(Request $request, string $id)
    {
        try {
            $user = User::findOrFail($id);
            $user->update(['status' => 'inactive']);
            return response()->json(['success' => true, 'data' => $user, 'message' => 'User deactivated.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }
}
