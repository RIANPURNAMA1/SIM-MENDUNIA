<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WaPaymentApproval extends Model
{
    protected $table = 'wa_payment_approvals';

    protected $fillable = [
        'pendaftar_id',
        'admin_phone',
        'status',
        'replied_at',
    ];

    public function pendaftar()
    {
        return $this->belongsTo(Pendaftar::class);
    }
}
