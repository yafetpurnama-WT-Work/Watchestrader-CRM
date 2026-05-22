<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BroadcastRecipient extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'broadcast_id', 'contact_id', 'status', 'sent_at', 'delivered_at',
        'read_at', 'replied_at', 'error_message', 'whatsapp_message_id',
    ];

    protected function casts(): array
    {
        return [
            'sent_at' => 'datetime',
            'delivered_at' => 'datetime',
            'read_at' => 'datetime',
            'replied_at' => 'datetime',
        ];
    }

    public function broadcast()
    {
        return $this->belongsTo(Broadcast::class);
    }

    public function contact()
    {
        return $this->belongsTo(Contact::class);
    }
}
