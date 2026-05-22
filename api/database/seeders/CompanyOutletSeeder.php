<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\Outlet;
use Illuminate\Database\Seeder;

class CompanyOutletSeeder extends Seeder
{
    public function run(): void
    {
        // Companies
        $wt = Company::firstOrCreate(['code' => 'WT'], [
            'name' => 'Watches Trader',
            'code' => 'WT',
            'address' => 'Indonesia',
            'email' => 'watchestrader.id@gmail.com',
            'is_active' => true,
        ]);

        $iws = Company::firstOrCreate(['code' => 'IWS'], [
            'name' => 'IWS (Indonesia Watch Store)',
            'code' => 'IWS',
            'is_active' => true,
        ]);

        $ws = Company::firstOrCreate(['code' => 'WS'], [
            'name' => 'Watch Solution',
            'code' => 'WS',
            'is_active' => true,
        ]);

        // Outlets for WT
        Outlet::firstOrCreate(['code' => 'SBY'], [
            'company_id' => $wt->id,
            'name' => 'Surabaya - PTC',
            'code' => 'SBY',
            'city' => 'Surabaya',
            'address' => 'Pakuwon Trade Center (PTC) Level UG, Unit F3/06-08, Surabaya, Jawa Timur',
            'phone' => '031 99146636',
            'is_active' => true,
        ]);

        Outlet::firstOrCreate(['code' => 'JKT'], [
            'company_id' => $wt->id,
            'name' => 'Jakarta - ASTHA',
            'code' => 'JKT',
            'city' => 'Jakarta',
            'address' => 'Prosperity Tower 11G, SCBD, Jl. Jenderal Sudirman No.52-53, Senayan, Jakarta Selatan, DKI Jakarta 12190',
            'phone' => '021 30002028',
            'is_active' => true,
        ]);

        Outlet::firstOrCreate(['code' => 'EXH'], [
            'company_id' => $wt->id,
            'name' => 'Exhibition',
            'code' => 'EXH',
            'city' => 'Various',
            'address' => 'Various exhibition venues',
            'is_active' => true,
        ]);

        // Outlets for IWS
        Outlet::firstOrCreate(['code' => 'IWS-SBY'], [
            'company_id' => $iws->id,
            'name' => 'IWS Surabaya',
            'code' => 'IWS-SBY',
            'city' => 'Surabaya',
            'is_active' => true,
        ]);

        // Outlets for WS
        Outlet::firstOrCreate(['code' => 'WS-SBY'], [
            'company_id' => $ws->id,
            'name' => 'WS Surabaya',
            'code' => 'WS-SBY',
            'city' => 'Surabaya',
            'is_active' => true,
        ]);
    }
}
