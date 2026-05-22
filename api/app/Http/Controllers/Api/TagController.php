<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tag;
use Illuminate\Http\Request;

class TagController extends Controller
{
    public function index(Request $request)
    {
        $tags = Tag::where('user_id', $request->user()->id)
            ->withCount('contacts')
            ->orderBy('name')
            ->get();

        return response()->json(['success' => true, 'data' => $tags, 'message' => 'Tags retrieved.']);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'color' => 'nullable|string|max:20',
        ]);

        $tag = Tag::create(array_merge($validated, ['user_id' => $request->user()->id]));

        return response()->json(['success' => true, 'data' => $tag, 'message' => 'Tag created.'], 201);
    }

    public function show(Request $request, string $id)
    {
        $tag = Tag::where('user_id', $request->user()->id)->withCount('contacts')->findOrFail($id);

        return response()->json(['success' => true, 'data' => $tag, 'message' => 'Tag retrieved.']);
    }

    public function update(Request $request, string $id)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:100',
            'color' => 'nullable|string|max:20',
        ]);

        $tag = Tag::where('user_id', $request->user()->id)->findOrFail($id);
        $tag->update($validated);

        return response()->json(['success' => true, 'data' => $tag, 'message' => 'Tag updated.']);
    }

    public function destroy(Request $request, string $id)
    {
        Tag::where('user_id', $request->user()->id)->findOrFail($id)->delete();

        return response()->json(['success' => true, 'data' => null, 'message' => 'Tag deleted.']);
    }
}
