<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JadwalLevel extends Model
{
    protected $table = 'jadwal_levels';

    protected $fillable = [
        'batch_id',
        'level',
        'status',
        'tanggal_mulai',
        'tanggal_selesai',
        'submitted_by',
        'approved_by',
        'approved_at',
        'rejection_reason',
    ];

    protected $casts = [
        'tanggal_mulai' => 'date:Y-m-d',
        'tanggal_selesai' => 'date:Y-m-d',
        'approved_at' => 'datetime',
    ];

    public function batch()
    {
        return $this->belongsTo(Batch::class);
    }

    public function submittedBy()
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
