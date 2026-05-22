<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Outlet;
use Illuminate\Http\Request;

class OutletController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = Outlet::with('company')->withCount(['users', 'customers']);
            if ($search = $request->query('search')) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")->orWhere('code', 'like', "%{$search}%")->orWhere('city', 'like', "%{$search}%");
                });
            }
            if ($companyId = $request->query('company_id')) {
                $query->where('company_id', $companyId);
            }
            if ($request->query('is_active') !== null) {
                $query->where('is_active', filter_var($request->query('is_active'), FILTER_VALIDATE_BOOLEAN));
            }
            return response()->json(['success' => true, 'data' => $query->orderBy('name')->get(), 'message' => 'Outlets retrieved.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'company_id' => 'required|uuid|exists:companies,id',
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:20|unique:outlets',
            'city' => 'required|string|max:255',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:20',
            'is_active' => 'nullable|boolean',
        ]);

        try {
            $outlet = Outlet::create(array_merge($validated, [
                'created_by' => $request->user()->id,
                'updated_by' => $request->user()->id,
            ]));
            return response()->json(['success' => true, 'data' => $outlet->load('company'), 'message' => 'Outlet created.'], 201);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }

    public function show(string $id)
    {
        try {
            $outlet = Outlet::with('company')->withCount(['users', 'customers'])->findOrFail($id);
            return response()->json(['success' => true, 'data' => $outlet, 'message' => 'Outlet retrieved.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 404);
        }
    }

    public function update(Request $request, string $id)
    {
        $validated = $request->validate([
            'company_id' => 'sometimes|uuid|exists:companies,id',
            'name' => 'sometimes|string|max:255',
            'city' => 'sometimes|string|max:255',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:20',
            'is_active' => 'nullable|boolean',
        ]);

        try {
            $outlet = Outlet::findOrFail($id);
            $outlet->update(array_merge($validated, ['updated_by' => $request->user()->id]));
            return response()->json(['success' => true, 'data' => $outlet->load('company'), 'message' => 'Outlet updated.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }

    public function destroy(string $id)
    {
        try {
            Outlet::findOrFail($id)->delete();
            return response()->json(['success' => true, 'data' => null, 'message' => 'Outlet deleted.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }
}
