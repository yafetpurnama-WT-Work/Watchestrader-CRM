<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = Product::with('outlet');

            if ($search = $request->query('search')) {
                $query->where(function ($q) use ($search) {
                    $q->where('brand', 'like', "%{$search}%")
                        ->orWhere('model', 'like', "%{$search}%")
                        ->orWhere('reference_number', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            }
            if ($brand = $request->query('brand')) {
                $query->where('brand', $brand);
            }
            if ($condition = $request->query('condition')) {
                $query->where('condition', $condition);
            }
            if ($availability = $request->query('availability')) {
                $query->where('availability', $availability);
            }
            if ($category = $request->query('category')) {
                $query->where('category', $category);
            }
            if ($outletId = $request->query('outlet_id')) {
                $query->where('outlet_id', $outletId);
            }

            $products = $query->orderByDesc('created_at')
                ->paginate($request->query('per_page', 25));

            return response()->json(['success' => true, 'data' => $products, 'message' => 'Products retrieved.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'brand' => 'required|string|max:255',
            'model' => 'required|string|max:255',
            'reference_number' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'year' => 'nullable|integer|min:1900|max:2100',
            'condition' => 'nullable|in:unworn,pre_owned',
            'category' => 'nullable|in:man,ladies,others',
            'movement_type' => 'nullable|string|max:100',
            'case_material' => 'nullable|string|max:100',
            'case_size' => 'nullable|string|max:50',
            'dial_color' => 'nullable|string|max:100',
            'strap_material' => 'nullable|string|max:100',
            'bezel_type' => 'nullable|string|max:100',
            'documentation' => 'nullable|string|max:100',
            'availability' => 'nullable|in:ready_stock,pre_order,sold',
            'price' => 'required|numeric|min:0',
            'discount_price' => 'nullable|numeric|min:0',
            'discount_percent' => 'nullable|integer|min:0|max:100',
            'currency' => 'nullable|string|max:5',
            'image_url' => 'nullable|string',
            'outlet_id' => 'nullable|uuid',
        ]);

        try {
            $product = Product::create(array_merge($validated, [
                'created_by' => $request->user()->id,
            ]));

            return response()->json([
                'success' => true,
                'data' => $product->load('outlet'),
                'message' => 'Product created.',
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }

    public function show(string $id)
    {
        try {
            $product = Product::with(['outlet', 'creator', 'updater'])->findOrFail($id);
            return response()->json(['success' => true, 'data' => $product, 'message' => 'Product retrieved.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 404);
        }
    }

    public function update(Request $request, string $id)
    {
        $validated = $request->validate([
            'brand' => 'sometimes|string|max:255',
            'model' => 'sometimes|string|max:255',
            'reference_number' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'year' => 'nullable|integer|min:1900|max:2100',
            'condition' => 'nullable|in:unworn,pre_owned',
            'category' => 'nullable|in:man,ladies,others',
            'movement_type' => 'nullable|string|max:100',
            'case_material' => 'nullable|string|max:100',
            'case_size' => 'nullable|string|max:50',
            'dial_color' => 'nullable|string|max:100',
            'strap_material' => 'nullable|string|max:100',
            'bezel_type' => 'nullable|string|max:100',
            'documentation' => 'nullable|string|max:100',
            'availability' => 'nullable|in:ready_stock,pre_order,sold',
            'price' => 'sometimes|numeric|min:0',
            'discount_price' => 'nullable|numeric|min:0',
            'discount_percent' => 'nullable|integer|min:0|max:100',
            'image_url' => 'nullable|string',
            'outlet_id' => 'nullable|uuid',
            'is_active' => 'nullable|boolean',
        ]);

        try {
            $product = Product::findOrFail($id);
            $product->update(array_merge($validated, ['updated_by' => $request->user()->id]));

            return response()->json([
                'success' => true,
                'data' => $product->load('outlet'),
                'message' => 'Product updated.',
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }

    public function destroy(string $id)
    {
        try {
            Product::findOrFail($id)->delete();
            return response()->json(['success' => true, 'data' => null, 'message' => 'Product deleted.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }
}
