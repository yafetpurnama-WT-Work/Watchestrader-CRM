<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ContactCustomValue extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = ['contact_id', 'custom_field_id', 'value'];

    public function contact()
    {
        return $this->belongsTo(Contact::class);
    }

    public function customField()
    {
        return $this->belongsTo(CustomField::class);
    }
}
