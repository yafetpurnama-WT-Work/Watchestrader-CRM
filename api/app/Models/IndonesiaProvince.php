<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class IndonesiaProvince extends Model
{
    public $timestamps = false;

    protected $fillable = ['code', 'name'];

    public function cities(): HasMany
    {
        return $this->hasMany(IndonesiaCity::class, 'province_code', 'code');
    }
}
