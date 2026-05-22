<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\Permission;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Define roles
        $roles = [
            ['name' => 'Super Admin', 'slug' => 'super_admin', 'description' => 'Full system access with no restrictions.', 'level' => 100],
            ['name' => 'Admin',       'slug' => 'admin',       'description' => 'Administrative access to all data and settings.', 'level' => 80],
            ['name' => 'Manager',     'slug' => 'manager',     'description' => 'Management access to all operational data.', 'level' => 60],
            ['name' => 'Supervisor',  'slug' => 'spv',         'description' => 'Supervises team members within assigned company and outlet.', 'level' => 40],
            ['name' => 'Staff',       'slug' => 'staff',       'description' => 'Operational staff with access to own assigned data only.', 'level' => 10],
        ];

        foreach ($roles as $roleData) {
            Role::firstOrCreate(['slug' => $roleData['slug']], $roleData);
        }

        // Define modules and their actions
        $modules = [
            'dashboard'     => ['view'],
            'customers'     => ['view', 'create', 'update', 'delete', 'export'],
            'leads'         => ['view', 'create', 'update', 'delete', 'export'],
            'products'      => ['view', 'create', 'update', 'delete'],
            'lead_sources'  => ['view', 'create', 'update', 'delete'],
            'pipelines'     => ['view', 'create', 'update', 'delete'],
            'broadcasts'    => ['view', 'create', 'update', 'delete'],
            'automations'   => ['view', 'create', 'update', 'delete'],
            'inbox'         => ['view', 'create', 'update', 'delete'],
            'users'         => ['view', 'create', 'update', 'delete'],
            'roles'         => ['view', 'create', 'update', 'delete'],
            'companies'     => ['view', 'create', 'update', 'delete'],
            'outlets'       => ['view', 'create', 'update', 'delete'],
            'settings'      => ['view', 'update'],
            'reports'       => ['view', 'export'],
            'notifications' => ['view', 'update'],
        ];

        $permissions = [];
        foreach ($modules as $module => $actions) {
            foreach ($actions as $action) {
                $slug = "{$module}.{$action}";
                $perm = Permission::firstOrCreate(
                    ['slug' => $slug],
                    [
                        'module' => $module,
                        'action' => $action,
                        'slug' => $slug,
                        'description' => ucfirst($action) . ' ' . str_replace('_', ' ', $module),
                    ]
                );
                $permissions[$slug] = $perm;
            }
        }

        // Assign permissions to roles
        $allPermSlugs = array_keys($permissions);

        // Super Admin & Admin → all permissions
        $superAdmin = Role::where('slug', 'super_admin')->first();
        $admin = Role::where('slug', 'admin')->first();
        $superAdmin->permissions()->syncWithoutDetaching(
            collect($allPermSlugs)->map(fn($s) => $permissions[$s]->id)->toArray()
        );
        $admin->permissions()->syncWithoutDetaching(
            collect($allPermSlugs)->map(fn($s) => $permissions[$s]->id)->toArray()
        );

        // Manager → all except users/roles/companies/outlets management
        $managerExclude = ['users.create', 'users.delete', 'roles.create', 'roles.update', 'roles.delete', 'companies.create', 'companies.update', 'companies.delete', 'outlets.create', 'outlets.update', 'outlets.delete'];
        $managerPerms = collect($allPermSlugs)->reject(fn($s) => in_array($s, $managerExclude));
        $manager = Role::where('slug', 'manager')->first();
        $manager->permissions()->syncWithoutDetaching(
            $managerPerms->map(fn($s) => $permissions[$s]->id)->toArray()
        );

        // Supervisor → operational permissions only
        $spvPerms = ['dashboard.view', 'customers.view', 'customers.create', 'customers.update', 'customers.export', 'leads.view', 'leads.create', 'leads.update', 'leads.export', 'products.view', 'lead_sources.view', 'pipelines.view', 'pipelines.create', 'pipelines.update', 'broadcasts.view', 'automations.view', 'inbox.view', 'inbox.create', 'inbox.update', 'users.view', 'settings.view', 'reports.view', 'reports.export', 'notifications.view', 'notifications.update'];
        $spv = Role::where('slug', 'spv')->first();
        $spv->permissions()->syncWithoutDetaching(
            collect($spvPerms)->filter(fn($s) => isset($permissions[$s]))->map(fn($s) => $permissions[$s]->id)->toArray()
        );

        // Staff → minimal operational permissions
        $staffPerms = ['dashboard.view', 'customers.view', 'customers.create', 'customers.update', 'leads.view', 'leads.create', 'leads.update', 'products.view', 'lead_sources.view', 'pipelines.view', 'inbox.view', 'inbox.create', 'inbox.update', 'settings.view', 'notifications.view', 'notifications.update'];
        $staff = Role::where('slug', 'staff')->first();
        $staff->permissions()->syncWithoutDetaching(
            collect($staffPerms)->filter(fn($s) => isset($permissions[$s]))->map(fn($s) => $permissions[$s]->id)->toArray()
        );
    }
}
