<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BatchBiaya extends Model
{
    protected $fillable = ['batch_id', 'kategori_id', 'biaya'];

    public function batch()
    {
        return $this->belongsTo(Batch::class);
    }

    public function kategori()
    {
        return $this->belongsTo(BiayaKategori::class, 'kategori_id');
    }
}
