<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\Permission;
use Illuminate\Http\Request;

class RoleController extends Controller
{
    public function index()
    {
        try {
            $roles = Role::withCount(['users', 'permissions'])->orderBy('level', 'desc')->get();
            return response()->json(['success' => true, 'data' => $roles, 'message' => 'Roles retrieved.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:50|unique:roles',
            'description' => 'nullable|string',
            'level' => 'required|integer|min:0|max:100',
            'is_active' => 'nullable|boolean',
        ]);

        try {
            $role = Role::create($validated);
            return response()->json(['success' => true, 'data' => $role, 'message' => 'Role created.'], 201);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }

    public function show(string $id)
    {
        try {
            $role = Role::with('permissions')->withCount('users')->findOrFail($id);
            return response()->json(['success' => true, 'data' => $role, 'message' => 'Role retrieved.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 404);
        }
    }

    public function update(Request $request, string $id)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'level' => 'sometimes|integer|min:0|max:100',
            'is_active' => 'nullable|boolean',
        ]);

        try {
            $role = Role::findOrFail($id);
            $role->update($validated);
            return response()->json(['success' => true, 'data' => $role, 'message' => 'Role updated.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }

    public function destroy(string $id)
    {
        try {
            $role = Role::findOrFail($id);
            if ($role->users()->count() > 0) {
                return response()->json(['success' => false, 'data' => null, 'message' => 'Cannot delete role with assigned users.'], 422);
            }
            $role->delete();
            return response()->json(['success' => true, 'data' => null, 'message' => 'Role deleted.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }

    public function permissions(string $id)
    {
        try {
            $role = Role::findOrFail($id);
            return response()->json(['success' => true, 'data' => $role->permissions, 'message' => 'Permissions retrieved.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }

    public function syncPermissions(Request $request, string $id)
    {
        $validated = $request->validate(['permission_ids' => 'required|array']);

        try {
            $role = Role::findOrFail($id);
            $role->permissions()->sync($validated['permission_ids']);
            return response()->json(['success' => true, 'data' => $role->permissions()->get(), 'message' => 'Permissions synced.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }
}
