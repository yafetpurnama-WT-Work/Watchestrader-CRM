<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\Auditable;

class CustomField extends Model
{
    use HasFactory, HasUuids, Auditable;

    protected $fillable = ['user_id', 'field_name', 'field_type', 'field_options'];

    protected function casts(): array
    {
        return ['field_options' => 'array'];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function values()
    {
        return $this->hasMany(ContactCustomValue::class);
    }
}
