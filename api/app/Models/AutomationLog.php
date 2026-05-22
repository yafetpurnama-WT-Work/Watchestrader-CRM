<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AutomationLog extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'automation_id', 'user_id', 'contact_id', 'trigger_event',
        'steps_executed', 'status', 'error_message',
    ];

    protected function casts(): array
    {
        return ['steps_executed' => 'array'];
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
