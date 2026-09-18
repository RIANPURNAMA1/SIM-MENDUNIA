<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LmsMaterialSlide extends Model
{
    protected $table = 'lms_material_slides';

    protected $fillable = [
        'lms_material_id',
        'file_path',
        'file_name',
        'file_type',
        'file_size',
        'sort',
    ];

    public function material()
    {
        return $this->belongsTo(LmsMaterial::class, 'lms_material_id');
    }
}