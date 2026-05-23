<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\Auditable;

class MessageTemplate extends Model
{
    use HasFactory, HasUuids, Auditable;

    protected $fillable = [
        'user_id', 'name', 'category', 'language', 'header_type',
        'header_content', 'body_text', 'footer_text', 'buttons', 'status',
    ];

    protected function casts(): array
    {
        return ['buttons' => 'array'];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
