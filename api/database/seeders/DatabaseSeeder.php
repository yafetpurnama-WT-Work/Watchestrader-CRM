<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'full_name' => 'Admin Watches Traders',
            'email' => 'admin@watchestraders.com',
            'password' => Hash::make('password123'),
            'role' => 'admin',
        ]);
    }
}
