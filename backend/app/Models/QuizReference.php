<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuizReference extends Model
{
    protected $fillable = [
        'user_id',
        'category_id',
        'title',
        'description',
        'link',
        'file_path',
        'file_name',
        'file_type',
        'file_size',
        'status',
        'note',
    ];

    protected $appends = ['file_url'];

    public const STATUSES = ['pending', 'diproses', 'selesai', 'ditolak'];

    public function getFileUrlAttribute()
    {
        if (!$this->file_path) {
            return null;
        }
        return asset('storage/' . $this->file_path);
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function category()
    {
        return $this->belongsTo(QuizCategory::class, 'category_id');
    }
}