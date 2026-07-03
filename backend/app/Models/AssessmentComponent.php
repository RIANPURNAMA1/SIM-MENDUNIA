<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AssessmentComponent extends Model
{
    protected $fillable = [
        'category_id',
        'sub_komponen',
        'urutan',
    ];

    public function category()
    {
        return $this->belongsTo(AssessmentCategory::class, 'category_id');
    }

    public function assessments()
    {
        return $this->hasMany(StudentAssessment::class, 'component_id');
    }
}
