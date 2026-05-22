<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use Illuminate\Http\Request;

class PermissionController extends Controller
{
    public function index()
    {
        try {
            $permissions = Permission::orderBy('module')->orderBy('action')->get();
            return response()->json(['success' => true, 'data' => $permissions, 'message' => 'Permissions retrieved.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }

    public function grouped()
    {
        try {
            $permissions = Permission::orderBy('module')->orderBy('action')->get()->groupBy('module');
            return response()->json(['success' => true, 'data' => $permissions, 'message' => 'Grouped permissions retrieved.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }
}
