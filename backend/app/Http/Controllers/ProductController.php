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
        $request->validate([
            'nama' => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
            'kategori_items' => 'nullable|array',
            'komisi' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:aktif,nonaktif',
            'komisi_tiers' => 'nullable|array',
            'komisi_tiers.*.kategori_id' => 'nullable|exists:biaya_kategoris,id',
            'komisi_tiers.*.min_orang' => 'required|integer|min:1',
            'komisi_tiers.*.max_orang' => 'nullable|integer|min:1',
            'komisi_tiers.*.komisi' => 'required|numeric|min:0',
            'komisi_tiers.*.urutan' => 'nullable|integer|min:0',
        ]);

        $kategoriItems = $request->input('kategori_items', []);
        $totalHarga = $this->sumHargaDeep($kategoriItems);

        $product = Product::create([
            'nama' => $request->input('nama'),
            'deskripsi' => $request->input('deskripsi'),
            'kategori_items' => $kategoriItems,
            'harga' => $totalHarga,
            'komisi' => $request->input('komisi'),
            'status' => $request->input('status', 'aktif'),
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

        $request->validate([
            'nama' => 'sometimes|string|max:255',
            'deskripsi' => 'nullable|string',
            'kategori_items' => 'nullable|array',
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
        if ($request->has('nama')) $updateData['nama'] = $request->input('nama');
        if ($request->has('deskripsi')) $updateData['deskripsi'] = $request->input('deskripsi');
        if ($request->has('komisi')) $updateData['komisi'] = $request->input('komisi');
        if ($request->has('status')) $updateData['status'] = $request->input('status');

        if ($request->has('kategori_items')) {
            $kategoriItems = $request->input('kategori_items', []);
            $totalHarga = $this->sumHargaDeep($kategoriItems);

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

    private function sumHargaDeep(array $items): float
    {
        $total = 0;
        foreach ($items as $item) {
            $total += $item['harga'] ?? 0;
            if (!empty($item['children'])) {
                $total += $this->sumHargaDeep($item['children']);
            }
        }
        return $total;
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
