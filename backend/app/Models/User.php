<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'divisi_id',
        'cabang_ids', // Ubah dari cabang_id ke cabang_ids
        'shift_ids', // Multiple shift support
        'shift_id',      // PASTIKAN ADA
        'status',
        'nip',
        'nik',
        'pendidikan_terakhir',
        'jabatan',
        'no_hp',
        'alamat',
        'foto_profil',
        'tanggal_masuk',
        'status_kerja',
        'face_embedding',
        'foto_ktp',
        'foto_ijazah',
        'foto_kk',
        'cv_file',
        'sertifikat_file',
        'tempat_lahir',
        'tanggal_lahir',
        'jenis_kelamin',
        'agama',
        'status_pernikahan',
        'can_access_khusus',
    ];

    protected $hidden = [
        'password',
    ];

    protected $casts = [
        'cabang_ids' => 'array',
        'shift_ids' => 'array',
        'last_login' => 'datetime',
        'can_access_khusus' => 'boolean',
    ];

    // Ganti relasi lama dengan Accessor ini
    public function getCabangAttribute()
    {
        if (! $this->cabang_ids) {
            return collect();
        }

        // Mengambil semua data cabang yang ID-nya ada di dalam list cabang_ids
        return \App\Models\Cabang::whereIn('id', $this->cabang_ids)->get();
    }

    public function isHR()
    {
        return $this->role === 'HR';
    }

    public function isManager()
    {
        return $this->role === 'MANAGER';
    }

    public function isKaryawan()
    {
        return $this->role === 'KARYAWAN';
    }

    public function isSiswa()
    {
        return $this->role === 'SISWA';
    }

    public function isGuru()
    {
        return $this->role === 'GURU';
    }

    public function divisi()
    {
        return $this->belongsTo(Divisi::class);
    }

    public function shift()
    {
        // Pastikan foreign key di tabel users adalah shift_id
        return $this->belongsTo(Shift::class, 'shift_id');
    }

    // public function siswa(){
    //     return $this->hasOne(Siswa::class, 'user_id');
    // }

    // Accessor untuk multiple shifts ( seperti getCabangAttribute )
    public function getShiftsAttribute()
    {
        if (!$this->shift_ids) {
            return collect();
        }
        return Shift::whereIn('id', $this->shift_ids)->get();
    }
    // public function cabang()
    // {
    //     return $this->belongsTo(Cabang::class, 'cabang_id');
    // }

    public function absensi()
    {
        return $this->hasMany(\App\Models\Absensi::class, 'user_id');
    }

    public function izins()
    {
        return $this->hasMany(Izin::class);
    }

    public function lembur()
    {
        return $this->hasMany(Lembur::class);
    }

    // task
    // Di dalam class User
    public function managedProjects()
    {
        return $this->hasMany(Projects::class, 'manager_id');
    }

    public function assignedTasks()
    {
        return $this->belongsToMany(Task::class, 'task_assignments');
    }

    public function kelasSensei()
    {
        return $this->hasMany(KelasSensei::class);
    }

    public function absensiSensei()
    {
        return $this->hasMany(AbsensiSensei::class);
    }

    public function agenda()
    {
        return $this->hasMany(Agenda::class);
    }

    public function absensiKhusus()
    {
        return $this->hasMany(AbsensiKhusus::class);
    }

    public function siswa()
    {
        return $this->hasOne(\App\Models\Siswa::class);
    }
}
