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
            'kategori_items' => 'nullable|array',
            'kategori_items.*.name' => 'required|string|max:100',
            'kategori_items.*.harga' => 'required|numeric|min:0',
            'kategori_items.*.komisi' => 'nullable|numeric|min:0',
            'komisi' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:aktif,nonaktif',
            'komisi_tiers' => 'nullable|array',
            'komisi_tiers.*.kategori_id' => 'nullable|exists:biaya_kategoris,id',
            'komisi_tiers.*.min_orang' => 'required|integer|min:1',
            'komisi_tiers.*.max_orang' => 'nullable|integer|min:1',
            'komisi_tiers.*.komisi' => 'required|numeric|min:0',
            'komisi_tiers.*.urutan' => 'nullable|integer|min:0',
        ]);

        $kategoriItems = $data['kategori_items'] ?? [];
        $totalHarga = collect($kategoriItems)->sum('harga');

        $product = Product::create([
            'nama' => $data['nama'],
            'deskripsi' => $data['deskripsi'] ?? null,
            'kategori_items' => $kategoriItems,
            'harga' => $totalHarga,
            'komisi' => $data['komisi'] ?? null,
            'status' => $data['status'] ?? 'aktif',
        ]);

        $product->syncKategoriItems($kategoriItems);

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
            'kategori_items' => 'nullable|array',
            'kategori_items.*.name' => 'required|string|max:100',
            'kategori_items.*.harga' => 'required|numeric|min:0',
            'kategori_items.*.komisi' => 'nullable|numeric|min:0',
            'komisi' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:aktif,nonaktif',
            'komisi_tiers' => 'nullable|array',
            'komisi_tiers.*.kategori_id' => 'nullable|exists:biaya_kategoris,id',
            'komisi_tiers.*.min_orang' => 'required|integer|min:1',
            'komisi_tiers.*.max_orang' => 'nullable|integer|min:1',
            'komisi_tiers.*.komisi' => 'required|numeric|min:0',
            'komisi_tiers.*.urutan' => 'nullable|integer|min:0',
        ]);

        $updateData = [];
        if (isset($data['nama'])) $updateData['nama'] = $data['nama'];
        if (array_key_exists('deskripsi', $data)) $updateData['deskripsi'] = $data['deskripsi'];
        if (isset($data['komisi'])) $updateData['komisi'] = $data['komisi'];
        if (isset($data['status'])) $updateData['status'] = $data['status'];

        if (isset($data['kategori_items'])) {
            $kategoriItems = $data['kategori_items'];
            $totalHarga = collect($kategoriItems)->sum('harga');

            $updateData['kategori_items'] = $kategoriItems;
            $updateData['harga'] = $totalHarga;

            $product->update($updateData);
            $product->syncKategoriItems($kategoriItems);
        } else {
            $product->update($updateData);
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
