<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AutomationPendingExecution extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'automation_id', 'user_id', 'contact_id', 'log_id', 'parent_step_id',
        'branch', 'next_step_position', 'context', 'status', 'run_at',
    ];

    protected function casts(): array
    {
        return [
            'context' => 'array',
            'run_at' => 'datetime',
        ];
    }

    public function automation()
    {
        return $this->belongsTo(Automation::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function contact()
    {
        return $this->belongsTo(Contact::class);
    }
}
