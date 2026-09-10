<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LmsCategory extends Model
{
    protected $table = 'lms_categories';

    protected $fillable = [
        'name',
        'sort',
    ];

    public function courses()
    {
        return $this->hasMany(Course::class, 'category_id')->orderBy('sort');
    }
}