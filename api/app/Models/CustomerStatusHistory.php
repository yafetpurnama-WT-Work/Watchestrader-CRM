<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerStatusHistory extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'customer_status_history';

    protected $fillable = [
        'customer_id',
        'from_status_id',
        'to_status_id',
        'changed_by',
        'notes',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function fromStatus(): BelongsTo
    {
        return $this->belongsTo(CustomerStatus::class, 'from_status_id');
    }

    public function toStatus(): BelongsTo
    {
        return $this->belongsTo(CustomerStatus::class, 'to_status_id');
    }

    public function changedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
