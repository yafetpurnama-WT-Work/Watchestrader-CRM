<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed roles and permissions first
        $this->call(RolePermissionSeeder::class);

        // 2. Seed companies and outlets
        $this->call(CompanyOutletSeeder::class);

        // 3. Create default admin user with role
        $adminRole = Role::where('slug', 'admin')->first();

        User::firstOrCreate(
            ['email' => 'admin@watchestraders.com'],
            [
                'full_name' => 'Admin Watches Traders',
                'email' => 'admin@watchestraders.com',
                'password' => Hash::make('password123'),
                'role' => 'admin',
                'role_id' => $adminRole?->id,
                'status' => 'active',
            ]
        );

        // 4. Seed master data
        $this->call(CustomerStatusSeeder::class);
        $this->call(LeadSourceSeeder::class);
        $this->call(ProductSeeder::class);
    }
}
