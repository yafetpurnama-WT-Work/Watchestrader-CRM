<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ContactController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = Contact::where('user_id', $request->user()->id)->with('tags');

            if ($search = $request->query('search')) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            }

            if ($tagId = $request->query('tag_id')) {
                $query->whereHas('tags', fn($q) => $q->where('tags.id', $tagId));
            }

            $contacts = $query->orderBy('created_at', 'desc')->paginate($request->query('per_page', 15));

            return response()->json(['success' => true, 'data' => $contacts, 'message' => 'Contacts retrieved.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'phone' => 'required|string',
            'name' => 'required|string|max:255',
            'email' => 'nullable|email',
            'company' => 'nullable|string',
            'avatar_url' => 'nullable|string',
            'tag_ids' => 'nullable|array',
        ]);

        try {
            $contact = Contact::create(array_merge(
                collect($validated)->except('tag_ids')->toArray(),
                ['user_id' => $request->user()->id]
            ));

            if (!empty($validated['tag_ids'])) {
                $syncData = collect($validated['tag_ids'])->mapWithKeys(function ($id) {
                    return [$id => ['id' => Str::uuid()->toString()]];
                })->toArray();
                $contact->tags()->sync($syncData);
            }

            return response()->json([
                'success' => true,
                'data' => $contact->load('tags'),
                'message' => 'Contact created.',
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }

    public function show(Request $request, string $id)
    {
        try {
            $contact = Contact::where('user_id', $request->user()->id)
                ->with(['tags', 'notes', 'customValues.customField', 'conversations', 'creator', 'updater'])
                ->findOrFail($id);

            return response()->json(['success' => true, 'data' => $contact, 'message' => 'Contact retrieved.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 404);
        }
    }

    public function update(Request $request, string $id)
    {
        $validated = $request->validate([
            'phone' => 'sometimes|string',
            'name' => 'sometimes|string|max:255',
            'email' => 'nullable|email',
            'company' => 'nullable|string',
            'avatar_url' => 'nullable|string',
            'tag_ids' => 'nullable|array',
        ]);

        try {
            $contact = Contact::where('user_id', $request->user()->id)->findOrFail($id);
            $contact->update(collect($validated)->except('tag_ids')->toArray());

            if (isset($validated['tag_ids'])) {
                $syncData = collect($validated['tag_ids'])->mapWithKeys(function ($id) {
                    return [$id => ['id' => Str::uuid()->toString()]];
                })->toArray();
                $contact->tags()->sync($syncData);
            }

            return response()->json([
                'success' => true,
                'data' => $contact->load('tags'),
                'message' => 'Contact updated.',
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }

    public function destroy(Request $request, string $id)
    {
        try {
            Contact::where('user_id', $request->user()->id)->findOrFail($id)->delete();
            return response()->json(['success' => true, 'data' => null, 'message' => 'Contact deleted.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }

    public function tags(Request $request, string $id)
    {
        try {
            $contact = Contact::where('user_id', $request->user()->id)->findOrFail($id);
            return response()->json(['success' => true, 'data' => $contact->tags, 'message' => 'Tags retrieved.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }

    public function syncTags(Request $request, string $id)
    {
        $validated = $request->validate(['tag_ids' => 'required|array']);

        try {
            $contact = Contact::where('user_id', $request->user()->id)->findOrFail($id);
            $syncData = collect($validated['tag_ids'])->mapWithKeys(function ($id) {
                return [$id => ['id' => Str::uuid()->toString()]];
            })->toArray();
            $contact->tags()->sync($syncData);
            return response()->json(['success' => true, 'data' => $contact->tags()->get(), 'message' => 'Tags synced.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }

    public function customValues(Request $request, string $id)
    {
        try {
            $contact = Contact::where('user_id', $request->user()->id)->findOrFail($id);
            $values = $contact->customValues()->with('customField')->get();
            return response()->json(['success' => true, 'data' => $values, 'message' => 'Custom values retrieved.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }

    public function updateCustomValues(Request $request, string $id)
    {
        $validated = $request->validate([
            'values' => 'required|array',
            'values.*.custom_field_id' => 'required|string',
            'values.*.value' => 'nullable|string',
        ]);

        try {
            $contact = Contact::where('user_id', $request->user()->id)->findOrFail($id);

            foreach ($validated['values'] as $entry) {
                $contact->customValues()->updateOrCreate(
                    ['custom_field_id' => $entry['custom_field_id']],
                    ['value' => $entry['value'] ?? '']
                );
            }

            return response()->json([
                'success' => true,
                'data' => $contact->customValues()->with('customField')->get(),
                'message' => 'Custom values updated.',
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }

    public function deals(Request $request, string $id)
    {
        try {
            $contact = Contact::where('user_id', $request->user()->id)->findOrFail($id);
            $deals = \App\Models\Deal::where('contact_id', $contact->id)
                ->with('pipeline', 'stage')
                ->orderByDesc('created_at')
                ->get();
            return response()->json(['success' => true, 'data' => $deals, 'message' => 'Deals retrieved.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }

    public function import(Request $request)
    {
        $validated = $request->validate([
            'contacts' => 'required|array|min:1',
            'contacts.*.phone' => 'required|string',
            'contacts.*.name' => 'required|string|max:255',
            'contacts.*.email' => 'nullable|email',
            'contacts.*.company' => 'nullable|string',
        ]);

        $userId = $request->user()->id;
        $imported = 0;
        $failed = 0;

        foreach ($validated['contacts'] as $row) {
            try {
                Contact::create(array_merge($row, ['user_id' => $userId]));
                $imported++;
            } catch (\Exception $e) {
                $failed++;
            }
        }

        return response()->json([
            'success' => true,
            'data' => ['imported' => $imported, 'failed' => $failed],
            'message' => "{$imported} contacts imported, {$failed} failed.",
        ]);
    }
}
