<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\KomisiTier;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index()
    {
        return response()->json(Product::with(['biayaKategoris', 'komisiTiers'])->orderBy('created_at', 'desc')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nama' => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
            'harga' => 'required|numeric|min:0',
            'komisi' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:aktif,nonaktif',
            'kategori_prices' => 'nullable|array',
            'kategori_prices.*.kategori_id' => 'required|exists:biaya_kategoris,id',
            'kategori_prices.*.harga' => 'required|numeric|min:0',
            'kategori_prices.*.komisi' => 'nullable|numeric|min:0',
            'komisi_tiers' => 'nullable|array',
            'komisi_tiers.*.kategori_id' => 'nullable|exists:biaya_kategoris,id',
            'komisi_tiers.*.min_orang' => 'required|integer|min:1',
            'komisi_tiers.*.max_orang' => 'nullable|integer|min:1',
            'komisi_tiers.*.komisi' => 'required|numeric|min:0',
            'komisi_tiers.*.urutan' => 'nullable|integer|min:0',
        ]);

        $product = Product::create([
            'nama' => $data['nama'],
            'deskripsi' => $data['deskripsi'] ?? null,
            'harga' => $data['harga'],
            'komisi' => $data['komisi'] ?? null,
            'status' => $data['status'] ?? 'aktif',
        ]);

        if ($request->has('kategori_prices')) {
            $sync = [];
            foreach ($request->kategori_prices as $kp) {
                $sync[$kp['kategori_id']] = [
                    'harga' => $kp['harga'],
                    'komisi' => $kp['komisi'] ?? 0,
                ];
            }
            $product->biayaKategoris()->sync($sync);
        }

        $this->syncKomisiTiers($product, $request);

        return response()->json($product->load(['biayaKategoris', 'komisiTiers']), 201);
    }

    public function show($id)
    {
        return response()->json(Product::with(['biayaKategoris', 'komisiTiers'])->findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);

        $data = $request->validate([
            'nama' => 'sometimes|string|max:255',
            'deskripsi' => 'nullable|string',
            'harga' => 'sometimes|numeric|min:0',
            'komisi' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:aktif,nonaktif',
            'kategori_prices' => 'nullable|array',
            'kategori_prices.*.kategori_id' => 'required|exists:biaya_kategoris,id',
            'kategori_prices.*.harga' => 'required|numeric|min:0',
            'kategori_prices.*.komisi' => 'nullable|numeric|min:0',
            'komisi_tiers' => 'nullable|array',
            'komisi_tiers.*.kategori_id' => 'nullable|exists:biaya_kategoris,id',
            'komisi_tiers.*.min_orang' => 'required|integer|min:1',
            'komisi_tiers.*.max_orang' => 'nullable|integer|min:1',
            'komisi_tiers.*.komisi' => 'required|numeric|min:0',
            'komisi_tiers.*.urutan' => 'nullable|integer|min:0',
        ]);

        $updateData = [];
        if (isset($data['nama'])) $updateData['nama'] = $data['nama'];
        if (isset($data['deskripsi'])) $updateData['deskripsi'] = $data['deskripsi'];
        if (isset($data['harga'])) $updateData['harga'] = $data['harga'];
        if (isset($data['komisi'])) $updateData['komisi'] = $data['komisi'];
        if (isset($data['status'])) $updateData['status'] = $data['status'];

        $product->update($updateData);

        if ($request->has('kategori_prices')) {
            $sync = [];
            foreach ($request->kategori_prices as $kp) {
                $sync[$kp['kategori_id']] = [
                    'harga' => $kp['harga'],
                    'komisi' => $kp['komisi'] ?? 0,
                ];
            }
            $product->biayaKategoris()->sync($sync);

            $total = collect($request->kategori_prices)->sum('harga');
            $product->harga = $total;
            $product->save();
        }

        $this->syncKomisiTiers($product, $request);

        return response()->json($product->load(['biayaKategoris', 'komisiTiers']));
    }

    public function destroy($id)
    {
        $product = Product::findOrFail($id);
        $product->delete();

        return response()->json(['message' => 'Product deleted']);
    }

    private function syncKomisiTiers(Product $product, Request $request)
    {
        if (!$request->has('komisi_tiers')) return;

        $product->komisiTiers()->delete();

        foreach ($request->komisi_tiers as $tier) {
            $product->komisiTiers()->create([
                'kategori_id' => $tier['kategori_id'] ?? null,
                'min_orang' => $tier['min_orang'],
                'max_orang' => $tier['max_orang'] ?? null,
                'komisi' => $tier['komisi'],
                'urutan' => $tier['urutan'] ?? 0,
            ]);
        }
    }
}
