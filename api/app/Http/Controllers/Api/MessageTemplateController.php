<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MessageTemplate;
use Illuminate\Http\Request;

class MessageTemplateController extends Controller
{
    public function index(Request $request)
    {
        $templates = MessageTemplate::where('user_id', $request->user()->id)->orderBy('name')->paginate(15);

        return response()->json(['success' => true, 'data' => $templates, 'message' => 'Templates retrieved.']);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string',
            'language' => 'required|string',
            'header_type' => 'nullable|string',
            'header_content' => 'nullable|string',
            'body_text' => 'required|string',
            'footer_text' => 'nullable|string',
            'buttons' => 'nullable|array',
        ]);

        $template = MessageTemplate::create(array_merge($validated, ['user_id' => $request->user()->id]));

        return response()->json(['success' => true, 'data' => $template, 'message' => 'Template created.'], 201);
    }

    public function show(Request $request, string $id)
    {
        $template = MessageTemplate::where('user_id', $request->user()->id)->findOrFail($id);

        return response()->json(['success' => true, 'data' => $template, 'message' => 'Template retrieved.']);
    }

    public function update(Request $request, string $id)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'category' => 'sometimes|string',
            'language' => 'sometimes|string',
            'header_type' => 'nullable|string',
            'header_content' => 'nullable|string',
            'body_text' => 'sometimes|string',
            'footer_text' => 'nullable|string',
            'buttons' => 'nullable|array',
            'status' => 'sometimes|string',
        ]);

        $template = MessageTemplate::where('user_id', $request->user()->id)->findOrFail($id);
        $template->update($validated);

        return response()->json(['success' => true, 'data' => $template, 'message' => 'Template updated.']);
    }

    public function destroy(Request $request, string $id)
    {
        MessageTemplate::where('user_id', $request->user()->id)->findOrFail($id)->delete();

        return response()->json(['success' => true, 'data' => null, 'message' => 'Template deleted.']);
    }
}
