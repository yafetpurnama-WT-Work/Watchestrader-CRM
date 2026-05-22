<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'conversation_id', 'sender_type', 'sender_id', 'content_type',
        'content_text', 'media_url', 'template_name', 'message_id',
        'status', 'reply_to_message_id',
    ];

    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }

    public function reactions()
    {
        return $this->hasMany(MessageReaction::class);
    }
}
