<?php

namespace App\Http\Controllers;

use App\Models\AffiliateLink;
use App\Models\Pendaftar;
use App\Models\KomisiAffiliate;
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

        return response()->json([
            'stats' => [
                'total_links' => $totalLinks,
                'total_views' => $totalViews,
                'total_pendaftar' => $totalPendaftar,
                'pending' => $pendingPendaftar,
                'disetujui' => $disetujui,
                'komisi_pending' => (float) $totalKomisiPending,
                'komisi_paid' => (float) $totalKomisiPaid,
            ],
            'links' => $links,
            'pendaftar' => $pendaftar,
        ]);
    }
}
