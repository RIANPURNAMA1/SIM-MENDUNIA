<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BiayaKategori extends Model
{
    protected $fillable = ['nama', 'kode', 'urutan'];

    public function batchBiayas()
    {
        return $this->hasMany(BatchBiaya::class, 'kategori_id');
    }
}
