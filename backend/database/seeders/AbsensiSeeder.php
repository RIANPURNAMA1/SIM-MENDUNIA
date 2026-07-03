<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Absensi;
use App\Models\User;
use Carbon\Carbon;

class AbsensiSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::pluck('id')->toArray();

        $data = [];

        foreach (range(1, 100) as $i) {
            $user = $users[array_rand($users)];
            $tanggal = Carbon::now()->subDays(rand(0, 30))->format('Y-m-d');

            // Cegah duplikat user + tanggal
            if (Absensi::where('user_id', $user)->where('tanggal', $tanggal)->exists()) {
                continue;
            }

            $data[] = Absensi::factory()->make([
                'user_id' => $user,
                'tanggal' => $tanggal,
            ])->toArray();
        }

       foreach (range(1, 100) as $i) {
    $user = $users[array_rand($users)];
    $tanggal = now()->subDays(rand(0, 30))->format('Y-m-d');

    if (Absensi::where('user_id', $user)->where('tanggal', $tanggal)->exists()) {
        continue;
    }

    Absensi::factory()->create([
        'user_id' => $user,
        'tanggal' => $tanggal,
    ]);
}
    }
}