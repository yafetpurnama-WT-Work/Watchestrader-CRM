<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Contact extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = ['user_id', 'phone', 'name', 'email', 'company', 'avatar_url'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function tags()
    {
        return $this->belongsToMany(Tag::class, 'contact_tags');
    }

    public function notes()
    {
        return $this->hasMany(ContactNote::class);
    }

    public function customValues()
    {
        return $this->hasMany(ContactCustomValue::class);
    }

    public function conversations()
    {
        return $this->hasMany(Conversation::class);
    }
}
