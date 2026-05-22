<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

// #[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasUuids;

    protected $fillable = [
        'full_name',
        'email',
        'password',
        'avatar_url',
        'role',
        'phone',
        'role_id',
        'company_id',
        'outlet_id',
        'supervisor_id',
        'status',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    // --- Organization Relationships ---

    public function roleRelation(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Many-to-many: a user can belong to multiple companies.
     */
    public function companies(): BelongsToMany
    {
        return $this->belongsToMany(Company::class, 'company_user')->withTimestamps();
    }

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class);
    }

    public function supervisor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'supervisor_id');
    }

    public function subordinates(): HasMany
    {
        return $this->hasMany(User::class, 'supervisor_id');
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    // --- RBAC Methods ---

    /**
     * Check if user has a specific permission via their role.
     */
    public function hasPermission(string $permissionSlug): bool
    {
        if (!$this->roleRelation) {
            $this->load('roleRelation.permissions');
        }

        return $this->roleRelation
            && $this->roleRelation->permissions
            ->contains('slug', $permissionSlug);
    }

    /**
     * Check if user has a specific role by slug.
     */
    public function hasRole(string $roleSlug): bool
    {
        if (!$this->roleRelation) {
            $this->load('roleRelation');
        }

        return $this->roleRelation
            && $this->roleRelation->slug === $roleSlug;
    }

    /**
     * Get the user's role level (higher = more access).
     * Returns 0 if no role is assigned.
     */
    public function getRoleLevel(): int
    {
        if (!$this->roleRelation) {
            $this->load('roleRelation');
        }

        return $this->roleRelation->level ?? 0;
    }
}
