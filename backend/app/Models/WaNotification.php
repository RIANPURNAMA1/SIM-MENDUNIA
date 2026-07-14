<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WaNotification extends Model
{
    protected $fillable = [
        'pendaftar_id',
        'type',
        'to_phone',
        'message',
        'success',
        'error',
    ];

    protected $casts = [
        'success' => 'boolean',
    ];

    public function pendaftar()
    {
        return $this->belongsTo(Pendaftar::class);
    }
}
