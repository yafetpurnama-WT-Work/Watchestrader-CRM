<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IndonesiaVillage extends Model
{
    public $timestamps = false;

    protected $fillable = ['district_code', 'code', 'name', 'postal_code'];

    public function district(): BelongsTo
    {
        return $this->belongsTo(IndonesiaDistrict::class, 'district_code', 'code');
    }
}
