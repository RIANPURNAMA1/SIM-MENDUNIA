<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\User;
use App\Models\Shift;
use App\Models\Cabang;
use App\Models\Izin;

class AbsensiFactory extends Factory
{
    public function definition(): array
    {
        $statuses = [
            'HADIR',
            'TERLAMBAT',
            'IZIN',
            'ALPA',
            'PULANG LEBIH AWAL',
            'TIDAK ABSEN PULANG',
            'LIBUR'
        ];

        $tanggal = $this->faker->dateTimeBetween('-30 days', 'now')->format('Y-m-d');

        return [
            'user_id' => User::inRandomOrder()->value('id') ?? User::factory(),
            'shift_id' => Shift::inRandomOrder()->value('id'),
            'cabang_id' => Cabang::inRandomOrder()->value('id'),
            'izin_id' => $this->faker->optional()->randomElement(Izin::pluck('id')->toArray()),

            'tanggal' => $tanggal,

            'jam_masuk' => $this->faker->optional()->time('H:i:s'),
            'jam_keluar' => $this->faker->optional()->time('H:i:s'),

            'lat_masuk' => $this->faker->latitude(),
            'long_masuk' => $this->faker->longitude(),

            'lat_pulang' => $this->faker->latitude(),
            'long_pulang' => $this->faker->longitude(),

            'status' => $this->faker->randomElement($statuses),

            'foto_masuk' => $this->faker->optional()->imageUrl(),
            'foto_pulang' => $this->faker->optional()->imageUrl(),

            'keterangan' => $this->faker->sentence(),

            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
}