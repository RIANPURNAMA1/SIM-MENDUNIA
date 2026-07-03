<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class ManagerUserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            [
                'email' => 'manager@mendunia.com'
            ],
            [
                'name'       => 'Manager Utama',
                'password'   => Hash::make('manager123'),
                'role'       => 'MANAGER',
                'status'     => 'AKTIF',
                'last_login' => null
            ]
        );
    }
}
