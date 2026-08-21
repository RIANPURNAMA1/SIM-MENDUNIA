<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Kontrak extends Model
{
    protected $table = 'kontraks';

    protected $fillable = [
        'cabang_id',
        'judul',
        'file_kontrak',
        'file_kontrak_ttd',
        'ttd_uploaded_at',
        'uploaded_by',
        'keterangan',
    ];

    protected $casts = [
        'ttd_uploaded_at' => 'datetime',
    ];

    public function cabang()
    {
        return $this->belongsTo(Cabang::class);
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function tandaTangans()
    {
        return $this->hasMany(KontrakTandaTangan::class);
    }
}
