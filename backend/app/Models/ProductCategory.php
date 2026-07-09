<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductCategory extends Model
{
    protected $fillable = [
        'nama',
        'urutan',
    ];

    protected $table = 'product_categories';

    public function products()
    {
        return $this->hasMany(Product::class, 'category_id');
    }
}
