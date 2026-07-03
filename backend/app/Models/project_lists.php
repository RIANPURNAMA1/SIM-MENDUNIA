<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class project_lists extends Model
{
    // Mengizinkan kolom-kolom ini diisi melalui ProjectList::create()
    protected $fillable = [
        'project_id',
        'nama_list',
        'urutan'
    ];

    /**
     * Relasi balik ke Project (Satu List dimiliki oleh satu Project)
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Projects::class, 'project_id');
    }

    /**
     * Relasi ke Tasks (Satu List memiliki banyak Task/Kartu)
     */
    public function tasks(): HasMany
    {
        // Pastikan nama model Task sudah benar (PascalCase)
        // Kita urutkan tugas berdasarkan urutan (jika ada kolom urutan)
        return $this->hasMany(Task::class, 'project_list_id');
    }
}