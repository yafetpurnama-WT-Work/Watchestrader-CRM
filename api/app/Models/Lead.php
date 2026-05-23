<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\Auditable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class Lead extends Model
{
    use HasFactory, HasUuids, Auditable;

    protected $fillable = [
        'customer_id',
        'assigned_to',
        'source_id',
        'status',
        'title',
        'notes',
        'value',
        'company_id',
        'outlet_id',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'value' => 'decimal:2',
        ];
    }

    // --- Relationships ---

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function assignedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function source(): BelongsTo
    {
        return $this->belongsTo(LeadSource::class, 'source_id');
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class);
    }

    public function subLeads(): HasMany
    {
        return $this->hasMany(SubLead::class);
    }

    public function history(): HasMany
    {
        return $this->hasMany(LeadHistory::class)->latest();
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    // --- Scopes ---

    /**
     * CRITICAL: RBAC visibility scope for leads.
     * Staff (level 10): only own leads (assigned_to or created_by).
     * SPV (level 40): own + subordinates within same company & outlet.
     * Admin/Manager/Super Admin (level >= 60): all leads.
     */
    public function scopeByVisibility(Builder $query, User $user): Builder
    {
        $roleLevel = $user->getRoleLevel();

        // Admin, Manager, Super Admin → see all leads
        if ($roleLevel >= 60) {
            return $query;
        }

        // Supervisor → own leads + subordinates within same company & outlet
        if ($roleLevel >= 40) {
            $subordinateIds = User::where('supervisor_id', $user->id)->pluck('id');

            return $query->where(function ($q) use ($user, $subordinateIds) {
                $q->where('assigned_to', $user->id)
                    ->orWhere('created_by', $user->id)
                    ->orWhereIn('assigned_to', $subordinateIds);
            })->where(function ($q) use ($user) {
                $q->where('company_id', $user->company_id)
                    ->where('outlet_id', $user->outlet_id);
            });
        }

        // Staff → only own leads
        return $query->where(function ($q) use ($user) {
            $q->where('assigned_to', $user->id)
                ->orWhere('created_by', $user->id);
        });
    }

    public function scopeStatus(Builder $query, string $status): Builder
    {
        return $query->where('status', $status);
    }
}
