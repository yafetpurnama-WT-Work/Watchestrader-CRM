<?php

namespace Database\Seeders;

use App\Models\LeadSource;
use Illuminate\Database\Seeder;

class LeadSourceSeeder extends Seeder
{
    public function run(): void
    {
        $sources = [
            ['name' => 'Uncategorized', 'code' => 'UNCAT', 'icon' => 'help-circle',  'color' => '#6B7280'],
            ['name' => 'Walk-In',       'code' => 'WI',    'icon' => 'footprints',   'color' => '#10B981'],
            ['name' => 'Instagram',     'code' => 'IG',    'icon' => 'instagram',    'color' => '#E1306C'],
            ['name' => 'WhatsApp',      'code' => 'WA',    'icon' => 'message-circle','color' => '#25D366'],
            ['name' => 'Website',       'code' => 'WEB',   'icon' => 'globe',        'color' => '#3B82F6'],
            ['name' => 'Event',         'code' => 'EV',    'icon' => 'calendar',     'color' => '#F59E0B'],
        ];

        foreach ($sources as $source) {
            LeadSource::firstOrCreate(['code' => $source['code']], $source);
        }
    }
}
