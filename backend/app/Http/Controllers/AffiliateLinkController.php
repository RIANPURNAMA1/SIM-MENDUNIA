<?php

namespace App\Http\Controllers;

use App\Models\AffiliateLink;
use App\Models\KomisiAffiliate;
use App\Models\User;
use Illuminate\Http\Request;
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
        $link = AffiliateLink::with(['affiliate', 'product'])
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

    public function affiliateStats()
    {
        $affiliates = User::where('role', 'AFFILIATE')
            ->withSum('affiliateLinks', 'pendaftar_count')
            ->withCount('affiliateLinks')
            ->addSelect(['total_komisi_pending' => KomisiAffiliate::selectRaw('COALESCE(SUM(jumlah), 0)')
                ->whereHas('affiliateLink', fn ($q) => $q->whereColumn('affiliate_id', 'users.id'))
                ->where('status', 'pending'),
            ])
            ->addSelect(['total_komisi_paid' => KomisiAffiliate::selectRaw('COALESCE(SUM(jumlah), 0)')
                ->whereHas('affiliateLink', fn ($q) => $q->whereColumn('affiliate_id', 'users.id'))
                ->where('status', 'paid'),
            ])
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'status', 'created_at']);

        return response()->json($affiliates);
    }
}
