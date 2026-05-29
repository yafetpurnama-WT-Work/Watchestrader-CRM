<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeadStatus extends Model
{
    use HasUuids;

    protected $fillable = [
        'name',
        'slug',
        'color',
        'position',
        'is_default',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'is_default' => 'boolean',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
