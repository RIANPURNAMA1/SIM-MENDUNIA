<?php

namespace App\Http\Controllers;

use App\Models\ProductCategory;
use Illuminate\Http\Request;

class ProductCategoryController extends Controller
{
    public function index()
    {
        return response()->json(ProductCategory::orderBy('urutan')->get());
    }

    public function store(Request $request)
    {
        $request->validate(['nama' => 'required|string|max:255']);
        $kat = ProductCategory::create([
            'nama' => $request->nama,
            'urutan' => ProductCategory::max('urutan') + 1,
        ]);
        return response()->json($kat, 201);
    }

    public function update(Request $request, $id)
    {
        $kat = ProductCategory::findOrFail($id);
        $request->validate(['nama' => 'required|string|max:255']);
        $kat->update(['nama' => $request->nama]);
        return response()->json($kat);
    }

    public function destroy($id)
    {
        $kat = ProductCategory::findOrFail($id);
        $kat->products()->update(['category_id' => null]);
        $kat->delete();
        return response()->json(['message' => 'Kategori dihapus']);
    }
}
