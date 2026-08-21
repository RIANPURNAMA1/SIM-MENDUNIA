<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KontrakTandaTangan extends Model
{
    protected $table = 'kontrak_tanda_tangans';

    protected $fillable = [
        'kontrak_id',
        'pendaftar_id',
        'file_ttd',
    ];

    public function kontrak()
    {
        return $this->belongsTo(Kontrak::class);
    }

    public function pendaftar()
    {
        return $this->belongsTo(Pendaftar::class);
    }
}
