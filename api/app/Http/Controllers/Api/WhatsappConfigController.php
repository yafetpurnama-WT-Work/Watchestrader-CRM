<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WhatsappConfig;
use Illuminate\Http\Request;

class WhatsappConfigController extends Controller
{
    public function show(Request $request)
    {
        $config = WhatsappConfig::where('user_id', $request->user()->id)->first();

        return response()->json(['success' => true, 'data' => $config, 'message' => 'WhatsApp config retrieved.']);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'phone_number_id' => 'required|string',
            'waba_id' => 'required|string',
            'access_token' => 'required|string',
            'verify_token' => 'nullable|string',
        ]);

        $config = WhatsappConfig::updateOrCreate(
            ['user_id' => $request->user()->id],
            array_merge($validated, ['status' => 'connected'])
        );

        return response()->json(['success' => true, 'data' => $config, 'message' => 'WhatsApp config saved.'], 201);
    }

    public function destroy(Request $request)
    {
        WhatsappConfig::where('user_id', $request->user()->id)->delete();

        return response()->json(['success' => true, 'data' => null, 'message' => 'WhatsApp config removed.']);
    }
}
