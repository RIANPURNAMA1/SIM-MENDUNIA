<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\KomisiTier;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    public function index()
    {
        return response()->json(Product::with(['biayaKategoris', 'komisiTiers', 'batch'])->orderBy('created_at', 'desc')->get());
    }

    public function showBySlug($slug)
    {
        $product = Product::with(['biayaKategoris', 'batch'])
            ->where('slug', $slug)
            ->where('status', '!=', 'nonaktif')
            ->first();

        if (!$product) {
            return response()->json(['message' => 'Program tidak ditemukan'], 404);
        }

        return response()->json($product);
    }

    public function store(Request $request)
    {
        $this->decodeJsonFields($request);

        $request->validate([
            'nama' => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
            'kategori_items' => 'nullable|array',
            'komisi' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:aktif,nonaktif',
            'is_affiliable' => 'nullable',
            'batch_id' => 'nullable|exists:batches,id',
            'gambar' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            'komisi_tiers' => 'nullable|array',
            'komisi_tiers.*.kategori_id' => 'nullable|exists:biaya_kategoris,id',
            'komisi_tiers.*.kategori_name' => 'nullable|string|max:255',
            'komisi_tiers.*.batch_id' => 'nullable|exists:batches,id',
            'komisi_tiers.*.min_orang' => 'required|integer|min:1',
            'komisi_tiers.*.max_orang' => 'nullable|integer|min:1',
            'komisi_tiers.*.komisi' => 'required|numeric|min:0',
            'komisi_tiers.*.urutan' => 'nullable|integer|min:0',
        ]);

        $kategoriItems = $this->parseArrayInput($request, 'kategori_items', []);
        $totalHarga = $this->sumHargaDeep($kategoriItems);

        $gambarPath = null;
        if ($request->hasFile('gambar')) {
            $gambarPath = $request->file('gambar')->store('products', 'public');
        }

        $product = Product::create([
            'nama' => $request->input('nama'),
            'deskripsi' => $request->input('deskripsi'),
            'kategori_items' => $kategoriItems,
            'harga' => $totalHarga,
            'komisi' => $request->input('komisi'),
            'status' => $request->input('status', 'aktif'),
            'is_affiliable' => $request->boolean('is_affiliable', true),
            'batch_id' => $request->input('batch_id'),
            'gambar' => $gambarPath,
        ]);

        $product->syncKategoriItems($kategoriItems);

        $this->syncKomisiTiers($product, $request);

        return response()->json($product->load(['biayaKategoris', 'komisiTiers', 'batch']), 201);
    }

    public function show($slugOrId)
    {
        $product = is_numeric($slugOrId)
            ? Product::with(['biayaKategoris', 'komisiTiers', 'batch'])->find($slugOrId)
            : Product::with(['biayaKategoris', 'komisiTiers', 'batch'])->where('slug', $slugOrId)->first();

        if (!$product) return response()->json(['message' => 'Not found'], 404);

        return response()->json($product);
    }

    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);

        $this->decodeJsonFields($request);

        $request->validate([
            'nama' => 'sometimes|string|max:255',
            'deskripsi' => 'nullable|string',
            'kategori_items' => 'nullable|array',
            'komisi' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:aktif,nonaktif',
            'is_affiliable' => 'nullable',
            'batch_id' => 'nullable|exists:batches,id',
            'gambar' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            'komisi_tiers' => 'nullable|array',
            'komisi_tiers.*.kategori_id' => 'nullable|exists:biaya_kategoris,id',
            'komisi_tiers.*.kategori_name' => 'nullable|string|max:255',
            'komisi_tiers.*.batch_id' => 'nullable|exists:batches,id',
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
        if ($request->exists('is_affiliable')) $updateData['is_affiliable'] = $request->boolean('is_affiliable');
        if ($request->has('batch_id')) $updateData['batch_id'] = $request->input('batch_id');

        if ($request->has('nama')) {
            $updateData['slug'] = $this->generateUniqueSlug($request->input('nama'), $product->id);
        }

        // Handle gambar upload
        if ($request->hasFile('gambar')) {
            if ($product->gambar) {
                Storage::disk('public')->delete($product->gambar);
            }
            $updateData['gambar'] = $request->file('gambar')->store('products', 'public');
        } elseif ($request->input('hapus_gambar') === '1') {
            if ($product->gambar) {
                Storage::disk('public')->delete($product->gambar);
            }
            $updateData['gambar'] = null;
        }

        if ($request->has('kategori_items')) {
            $kategoriItems = $this->parseArrayInput($request, 'kategori_items', []);
            $totalHarga = $this->sumHargaDeep($kategoriItems);

            $updateData['kategori_items'] = $kategoriItems;
            $updateData['harga'] = $totalHarga;

            $product->update($updateData);
            $product->syncKategoriItems($kategoriItems);
        } else {
            $product->update($updateData);
        }

        $this->syncKomisiTiers($product, $request);

        return response()->json($product->load(['biayaKategoris', 'komisiTiers', 'batch']));
    }

    public function destroy($id)
    {
        $product = Product::findOrFail($id);
        $product->delete();

        return response()->json(['message' => 'Product deleted']);
    }

    private function decodeJsonFields(Request $request): void
    {
        foreach (['kategori_items', 'komisi_tiers'] as $field) {
            $value = $request->input($field);
            if (is_string($value)) {
                $decoded = json_decode($value, true);
                if (is_array($decoded)) {
                    $request->merge([$field => $decoded]);
                }
            }
        }
    }

    private function parseArrayInput(Request $request, string $key, array $default = []): array
    {
        $value = $request->input($key);
        if (is_string($value)) {
            $decoded = json_decode($value, true);
            return is_array($decoded) ? $decoded : $default;
        }
        return is_array($value) ? $value : $default;
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
        $komisiTiers = $this->parseArrayInput($request, 'komisi_tiers', []);
        if (empty($komisiTiers)) return;

        $product->komisiTiers()->delete();

        // Reload biayaKategoris to resolve kategori_name → kategori_id
        $product->load('biayaKategoris');

        $komisiTiers = $this->parseArrayInput($request, 'komisi_tiers', []);
        foreach ($komisiTiers as $tier) {
            $kategoriId = $tier['kategori_id'] ?? null;

            // Resolve kategori_name to kategori_id if not provided
            if (!$kategoriId && !empty($tier['kategori_name'])) {
                $name = strtolower(trim($tier['kategori_name']));
                $kategori = $product->biayaKategoris->first(
                    fn($k) => strtolower($k->nama) === $name || strtolower($k->kode) === $name
                );
                $kategoriId = $kategori?->id;
            }

            // Fallback: search from kategori_items JSON tree
            if (!$kategoriId && !empty($tier['kategori_name'])) {
                $name = strtolower(trim($tier['kategori_name']));
                $kategoriId = $this->findKategoriIdFromItems($product->kategori_items ?? [], $name);
            }

            $product->komisiTiers()->create([
                'kategori_id' => $kategoriId,
                'batch_id' => $tier['batch_id'] ?? null,
                'min_orang' => $tier['min_orang'],
                'max_orang' => $tier['max_orang'] ?? null,
                'komisi' => $tier['komisi'],
                'urutan' => $tier['urutan'] ?? 0,
            ]);
        }
    }

    private function findKategoriIdFromItems(array $items, string $lowerName): ?int
    {
        foreach ($items as $item) {
            if (strtolower(trim($item['name'] ?? '')) === $lowerName) {
                $kategori = \App\Models\BiayaKategori::whereRaw('LOWER(nama) = ?', [$lowerName])->first();
                if ($kategori) return $kategori->id;
            }
            if (!empty($item['children'])) {
                $found = $this->findKategoriIdFromItems($item['children'], $lowerName);
                if ($found) return $found;
            }
        }
        return null;
    }

    private function generateUniqueSlug(string $name, ?int $exceptId = null): string
    {
        $slug = Str::slug($name);
        $original = $slug;
        $n = 1;
        $query = Product::where('slug', $slug);
        if ($exceptId) $query->where('id', '!=', $exceptId);
        while ($query->exists()) {
            $slug = $original . '-' . $n++;
            $query = Product::where('slug', $slug);
            if ($exceptId) $query->where('id', '!=', $exceptId);
        }
        return $slug;
    }
}
