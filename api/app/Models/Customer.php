<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class Customer extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'name',
        'phone',
        'email',
        'address',
        'province_code',
        'city_code',
        'district_code',
        'village_code',
        'rt',
        'rw',
        'postal_code',
        'company_id',
        'outlet_id',
        'assigned_sales_id',
        'status_id',
        'source',
        'created_by',
        'updated_by',
    ];

    // --- Relationships ---

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class);
    }

    public function assignedSales(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_sales_id');
    }

    public function status(): BelongsTo
    {
        return $this->belongsTo(CustomerStatus::class, 'status_id');
    }

    public function statusHistory(): HasMany
    {
        return $this->hasMany(CustomerStatusHistory::class)->latest();
    }

    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    // --- Indonesia Address Relationships ---

    public function province(): BelongsTo
    {
        return $this->belongsTo(IndonesiaProvince::class, 'province_code', 'code');
    }

    public function city(): BelongsTo
    {
        return $this->belongsTo(IndonesiaCity::class, 'city_code', 'code');
    }

    public function district(): BelongsTo
    {
        return $this->belongsTo(IndonesiaDistrict::class, 'district_code', 'code');
    }

    public function village(): BelongsTo
    {
        return $this->belongsTo(IndonesiaVillage::class, 'village_code', 'code');
    }

    // --- Scopes ---

    /**
     * RBAC visibility scope.
     * Staff: own outlet customers only.
     * SPV: same company + outlet customers.
     * Admin/Manager/Super Admin: all customers.
     */
    public function scopeByVisibility(Builder $query, User $user): Builder
    {
        $roleLevel = $user->getRoleLevel();

        if ($roleLevel >= 60) {
            return $query; // Admin, Manager, Super Admin → see all
        }

        if ($roleLevel >= 40) {
            // Supervisor → same company & outlet
            return $query->where(function ($q) use ($user) {
                $q->where('company_id', $user->company_id)
                    ->where('outlet_id', $user->outlet_id);
            });
        }

        // Staff → only assigned to them or created by them
        return $query->where(function ($q) use ($user) {
            $q->where('assigned_sales_id', $user->id)
                ->orWhere('created_by', $user->id);
        });
    }
}
