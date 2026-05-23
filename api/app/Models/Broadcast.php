<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\Auditable;

class Broadcast extends Model
{
    use HasFactory, HasUuids, Auditable;

    protected $fillable = [
        'user_id', 'name', 'template_name', 'template_language',
        'template_variables', 'audience_filter', 'scheduled_at', 'status',
        'total_recipients', 'sent_count', 'delivered_count', 'read_count',
        'replied_count', 'failed_count',
    ];

    protected function casts(): array
    {
        return [
            'template_variables' => 'array',
            'audience_filter' => 'array',
            'scheduled_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function recipients()
    {
        return $this->hasMany(BroadcastRecipient::class);
    }
}
