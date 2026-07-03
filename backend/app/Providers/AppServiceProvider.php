<?php

namespace App\Providers;

use App\Models\Izin;
use App\Models\Lembur;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\View;
use Carbon\Carbon;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // 1. Force Timezone ke Asia/Jakarta agar absensi sinkron di VPS
        date_default_timezone_set('Asia/Jakarta');
        config(['app.timezone' => 'Asia/Jakarta']);
        Carbon::setLocale('id');

        // 2. View Composer untuk membagikan data notifikasi ke semua view
        View::composer('*', function ($view) {
            $notifIzin = Izin::with('user')
                ->where('status', 'PENDING')
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get();

            $notifLembur = Lembur::with('user')
                ->where('status', 'PENDING')
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get();

            $view->with([
                'notifIzin' => $notifIzin,
                'notifLembur' => $notifLembur
            ]);
        });
    }
}