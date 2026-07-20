<?php

namespace App\Http\Controllers;

use App\Models\AffiliateLink;
use App\Models\KomisiAffiliate;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class AffiliateLinkController extends Controller
{
    public function index(Request $request)
    {
        $query = AffiliateLink::with(['affiliate', 'product']);

        if ($request->affiliate_id) {
            $query->where('affiliate_id', $request->affiliate_id);
        }

        return response()->json($query->orderBy('created_at', 'desc')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'affiliate_id' => 'required|exists:users,id',
            'product_id' => 'required|exists:products,id',
            'nama_link' => 'nullable|string|max:255',
        ]);

        do {
            $kode = Str::random(8);
        } while (AffiliateLink::where('kode', $kode)->exists());

        $data['kode'] = $kode;

        $link = AffiliateLink::create($data);
        $link->load(['affiliate', 'product']);

        return response()->json($link, 201);
    }

    public function show($id)
    {
        $link = AffiliateLink::with(['affiliate', 'product'])->findOrFail($id);
        return response()->json($link);
    }

    public function showByKode($kode)
    {
        $link = AffiliateLink::with(['affiliate', 'product.batch'])
            ->where('kode', $kode)
            ->where('status', true)
            ->firstOrFail();

        $link->increment('views');

        return response()->json($link);
    }

    public function update(Request $request, $id)
    {
        $link = AffiliateLink::findOrFail($id);

        $data = $request->validate([
            'affiliate_id' => 'sometimes|exists:users,id',
            'product_id' => 'sometimes|exists:products,id',
            'nama_link' => 'nullable|string|max:255',
            'status' => 'sometimes|boolean',
        ]);

        $link->update($data);
        $link->load(['affiliate', 'product']);

        return response()->json($link);
    }

    public function destroy($id)
    {
        $link = AffiliateLink::findOrFail($id);
        $link->delete();

        return response()->json(['message' => 'Link deleted']);
    }

    public function listAffiliates()
    {
        $affiliates = User::where('role', 'AFFILIATE')
            ->where('status', 'AKTIF')
            ->get(['id', 'name', 'email']);

        return response()->json($affiliates);
    }

    public function myLinks(Request $request)
    {
        $userId = Auth::guard('sanctum')->id();

        $data = $request->validate([
            'product_id' => 'required|exists:products,id',
            'nama_link' => 'nullable|string|max:255',
        ]);

        do {
            $kode = Str::random(8);
        } while (AffiliateLink::where('kode', $kode)->exists());

        $link = AffiliateLink::create([
            'affiliate_id' => $userId,
            'product_id' => $data['product_id'],
            'kode' => $kode,
            'nama_link' => $data['nama_link'] ?? null,
        ]);

        $link->load('product');

        return response()->json($link, 201);
    }

    public function availableProducts()
    {
        $products = Product::where('status', 'aktif')
            ->orderBy('nama')
            ->get(['id', 'nama', 'harga', 'komisi']);

        return response()->json($products);
    }

    public function affiliateStats()
    {
        $affiliates = User::where('role', 'AFFILIATE')
            ->withSum('affiliateLinks', 'pendaftar_count')
            ->withCount('affiliateLinks')
            ->addSelect([
                'total_komisi_pending' => \Illuminate\Support\Facades\DB::raw(
                    "(SELECT COALESCE(SUM(ka.jumlah), 0) FROM komisi_affiliates ka JOIN affiliate_links al ON al.id = ka.affiliate_link_id WHERE al.affiliate_id = users.id AND ka.status = 'pending')"
                ),
                'total_komisi_paid' => \Illuminate\Support\Facades\DB::raw(
                    "(SELECT COALESCE(SUM(ka.jumlah), 0) FROM komisi_affiliates ka JOIN affiliate_links al ON al.id = ka.affiliate_link_id WHERE al.affiliate_id = users.id AND ka.status = 'paid')"
                ),
            ])
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'status', 'created_at']);

        return response()->json($affiliates);
    }

    public function detailAffiliate($id)
    {
        $affiliate = User::where('role', 'AFFILIATE')->findOrFail($id);

        $links = AffiliateLink::with(['product', 'pendaftar' => function ($q) {
            $q->select('id', 'nama', 'email', 'telepon', 'status_pendaftaran', 'status_pembayaran', 'affiliate_link_id', 'created_at')
              ->with('product:id,nama,harga,komisi');
        }])
            ->where('affiliate_id', $id)
            ->orderBy('created_at', 'desc')
            ->get();

        $totalPendaftar = $links->sum('pendaftar_count');
        $totalViews = $links->sum('views');

        // Add komisi data per link
        $linksData = $links->map(function ($link) {
            $linkKomisiPaid = KomisiAffiliate::where('affiliate_link_id', $link->id)
                ->where('status', 'paid')->sum('jumlah');
            $linkKomisiPending = KomisiAffiliate::where('affiliate_link_id', $link->id)
                ->where('status', 'pending')->sum('jumlah');

            $pendaftarData = $link->pendaftar->map(function ($p) {
                $komisi = KomisiAffiliate::where('pendaftar_id', $p->id)->get();
                return [
                    'id' => $p->id,
                    'nama' => $p->nama,
                    'email' => $p->email,
                    'telepon' => $p->telepon,
                    'status_pendaftaran' => $p->status_pendaftaran,
                    'status_pembayaran' => $p->status_pembayaran,
                    'created_at' => $p->created_at,
                    'product' => $p->product,
                    'komisi_diperoleh' => (float) $komisi->where('status', 'paid')->sum('jumlah'),
                    'komisi_pending' => (float) $komisi->where('status', 'pending')->sum('jumlah'),
                ];
            });

            return [
                'id' => $link->id,
                'kode' => $link->kode,
                'nama_link' => $link->nama_link,
                'views' => $link->views,
                'pendaftar_count' => $link->pendaftar_count,
                'status' => $link->status,
                'created_at' => $link->created_at,
                'product' => $link->product ? [
                    'id' => $link->product->id,
                    'nama' => $link->product->nama,
                    'harga' => $link->product->harga,
                    'komisi' => $link->product->komisi,
                ] : null,
                'komisi_dibayar' => (float) $linkKomisiPaid,
                'komisi_pending' => (float) $linkKomisiPending,
                'total_komisi' => (float) ($linkKomisiPaid + $linkKomisiPending),
                'pendaftar' => $pendaftarData,
            ];
        });

        $totalKomisiPaid = $linksData->sum('komisi_dibayar');
        $totalKomisiPending = $linksData->sum('komisi_pending');

        return response()->json([
            'affiliate' => $affiliate,
            'links' => $linksData,
            'stats' => [
                'total_links' => $links->count(),
                'total_views' => $totalViews,
                'total_pendaftar' => $totalPendaftar,
                'komisi_paid' => (float) $totalKomisiPaid,
                'komisi_pending' => (float) $totalKomisiPending,
            ],
        ]);
    }
}
