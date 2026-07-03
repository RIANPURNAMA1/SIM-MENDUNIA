<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IzinApproval extends Model
{
    protected $fillable = [
        'izin_id',
        'approved_by',
        'status',
        'catatan',
        'approved_at'
    ];

    public function izin()
    {
        return $this->belongsTo(Izin::class);
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
