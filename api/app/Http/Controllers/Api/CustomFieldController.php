<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CustomField;
use Illuminate\Http\Request;

class CustomFieldController extends Controller
{
    public function index(Request $request)
    {
        $fields = CustomField::where('user_id', $request->user()->id)->orderBy('field_name')->get();

        return response()->json(['success' => true, 'data' => $fields, 'message' => 'Custom fields retrieved.']);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'field_name' => 'required|string|max:255',
            'field_type' => 'required|string|in:text,number,date,select,checkbox',
            'field_options' => 'nullable|array',
        ]);

        $field = CustomField::create(array_merge($validated, ['user_id' => $request->user()->id]));

        return response()->json(['success' => true, 'data' => $field, 'message' => 'Custom field created.'], 201);
    }

    public function update(Request $request, string $id)
    {
        $validated = $request->validate([
            'field_name' => 'sometimes|string|max:255',
            'field_type' => 'sometimes|string|in:text,number,date,select,checkbox',
            'field_options' => 'nullable|array',
        ]);

        $field = CustomField::where('user_id', $request->user()->id)->findOrFail($id);
        $field->update($validated);

        return response()->json(['success' => true, 'data' => $field, 'message' => 'Custom field updated.']);
    }

    public function destroy(Request $request, string $id)
    {
        CustomField::where('user_id', $request->user()->id)->findOrFail($id)->delete();

        return response()->json(['success' => true, 'data' => null, 'message' => 'Custom field deleted.']);
    }
}
