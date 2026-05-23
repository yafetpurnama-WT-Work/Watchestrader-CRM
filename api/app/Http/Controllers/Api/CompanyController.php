<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use Illuminate\Http\Request;

class CompanyController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = Company::withCount(['outlets', 'users']);
            if ($search = $request->query('search')) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")->orWhere('code', 'like', "%{$search}%");
                });
            }
            if ($request->query('is_active') !== null) {
                $query->where('is_active', filter_var($request->query('is_active'), FILTER_VALIDATE_BOOLEAN));
            }
            return response()->json(['success' => true, 'data' => $query->orderBy('name')->get(), 'message' => 'Companies retrieved.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:20|unique:companies',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email',
            'is_active' => 'nullable|boolean',
        ]);

        try {
            $company = Company::create(array_merge($validated, [
                'created_by' => $request->user()->id,
            ]));
            return response()->json(['success' => true, 'data' => $company, 'message' => 'Company created.'], 201);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }

    public function show(string $id)
    {
        try {
            $company = Company::with(['outlets', 'creator', 'updater'])->withCount(['users'])->findOrFail($id);
            return response()->json(['success' => true, 'data' => $company, 'message' => 'Company retrieved.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 404);
        }
    }

    public function update(Request $request, string $id)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email',
            'is_active' => 'nullable|boolean',
        ]);

        try {
            $company = Company::findOrFail($id);
            $company->update(array_merge($validated, ['updated_by' => $request->user()->id]));
            return response()->json(['success' => true, 'data' => $company, 'message' => 'Company updated.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }

    public function destroy(string $id)
    {
        try {
            Company::findOrFail($id)->delete();
            return response()->json(['success' => true, 'data' => null, 'message' => 'Company deleted.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }
}
