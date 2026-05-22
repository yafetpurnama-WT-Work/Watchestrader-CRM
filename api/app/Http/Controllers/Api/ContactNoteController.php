<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use App\Models\ContactNote;
use Illuminate\Http\Request;

class ContactNoteController extends Controller
{
    public function index(Request $request, string $contactId)
    {
        $contact = Contact::where('user_id', $request->user()->id)->findOrFail($contactId);

        $notes = $contact->notes()->with('user:id,full_name')->orderBy('created_at', 'desc')->paginate(15);

        return response()->json(['success' => true, 'data' => $notes, 'message' => 'Notes retrieved.']);
    }

    public function store(Request $request, string $contactId)
    {
        $validated = $request->validate(['note_text' => 'required|string']);

        $contact = Contact::where('user_id', $request->user()->id)->findOrFail($contactId);

        $note = $contact->notes()->create([
            'user_id' => $request->user()->id,
            'note_text' => $validated['note_text'],
        ]);

        return response()->json(['success' => true, 'data' => $note, 'message' => 'Note created.'], 201);
    }

    public function destroy(Request $request, string $contactId, string $id)
    {
        $contact = Contact::where('user_id', $request->user()->id)->findOrFail($contactId);
        $contact->notes()->findOrFail($id)->delete();

        return response()->json(['success' => true, 'data' => null, 'message' => 'Note deleted.']);
    }
}
