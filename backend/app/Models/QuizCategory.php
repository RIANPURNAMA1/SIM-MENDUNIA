<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuizCategory extends Model
{
    protected $fillable = ['name'];

    protected $casts = [
        'id' => 'integer',
    ];
}