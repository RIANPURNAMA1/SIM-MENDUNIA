<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Projects extends Model
{
    protected $guarded = ['id'];

    // Relasi ke Manager (User)
    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    // Relasi ke Kolom/Lists
   // app/Models/Projects.php

public function lists(): HasMany
{
    // Sesuaikan dengan nama class model yang kamu punya
    return $this->hasMany(project_lists::class, 'project_id')->orderBy('urutan');
}

    // Ambil semua Task yang ada di dalam Project ini melalui Lists
    public function tasks(): HasManyThrough
    {
        return $this->hasManyThrough(Task::class, project_lists::class);
    }

    // Relasi ke Log Aktivitas
    public function activities(): HasMany
    {
        return $this->hasMany(ProjectActivity::class)->latest();
    }
}