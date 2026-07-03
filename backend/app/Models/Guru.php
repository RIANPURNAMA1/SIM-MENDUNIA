<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Guru extends Model
{
    protected $table = 'gurus';

    protected $fillable = [
        'user_id',
        'nama',
        'nip',
        'mata_pelajaran',
        'no_hp',
        'status',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
