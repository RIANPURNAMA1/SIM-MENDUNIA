<?php

namespace App\Http\Controllers;

use App\Models\Pendaftar;
use App\Models\Pembayaran;
use App\Models\PembayaranItem;
use App\Models\KomisiAffiliate;
use Illuminate\Support\Facades\Auth;

class AdminMutasiController extends Controller
{
    public function dashboard()
    {
        $user = Auth::user();

        $totalPendaftar = Pendaftar::count();
        $pendaftarPending = Pendaftar::where('status_pendaftaran', 'pending')->count();
        $pendaftarDisetujui = Pendaftar::where('status_pendaftaran', 'disetujui')->count();
        $pendaftarDitolak = Pendaftar::where('status_pendaftaran', 'ditolak')->count();

        $pembayaranPending = Pembayaran::where('status', 'pending')
            ->whereNotNull('kategori_id')
            ->count();

        $pendapatanVerified = (float) Pembayaran::where('status', 'verified')->sum('jumlah');
        $pendapatanBulanIni = (float) Pembayaran::where('status', 'verified')
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->sum('jumlah');

        $komisiPending = (float) KomisiAffiliate::where('status', 'pending')->sum('jumlah');
        $komisiPaid = (float) KomisiAffiliate::where('status', 'paid')->sum('jumlah');
        $komisiCair = (float) KomisiAffiliate::where('status', 'cair')->sum('jumlah');

        $recentPendaftar = Pendaftar::with(['batch', 'product'])
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn($p) => [
                'id' => $p->id,
                'nama' => $p->nama,
                'email' => $p->email,
                'batch' => $p->batch?->nama_batch ?? '-',
                'program' => $p->product?->nama ?? '-',
                'status_pendaftaran' => $p->status_pendaftaran,
                'status_pembayaran' => $p->status_pembayaran,
                'created_at' => $p->created_at,
            ]);

        $recentPembayaran = Pembayaran::with(['pendaftar.batch'])
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn($p) => [
                'id' => $p->id,
                'jumlah' => (float) $p->jumlah,
                'status' => $p->status,
                'pendaftar' => $p->pendaftar?->nama ?? '-',
                'batch' => $p->pendaftar?->batch?->nama_batch ?? '-',
                'created_at' => $p->created_at,
            ]);

        // === CHART DATA (6 bulan terakhir) ===
        $months = collect();
        for ($i = 5; $i >= 0; $i--) {
            $d = now()->subMonths($i);
            $months->push([
                'label' => $d->format('M Y'),
                'month' => (int) $d->format('m'),
                'year'  => (int) $d->format('Y'),
            ]);
        }

        $rekapPendaftar = $months->map(function ($m) {
            $count = Pendaftar::whereMonth('created_at', $m['month'])
                ->whereYear('created_at', $m['year'])
                ->count();
            return ['label' => $m['label'], 'total' => $count];
        })->toArray();

        $rekapPendapatan = $months->map(function ($m) {
            $total = Pembayaran::where('status', 'verified')
                ->whereMonth('created_at', $m['month'])
                ->whereYear('created_at', $m['year'])
                ->sum('jumlah');
            return ['label' => $m['label'], 'total' => (float) $total];
        })->toArray();

        $rekapKomisi = $months->map(function ($m) {
            $total = KomisiAffiliate::whereMonth('created_at', $m['month'])
                ->whereYear('created_at', $m['year'])
                ->sum('jumlah');
            return ['label' => $m['label'], 'total' => (float) $total];
        })->toArray();

        return response()->json([
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
            'stats' => [
                'total_pendaftar' => $totalPendaftar,
                'pendaftar_pending' => $pendaftarPending,
                'pendaftar_disetujui' => $pendaftarDisetujui,
                'pendaftar_ditolak' => $pendaftarDitolak,
                'pembayaran_pending' => $pembayaranPending,
                'pendapatan_verified' => $pendapatanVerified,
                'pendapatan_bulan_ini' => $pendapatanBulanIni,
                'komisi_pending' => $komisiPending,
                'komisi_paid' => $komisiPaid,
                'komisi_cair' => $komisiCair,
            ],
            'recent_pendaftar' => $recentPendaftar,
            'recent_pembayaran' => $recentPembayaran,
            'charts' => [
                'rekap_pendaftar' => $rekapPendaftar,
                'rekap_pendapatan' => $rekapPendapatan,
                'rekap_komisi' => $rekapKomisi,
            ],
        ]);
    }
}
