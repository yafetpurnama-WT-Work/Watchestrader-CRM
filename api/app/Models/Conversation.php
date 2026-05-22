<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Conversation extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id', 'contact_id', 'status', 'assigned_agent_id',
        'last_message_text', 'last_message_at', 'unread_count',
    ];

    protected function casts(): array
    {
        return ['last_message_at' => 'datetime'];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function contact()
    {
        return $this->belongsTo(Contact::class);
    }

    public function assignedAgent()
    {
        return $this->belongsTo(User::class, 'assigned_agent_id');
    }

    public function messages()
    {
        return $this->hasMany(Message::class);
    }

    public function reactions()
    {
        return $this->hasMany(MessageReaction::class);
    }
}
