<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class CompanyProfile extends Model
{
    protected $table = 'company_profiles';

    protected $fillable = [
        'company_name',
        'pt_name',
        'address',
        'email',
        'phone',
        'logo',
    ];

    protected $appends = ['logo_url'];

    public function getLogoUrlAttribute(): ?string
    {
        if ($this->logo) {
            return asset('storage/' . $this->logo);
        }
        return null;
    }

    public static function getProfile(): self
    {
        return self::first() ?? self::create();
    }
}
