<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AssessmentCategory extends Model
{
    protected $fillable = [
        'level',
        'nama_kategori',
        'urutan',
    ];

    public function components()
    {
        return $this->hasMany(AssessmentComponent::class, 'category_id');
    }
}
