<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AccountingUserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'accounting@mendunia.com'],
            [
                'name'       => 'Accounting',
                'password'   => Hash::make('accounting123'),
                'role'       => 'ACCOUNTING',
                'status'     => 'AKTIF',
                'last_login' => null
            ]
        );
    }
}
