<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BiayaKategori extends Model
{
    protected $fillable = ['nama', 'kode', 'urutan', 'deskripsi', 'parent_id'];

    public function parent()
    {
        return $this->belongsTo(BiayaKategori::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(BiayaKategori::class, 'parent_id')->orderBy('urutan');
    }

    public function batchBiayas()
    {
        return $this->hasMany(BatchBiaya::class, 'kategori_id');
    }

    public function isParent(): bool
    {
        return $this->children()->count() > 0;
    }
}
