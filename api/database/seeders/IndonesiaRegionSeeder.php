<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

/**
 * Seed Indonesia administrative regions from emsifa/api-wilayah-indonesia.
 *
 * Source: https://github.com/emsifa/api-wilayah-indonesia
 * Data origin: Badan Pusat Statistik (BPS) / Kemendagri
 * License: MIT
 *
 * Usage:
 *   php artisan db:seed --class=IndonesiaRegionSeeder
 *
 * Note: Full seeding (incl. villages) takes 15-30 minutes due to ~7000 API calls.
 *       Provinces + cities + districts take ~3-5 minutes.
 */
class IndonesiaRegionSeeder extends Seeder
{
    private const BASE_URL = 'https://emsifa.github.io/api-wilayah-indonesia/api';

    public function run(): void
    {
        $this->command->info('🇮🇩 Seeding Indonesia regions from emsifa/api-wilayah-indonesia...');
        $this->command->info('   Data source: BPS / Kemendagri via GitHub Pages (MIT License)');
        $this->command->newLine();

        // Check if already seeded
        $existingProvinces = DB::table('indonesia_provinces')->count();
        if ($existingProvinces > 0) {
            $this->command->warn("Tables already contain data ({$existingProvinces} provinces). Truncating...");
            // Disable FK checks for truncation
            DB::statement('SET FOREIGN_KEY_CHECKS=0');
            DB::table('indonesia_villages')->truncate();
            DB::table('indonesia_districts')->truncate();
            DB::table('indonesia_cities')->truncate();
            DB::table('indonesia_provinces')->truncate();
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
        }

        // ── 1. Provinces ──
        $this->command->info('📍 [1/4] Fetching provinces...');
        $provinces = $this->fetch('/provinces.json');
        if (empty($provinces)) {
            $this->command->error('❌ Failed to fetch provinces. Check your internet connection.');
            return;
        }

        $provinceRows = [];
        foreach ($provinces as $p) {
            $provinceRows[] = ['code' => $p['id'], 'name' => $p['name']];
        }
        foreach (array_chunk($provinceRows, 50) as $chunk) {
            DB::table('indonesia_provinces')->insert($chunk);
        }
        $this->command->info("   ✅ {$this->count($provinceRows)} provinces inserted.");

        // ── 2. Cities / Regencies ──
        $this->command->info('📍 [2/4] Fetching cities/regencies...');
        $cityRows = [];
        foreach ($provinces as $idx => $p) {
            $cities = $this->fetch("/regencies/{$p['id']}.json");
            if ($cities) {
                foreach ($cities as $c) {
                    $type = str_starts_with(strtoupper($c['name']), 'KOTA ') ? 'Kota' : 'Kabupaten';
                    $cityRows[] = [
                        'province_code' => $p['id'],
                        'code' => $c['id'],
                        'name' => $c['name'],
                        'type' => $type,
                    ];
                }
            }
        }
        foreach (array_chunk($cityRows, 100) as $chunk) {
            DB::table('indonesia_cities')->insert($chunk);
        }
        $this->command->info("   ✅ {$this->count($cityRows)} cities/regencies inserted.");

        // ── 3. Districts (Kecamatan) ──
        $this->command->info('📍 [3/4] Fetching districts (kecamatan)...');
        $this->command->info('   This may take 2-5 minutes...');
        $districtRows = [];
        $total = count($cityRows);
        foreach ($cityRows as $i => $c) {
            $districts = $this->fetch("/districts/{$c['code']}.json");
            if ($districts) {
                foreach ($districts as $d) {
                    $districtRows[] = [
                        'city_code' => $c['code'],
                        'code' => $d['id'],
                        'name' => $d['name'],
                    ];
                }
            }
            if (($i + 1) % 50 === 0 || ($i + 1) === $total) {
                $pct = round(($i + 1) / $total * 100);
                $this->command->info("   ... {$pct}% ({$i}/{$total} cities processed)");
            }
        }
        foreach (array_chunk($districtRows, 200) as $chunk) {
            DB::table('indonesia_districts')->insert($chunk);
        }
        $this->command->info("   ✅ {$this->count($districtRows)} districts inserted.");

        // ── 4. Villages (Kelurahan/Desa) ──
        $this->command->info('📍 [4/4] Fetching villages (kelurahan/desa)...');
        $this->command->info('   This will take 15-30 minutes (~7000 API calls)...');
        $villageBatch = [];
        $totalVillages = 0;
        $totalDistricts = count($districtRows);
        foreach ($districtRows as $i => $d) {
            $villages = $this->fetch("/villages/{$d['code']}.json");
            if ($villages) {
                foreach ($villages as $v) {
                    $villageBatch[] = [
                        'district_code' => $d['code'],
                        'code' => $v['id'],
                        'name' => $v['name'],
                        'postal_code' => null,
                    ];
                }
            }

            // Flush batch periodically to save memory
            if (count($villageBatch) >= 3000) {
                foreach (array_chunk($villageBatch, 500) as $chunk) {
                    DB::table('indonesia_villages')->insert($chunk);
                }
                $totalVillages += count($villageBatch);
                $villageBatch = [];
            }

            if (($i + 1) % 500 === 0 || ($i + 1) === $totalDistricts) {
                $pct = round(($i + 1) / $totalDistricts * 100);
                $this->command->info("   ... {$pct}% ({$i}/{$totalDistricts} districts processed, ~{$totalVillages} villages so far)");
            }
        }
        // Insert remaining
        if (!empty($villageBatch)) {
            foreach (array_chunk($villageBatch, 500) as $chunk) {
                DB::table('indonesia_villages')->insert($chunk);
            }
            $totalVillages += count($villageBatch);
        }
        $this->command->info("   ✅ {$totalVillages} villages inserted.");

        $this->command->newLine();
        $this->command->info('🎉 Indonesia region seeding complete!');
        $this->command->info("   Provinces: {$this->count($provinceRows)}");
        $this->command->info("   Cities:    {$this->count($cityRows)}");
        $this->command->info("   Districts: {$this->count($districtRows)}");
        $this->command->info("   Villages:  {$totalVillages}");
    }

    private function fetch(string $path): ?array
    {
        try {
            $response = Http::timeout(30)->retry(3, 500)->get(self::BASE_URL . $path);
            if ($response->successful()) {
                return $response->json();
            }
        } catch (\Exception $e) {
            // Silently continue
        }
        return null;
    }

    private function count(array $arr): int
    {
        return count($arr);
    }
}
