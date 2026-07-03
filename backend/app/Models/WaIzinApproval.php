<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WaIzinApproval extends Model
{
    protected $fillable = [
        'izin_id',
        'manager_phone',
        'status',
        'replied_at',
    ];

    public function izin()
    {
        return $this->belongsTo(Izin::class);
    }
}
