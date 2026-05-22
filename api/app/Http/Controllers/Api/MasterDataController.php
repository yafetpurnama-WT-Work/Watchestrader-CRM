<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CustomerStatus;
use App\Models\LeadSource;
use App\Models\IndonesiaProvince;
use App\Models\IndonesiaCity;
use App\Models\IndonesiaDistrict;
use App\Models\IndonesiaVillage;
use Illuminate\Http\Request;

class MasterDataController extends Controller
{
    // --- Customer Statuses ---

    public function customerStatuses()
    {
        try {
            $statuses = CustomerStatus::ordered()->get();
            return response()->json(['success' => true, 'data' => $statuses, 'message' => 'Customer statuses retrieved.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }

    public function storeCustomerStatus(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'slug' => 'required|string|max:50|unique:customer_statuses',
            'color' => 'nullable|string|max:7',
            'position' => 'nullable|integer',
            'is_default' => 'nullable|boolean',
        ]);

        try {
            $status = CustomerStatus::create($validated);
            return response()->json(['success' => true, 'data' => $status, 'message' => 'Customer status created.'], 201);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }

    public function updateCustomerStatus(Request $request, string $id)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:100',
            'color' => 'nullable|string|max:7',
            'position' => 'nullable|integer',
            'is_default' => 'nullable|boolean',
        ]);

        try {
            $status = CustomerStatus::findOrFail($id);
            $status->update($validated);
            return response()->json(['success' => true, 'data' => $status, 'message' => 'Customer status updated.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }

    public function destroyCustomerStatus(string $id)
    {
        try {
            CustomerStatus::findOrFail($id)->delete();
            return response()->json(['success' => true, 'data' => null, 'message' => 'Customer status deleted.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }

    public function reorderCustomerStatuses(Request $request)
    {
        $validated = $request->validate(['ids' => 'required|array']);

        try {
            foreach ($validated['ids'] as $i => $id) {
                CustomerStatus::where('id', $id)->update(['position' => $i + 1]);
            }
            return response()->json(['success' => true, 'data' => null, 'message' => 'Statuses reordered.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }

    // --- Lead Sources ---

    public function leadSources(Request $request)
    {
        try {
            $query = LeadSource::query();
            if ($request->query('is_active') !== null) {
                $query->where('is_active', filter_var($request->query('is_active'), FILTER_VALIDATE_BOOLEAN));
            }
            return response()->json(['success' => true, 'data' => $query->orderBy('name')->get(), 'message' => 'Lead sources retrieved.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }

    public function storeLeadSource(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'code' => 'required|string|max:20|unique:lead_sources',
            'icon' => 'nullable|string',
            'color' => 'nullable|string|max:7',
            'is_active' => 'nullable|boolean',
        ]);

        try {
            $source = LeadSource::create($validated);
            return response()->json(['success' => true, 'data' => $source, 'message' => 'Lead source created.'], 201);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }

    public function updateLeadSource(Request $request, string $id)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:100',
            'icon' => 'nullable|string',
            'color' => 'nullable|string|max:7',
            'is_active' => 'nullable|boolean',
        ]);

        try {
            $source = LeadSource::findOrFail($id);
            $source->update($validated);
            return response()->json(['success' => true, 'data' => $source, 'message' => 'Lead source updated.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }

    public function destroyLeadSource(string $id)
    {
        try {
            LeadSource::findOrFail($id)->delete();
            return response()->json(['success' => true, 'data' => null, 'message' => 'Lead source deleted.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'data' => null, 'message' => $e->getMessage()], 500);
        }
    }

    // --- Indonesia Address API (Proxy to emsifa/api-wilayah-indonesia) ---
    // Source: BPS / Kemendagri via GitHub Pages CDN (MIT License)
    // ## No local database required — backend acts as proxy to avoid CORS issues. ##

    private const REGION_API = 'https://emsifa.github.io/api-wilayah-indonesia/api';

    private function fetchRegion(string $path): ?array
    {
        try {
            $response = \Illuminate\Support\Facades\Http::timeout(15)
                ->retry(2, 300)
                ->get(self::REGION_API . $path);

            if ($response->successful()) {
                return collect($response->json())->map(function ($item) {
                    return [
                        'code' => $item['id'],
                        'name' => \Illuminate\Support\Str::title(strtolower($item['name'])),
                    ];
                })->toArray();
            }
        } catch (\Exception $e) {
        }
        return null;
    }

    public function provinces()
    {
        $cacheKey = 'indonesia_provinces';
        $data = cache()->remember($cacheKey, 3600, function () {
            return $this->fetchRegion('/provinces.json');
        });

        if ($data === null) {
            return response()->json(['success' => false, 'data' => [], 'message' => 'Failed to fetch provinces from external API.'], 502);
        }

        return response()->json(['success' => true, 'data' => $data, 'message' => 'Provinces retrieved.']);
    }

    public function cities(Request $request)
    {
        $provinceCode = $request->query('province_code');
        if (!$provinceCode) {
            return response()->json(['success' => false, 'data' => [], 'message' => 'province_code is required.'], 422);
        }

        $cacheKey = "indonesia_cities_{$provinceCode}";
        $data = cache()->remember($cacheKey, 3600, function () use ($provinceCode) {
            return $this->fetchRegion("/regencies/{$provinceCode}.json");
        });

        if ($data === null) {
            return response()->json(['success' => false, 'data' => [], 'message' => 'Failed to fetch cities.'], 502);
        }

        return response()->json(['success' => true, 'data' => $data, 'message' => 'Cities retrieved.']);
    }

    public function districts(Request $request)
    {
        $cityCode = $request->query('city_code');
        if (!$cityCode) {
            return response()->json(['success' => false, 'data' => [], 'message' => 'city_code is required.'], 422);
        }

        $cacheKey = "indonesia_districts_{$cityCode}";
        $data = cache()->remember($cacheKey, 3600, function () use ($cityCode) {
            return $this->fetchRegion("/districts/{$cityCode}.json");
        });

        if ($data === null) {
            return response()->json(['success' => false, 'data' => [], 'message' => 'Failed to fetch districts.'], 502);
        }

        return response()->json(['success' => true, 'data' => $data, 'message' => 'Districts retrieved.']);
    }

    public function villages(Request $request)
    {
        $districtCode = $request->query('district_code');
        if (!$districtCode) {
            return response()->json(['success' => false, 'data' => [], 'message' => 'district_code is required.'], 422);
        }

        $cacheKey = "indonesia_villages_{$districtCode}";
        $data = cache()->remember($cacheKey, 3600, function () use ($districtCode) {
            return $this->fetchRegion("/villages/{$districtCode}.json");
        });

        if ($data === null) {
            return response()->json(['success' => false, 'data' => [], 'message' => 'Failed to fetch villages.'], 502);
        }

        return response()->json(['success' => true, 'data' => $data, 'message' => 'Villages retrieved.']);
    }
}
