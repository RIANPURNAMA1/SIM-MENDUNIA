<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use Illuminate\Http\Request;

class CouponController extends Controller
{
    public function index()
    {
        return response()->json(Coupon::with('product')->orderBy('created_at', 'desc')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'kode' => 'required|string|max:50|unique:coupons,kode',
            'product_id' => 'nullable|integer|exists:products,id',
            'tipe' => 'required|in:persen,nominal',
            'nilai' => 'required|numeric|min:0',
            'min_pembelian' => 'nullable|numeric|min:0',
            'maks_penggunaan' => 'nullable|integer|min:1',
            'berlaku_mulai' => 'nullable|date',
            'berlaku_sampai' => 'nullable|date|after_or_equal:berlaku_mulai',
            'status' => 'nullable|in:aktif,nonaktif',
        ]);

        $coupon = Coupon::create($data);
        $coupon->load('product');

        return response()->json($coupon, 201);
    }

    public function show($id)
    {
        return response()->json(Coupon::with('product')->findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $coupon = Coupon::findOrFail($id);

        $data = $request->validate([
            'kode' => 'sometimes|string|max:50|unique:coupons,kode,' . $id,
            'product_id' => 'nullable|integer|exists:products,id',
            'tipe' => 'sometimes|in:persen,nominal',
            'nilai' => 'sometimes|numeric|min:0',
            'min_pembelian' => 'nullable|numeric|min:0',
            'maks_penggunaan' => 'nullable|integer|min:1',
            'berlaku_mulai' => 'nullable|date',
            'berlaku_sampai' => 'nullable|date|after_or_equal:berlaku_mulai',
            'status' => 'nullable|in:aktif,nonaktif',
        ]);

        $coupon->update($data);
        $coupon->load('product');

        return response()->json($coupon);
    }

    public function destroy($id)
    {
        $coupon = Coupon::findOrFail($id);
        $coupon->delete();

        return response()->json(['message' => 'Coupon deleted']);
    }

    public function validate(Request $request)
    {
        $data = $request->validate([
            'kode' => 'required|string|exists:coupons,kode',
            'product_id' => 'required|integer|exists:products,id',
            'nominal' => 'required|numeric|min:0',
        ]);

        $coupon = Coupon::where('kode', $data['kode'])->first();

        if ($coupon->status !== 'aktif') {
            return response()->json(['valid' => false, 'message' => 'Kupon tidak aktif'], 422);
        }

        if ($coupon->berlaku_mulai && now()->startOfDay()->lt($coupon->berlaku_mulai)) {
            return response()->json(['valid' => false, 'message' => 'Kupon belum berlaku'], 422);
        }

        if ($coupon->berlaku_sampai && now()->startOfDay()->gt($coupon->berlaku_sampai)) {
            return response()->json(['valid' => false, 'message' => 'Kupon sudah kadaluarsa'], 422);
        }

        if ($coupon->maks_penggunaan && $coupon->penggunaan >= $coupon->maks_penggunaan) {
            return response()->json(['valid' => false, 'message' => 'Kuota kupon habis'], 422);
        }

        if ($coupon->product_id && $coupon->product_id != $data['product_id']) {
            return response()->json(['valid' => false, 'message' => 'Kupon tidak berlaku untuk produk ini'], 422);
        }

        if ($data['nominal'] < $coupon->min_pembelian) {
            return response()->json(['valid' => false, 'message' => 'Minimal pembelian Rp ' . number_format($coupon->min_pembelian, 0, ',', '.')], 422);
        }

        $diskon = $coupon->tipe === 'persen'
            ? round($data['nominal'] * $coupon->nilai / 100)
            : min($coupon->nilai, $data['nominal']);

        return response()->json([
            'valid' => true,
            'coupon' => $coupon,
            'diskon' => $diskon,
            'nominal_setelah_diskon' => $data['nominal'] - $diskon,
        ]);
    }
}
