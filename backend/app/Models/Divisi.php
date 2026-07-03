<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Karyawan;

class Divisi extends Model
{

    protected $fillable = ['nama_divisi', 'kode_divisi'];

    public function user()
    {
        return $this->hasMany(User::class, 'user_id');
    }

    // Tambahkan baris ini agar Controller bisa memanggil withCount('users')
    public function users()
    {
        return $this->hasMany(User::class, 'divisi_id');
    }

}
