<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KategoriPengeluaran extends Model
{
    protected $table = 'kategori_pengeluaran';

    protected $fillable = ['nama', 'kode', 'urutan'];

    public function pengeluarans()
    {
        return $this->hasMany(Pengeluaran::class, 'kategori_id');
    }
}
