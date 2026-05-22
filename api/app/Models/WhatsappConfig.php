<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WhatsappConfig extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'whatsapp_config';

    protected $fillable = ['user_id', 'phone_number_id', 'waba_id', 'access_token', 'verify_token', 'status'];

    protected $hidden = ['access_token'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
