<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MessageReaction extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = ['message_id', 'conversation_id', 'actor_type', 'actor_id', 'emoji'];

    public function message()
    {
        return $this->belongsTo(Message::class);
    }

    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }
}
