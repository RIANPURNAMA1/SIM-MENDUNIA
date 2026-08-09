<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class BlogCategory extends Model
{
    protected $table = 'blog_categories';

    protected $fillable = ['name', 'slug'];

    protected static function booted(): void
    {
        static::creating(function (BlogCategory $category) {
            $category->slug = self::generateUniqueSlug($category->name);
        });
    }

    public function blogs()
    {
        return $this->hasMany(Blog::class, 'category', 'name');
    }

    public static function generateUniqueSlug(string $name): string
    {
        $slug = Str::slug($name);
        $base = $slug;
        $i = 2;
        while (static::where('slug', $slug)->exists()) {
            $slug = $base . '-' . $i++;
        }
        return $slug;
    }
}