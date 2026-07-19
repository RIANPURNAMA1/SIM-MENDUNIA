<?php

namespace App\Http\Controllers;

use App\Models\AffiliateLink;
use App\Models\Pendaftar;
use App\Models\KomisiAffiliate;
use App\Models\KomisiTier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AffiliateDashboardController extends Controller
{
    public function index()
    {
        $userId = Auth::guard('sanctum')->id();

        $links = AffiliateLink::with('product')
            ->where('affiliate_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get();

        $totalViews = $links->sum('views');
        $totalPendaftar = $links->sum('pendaftar_count');
        $totalLinks = $links->count();

        $pendaftar = Pendaftar::with(['product'])
            ->whereIn('affiliate_link_id', $links->pluck('id'))
            ->orderBy('created_at', 'desc')
            ->get();

        $pendingPendaftar = $pendaftar->where('status_pendaftaran', 'pending')->count();
        $disetujui = $pendaftar->where('status_pendaftaran', 'disetujui')->count();

        $linkIds = $links->pluck('id');
        $totalKomisiPending = KomisiAffiliate::whereIn('affiliate_link_id', $linkIds)
            ->where('status', 'pending')->sum('jumlah');
        $totalKomisiPaid = KomisiAffiliate::whereIn('affiliate_link_id', $linkIds)
            ->where('status', 'paid')->sum('jumlah');

        // Komisi per link
        $linksData = $links->map(function ($link) {
            $linkKomisi = KomisiAffiliate::where('affiliate_link_id', $link->id)
                ->where('status', 'paid')->sum('jumlah');
            $linkKomisiPending = KomisiAffiliate::where('affiliate_link_id', $link->id)
                ->where('status', 'pending')->sum('jumlah');

            return [
                'id' => $link->id,
                'kode' => $link->kode,
                'nama_link' => $link->nama_link,
                'views' => $link->views,
                'pendaftar_count' => $link->pendaftar_count,
                'product' => $link->product ? [
                    'id' => $link->product->id,
                    'nama' => $link->product->nama,
                    'harga' => $link->product->harga,
                    'komisi' => $link->product->komisi,
                ] : null,
                'komisi_dibayar' => (float) $linkKomisi,
                'komisi_pending' => (float) $linkKomisiPending,
                'total_komisi' => (float) ($linkKomisi + $linkKomisiPending),
            ];
        });

        // Komisi per pendaftar
        $pendaftarData = $pendaftar->map(function ($p) {
            $komisi = KomisiAffiliate::where('pendaftar_id', $p->id)->get();
            return [
                'id' => $p->id,
                'nama' => $p->nama,
                'email' => $p->email,
                'nominal' => $p->nominal,
                'status_pendaftaran' => $p->status_pendaftaran,
                'status_pembayaran' => $p->status_pembayaran,
                'created_at' => $p->created_at,
                'product' => $p->product ? [
                    'nama' => $p->product->nama,
                    'harga' => $p->product->harga,
                    'komisi' => $p->product->komisi,
                ] : null,
                'komisi_diperoleh' => (float) $komisi->where('status', 'paid')->sum('jumlah'),
                'komisi_pending' => (float) $komisi->where('status', 'pending')->sum('jumlah'),
            ];
        });

        $user = Auth::guard('sanctum')->user();

        return response()->json([
            'affiliate' => [
                'name' => $user->name,
                'email' => $user->email,
                'telepon' => $user->no_hp,
                'alamat' => $user->alamat,
            ],
            'stats' => [
                'total_links' => $totalLinks,
                'total_views' => $totalViews,
                'total_pendaftar' => $totalPendaftar,
                'pending' => $pendingPendaftar,
                'disetujui' => $disetujui,
                'komisi_pending' => (float) $totalKomisiPending,
                'komisi_paid' => (float) $totalKomisiPaid,
            ],
            'links' => $linksData,
            'pendaftar' => $pendaftarData,
        ]);
    }
}
