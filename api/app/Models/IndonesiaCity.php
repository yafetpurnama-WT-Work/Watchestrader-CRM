<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class IndonesiaCity extends Model
{
    public $timestamps = false;

    protected $fillable = ['province_code', 'code', 'name', 'type'];

    public function province(): BelongsTo
    {
        return $this->belongsTo(IndonesiaProvince::class, 'province_code', 'code');
    }

    public function districts(): HasMany
    {
        return $this->hasMany(IndonesiaDistrict::class, 'city_code', 'code');
    }
}
