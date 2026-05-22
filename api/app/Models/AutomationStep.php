<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AutomationStep extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'automation_id', 'parent_step_id', 'branch', 'step_type', 'step_config', 'position',
    ];

    protected function casts(): array
    {
        return ['step_config' => 'array'];
    }

    public function automation()
    {
        return $this->belongsTo(Automation::class);
    }

    public function parentStep()
    {
        return $this->belongsTo(self::class, 'parent_step_id');
    }

    public function children()
    {
        return $this->hasMany(self::class, 'parent_step_id');
    }
}
