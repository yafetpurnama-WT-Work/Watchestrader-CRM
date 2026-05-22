<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class IndonesiaDistrict extends Model
{
    public $timestamps = false;

    protected $fillable = ['city_code', 'code', 'name'];

    public function city(): BelongsTo
    {
        return $this->belongsTo(IndonesiaCity::class, 'city_code', 'code');
    }

    public function villages(): HasMany
    {
        return $this->hasMany(IndonesiaVillage::class, 'district_code', 'code');
    }
}
