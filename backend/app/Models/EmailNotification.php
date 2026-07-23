<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmailNotification extends Model
{
    protected $fillable = [
        'pendaftar_id',
        'type',
        'to_email',
        'subject',
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
