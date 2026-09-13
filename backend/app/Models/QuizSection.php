<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuizSection extends Model
{
    protected $fillable = [
        'quiz_paket_id',
        'name',
        'sort',
    ];

    protected $casts = [
        'sort' => 'integer',
    ];

    public function paket()
    {
        return $this->belongsTo(QuizPaket::class, 'quiz_paket_id');
    }

    public function questions()
    {
        return $this->hasMany(QuizQuestion::class, 'section_id');
    }
}