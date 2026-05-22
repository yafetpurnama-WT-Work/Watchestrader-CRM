<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Automation extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id', 'name', 'description', 'trigger_type', 'trigger_config',
        'is_active', 'execution_count', 'last_executed_at',
    ];

    protected function casts(): array
    {
        return [
            'trigger_config' => 'array',
            'is_active' => 'boolean',
            'last_executed_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function steps()
    {
        return $this->hasMany(AutomationStep::class)->orderBy('position');
    }

    public function logs()
    {
        return $this->hasMany(AutomationLog::class);
    }

    public function pendingExecutions()
    {
        return $this->hasMany(AutomationPendingExecution::class);
    }
}
