<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Task extends Model
{
    protected $fillable = [
        'project_list_id',
        'judul_tugas',
        'deskripsi_tugas',
        'prioritas',
        'tgl_mulai_tugas',
        'tgl_selesai_tugas',
        'urutan_kartu',
        'is_selesai'
    ];

    protected $casts = [
        'is_selesai' => 'boolean',
        'tgl_mulai_tugas' => 'date',
        'tgl_selesai_tugas' => 'date',
    ];

    /**
     * Relasi ke List/Kolom Proyek
     */
    public function projectList(): BelongsTo
    {
        return $this->belongsTo(project_lists::class, 'project_list_id');
    }

    /**
     * Relasi ke User (Tim yang ditugaskan)
     * Menggunakan tabel pivot 'task_assignments'
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'task_assignments', 'task_id', 'user_id')
                    ->withTimestamps(); // Tambahkan ini jika ingin Laravel otomatis mengisi created_at di tabel pivot
    }
}