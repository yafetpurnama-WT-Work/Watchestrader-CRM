<?php

namespace Database\Seeders;

use App\Models\CustomerStatus;
use Illuminate\Database\Seeder;

class CustomerStatusSeeder extends Seeder
{
    public function run(): void
    {
        $statuses = [
            ['name' => 'New',         'slug' => 'new',         'color' => '#3B82F6', 'position' => 1, 'is_default' => true],
            ['name' => 'Active',      'slug' => 'active',      'color' => '#10B981', 'position' => 2, 'is_default' => false],
            ['name' => 'Inactive',    'slug' => 'inactive',    'color' => '#6B7280', 'position' => 3, 'is_default' => false],
            ['name' => 'VIP',         'slug' => 'vip',         'color' => '#F59E0B', 'position' => 4, 'is_default' => false],
            ['name' => 'Blacklisted', 'slug' => 'blacklisted', 'color' => '#EF4444', 'position' => 5, 'is_default' => false],
        ];

        foreach ($statuses as $status) {
            CustomerStatus::firstOrCreate(['slug' => $status['slug']], $status);
        }
    }
}
