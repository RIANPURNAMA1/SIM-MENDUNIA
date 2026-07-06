<?php

namespace App\Http\Controllers;

use App\Models\Pendaftar;
use App\Models\Siswa;
use App\Models\AffiliateLink;
use App\Models\KomisiAffiliate;
use App\Models\Coupon;
use App\Models\Pembayaran;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class PendaftaranController extends Controller
{
    private function applyCoupon($kodeKupon, $productId, $nominal)
    {
        if (!$kodeKupon) {
            return ['coupon_id' => null, 'diskon' => null];
        }

        $coupon = Coupon::where('kode', $kodeKupon)->first();

        if (!$coupon || $coupon->status !== 'aktif') {
            throw new \Exception('Kupon tidak valid atau tidak aktif');
        }

        if ($coupon->berlaku_mulai && now()->startOfDay()->lt($coupon->berlaku_mulai)) {
            throw new \Exception('Kupon belum berlaku');
        }

        if ($coupon->berlaku_sampai && now()->startOfDay()->gt($coupon->berlaku_sampai)) {
            throw new \Exception('Kupon sudah kadaluarsa');
        }

        if ($coupon->maks_penggunaan && $coupon->penggunaan >= $coupon->maks_penggunaan) {
            throw new \Exception('Kuota kupon habis');
        }

        if ($coupon->product_id && $coupon->product_id != $productId) {
            throw new \Exception('Kupon tidak berlaku untuk produk ini');
        }

        if ($nominal < $coupon->min_pembelian) {
            throw new \Exception('Minimal pembelian Rp ' . number_format($coupon->min_pembelian, 0, ',', '.'));
        }

        $diskon = $coupon->tipe === 'persen'
            ? round($nominal * $coupon->nilai / 100)
            : min($coupon->nilai, $nominal);

        $coupon->increment('penggunaan');

        return ['coupon_id' => $coupon->id, 'diskon' => $diskon];
    }

    public function daftarLangsung(Request $request)
    {
        $data = $request->validate([
            'product_id' => 'required|integer|exists:products,id',
            'batch_id' => 'nullable|integer|exists:batches,id',
            'kode_kupon' => 'nullable|string|max:50',
            'nama' => 'required|string|max:255',
            'email' => 'required|email|unique:pendaftar,email|unique:users,email',
            'password' => 'required|min:6',
            'telepon' => 'nullable|string|max:20',
            'alamat' => 'nullable|string',
            'nominal' => 'required|numeric|min:0',
            'bukti_pembayaran' => 'required|file|mimes:jpg,jpeg,png,pdf|max:2048',
        ]);

        $kupon = $this->applyCoupon($data['kode_kupon'] ?? null, $data['product_id'], $data['nominal']);

        $filePath = $request->file('bukti_pembayaran')->store('bukti_pembayaran', 'public');

        $user = User::create([
            'name' => $data['nama'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role' => 'KANDIDAT',
            'status' => 'AKTIF',
        ]);

        $pendaftar = Pendaftar::create([
            'product_id' => $data['product_id'],
            'batch_id' => $data['batch_id'] ?? null,
            'coupon_id' => $kupon['coupon_id'],
            'nama' => $data['nama'],
            'email' => $data['email'],
            'password' => $user->password,
            'telepon' => $data['telepon'],
            'alamat' => $data['alamat'],
            'nominal' => $data['nominal'],
            'diskon' => $kupon['diskon'],
            'bukti_pembayaran' => $filePath,
            'status_pendaftaran' => 'pending',
            'status_pembayaran' => 'processing',
            'user_id' => $user->id,
        ]);

        return response()->json([
            'message' => 'Pendaftaran berhasil, silakan tunggu konfirmasi admin',
            'user' => $user,
        ], 201);
    }

    public function daftar(Request $request)
    {
        $data = $request->validate([
            'kode_link' => 'required|string|exists:affiliate_links,kode',
            'batch_id' => 'nullable|integer|exists:batches,id',
            'kode_kupon' => 'nullable|string|max:50',
            'nama' => 'required|string|max:255',
            'email' => 'required|email|unique:pendaftar,email|unique:users,email',
            'password' => 'required|min:6',
            'telepon' => 'nullable|string|max:20',
            'alamat' => 'nullable|string',
            'nominal' => 'required|numeric|min:0',
            'bukti_pembayaran' => 'required|file|mimes:jpg,jpeg,png,pdf|max:2048',
        ]);

        $link = AffiliateLink::with('product')->where('kode', $data['kode_link'])->firstOrFail();

        $kupon = $this->applyCoupon($data['kode_kupon'] ?? null, $link->product_id, $data['nominal']);

        $filePath = $request->file('bukti_pembayaran')->store('bukti_pembayaran', 'public');

        $user = User::create([
            'name' => $data['nama'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role' => 'KANDIDAT',
            'status' => 'AKTIF',
        ]);

        $pendaftar = Pendaftar::create([
            'affiliate_link_id' => $link->id,
            'product_id' => $link->product_id,
            'batch_id' => $data['batch_id'] ?? null,
            'coupon_id' => $kupon['coupon_id'],
            'nama' => $data['nama'],
            'email' => $data['email'],
            'password' => $user->password,
            'telepon' => $data['telepon'],
            'alamat' => $data['alamat'],
            'nominal' => $data['nominal'],
            'diskon' => $kupon['diskon'],
            'bukti_pembayaran' => $filePath,
            'status_pendaftaran' => 'pending',
            'status_pembayaran' => 'processing',
            'user_id' => $user->id,
        ]);

        $link->increment('pendaftar_count');

        Auth::login($user);

        return response()->json([
            'message' => 'Pendaftaran berhasil',
            'user' => $user,
            'redirect' => '/dashboard-kandidat',
        ], 201);
    }

    public function index(Request $request)
    {
        $query = Pendaftar::with(['affiliateLink.affiliate', 'product', 'user', 'coupon']);

        if ($request->status_pendaftaran) {
            $query->where('status_pendaftaran', $request->status_pendaftaran);
        }

        if ($request->status_pembayaran) {
            $query->where('status_pembayaran', $request->status_pembayaran);
        }

        if ($request->search) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('nama', 'like', "%{$s}%")
                  ->orWhere('email', 'like', "%{$s}%");
            });
        }

        return response()->json($query->orderBy('created_at', 'desc')->get());
    }

    public function show($id)
    {
        $pendaftar = Pendaftar::with(['affiliateLink.affiliate', 'product', 'user', 'coupon'])->findOrFail($id);
        return response()->json($pendaftar);
    }

    public function approve($id)
    {
        $pendaftar = Pendaftar::with(['affiliateLink.product'])->findOrFail($id);
        $pendaftar->update([
            'status_pendaftaran' => 'disetujui',
            'status_pembayaran' => 'verified',
        ]);

        if ($pendaftar->user_id) {
            $user = User::find($pendaftar->user_id);
            if ($user) {
                Siswa::updateOrCreate(
                    ['user_id' => $user->id],
                    [
                        'nama' => $pendaftar->nama,
                        'batch_id' => $pendaftar->batch_id,
                        'no_hp' => $pendaftar->telepon,
                        'alamat' => $pendaftar->alamat,
                        'status' => 'AKTIF',
                    ]
                );
            }
        }

        // Catat komisi untuk affiliate
        if ($pendaftar->affiliate_link_id && $pendaftar->affiliateLink->product?->komisi) {
            KomisiAffiliate::create([
                'affiliate_link_id' => $pendaftar->affiliate_link_id,
                'pendaftar_id' => $pendaftar->id,
                'jumlah' => $pendaftar->affiliateLink->product->komisi,
                'status' => 'pending',
            ]);
        }

        return response()->json(['message' => 'Pendaftar disetujui']);
    }

    public function reject($id)
    {
        $pendaftar = Pendaftar::findOrFail($id);
        $pendaftar->update([
            'status_pendaftaran' => 'ditolak',
        ]);

        return response()->json(['message' => 'Pendaftar ditolak']);
    }

    public function verifyPayment($id)
    {
        $pendaftar = Pendaftar::findOrFail($id);
        $pendaftar->update(['status_pembayaran' => 'verified']);

        Pembayaran::where('pendaftar_id', $pendaftar->id)
            ->where('status', 'pending')
            ->update(['status' => 'verified']);

        return response()->json(['message' => 'Pembayaran terverifikasi']);
    }

    public function riwayatPembayaran($id)
    {
        $pendaftar = Pendaftar::findOrFail($id);
        $riwayat = Pembayaran::where('pendaftar_id', $pendaftar->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($riwayat);
    }

    public function bayar(Request $request, $id)
    {
        $request->validate([
            'jumlah' => 'required|numeric|min:1',
            'bukti_pembayaran' => 'required|file|mimes:jpg,jpeg,png,pdf|max:2048',
        ]);

        $pendaftar = Pendaftar::findOrFail($id);

        $filePath = $request->file('bukti_pembayaran')->store('bukti_pembayaran', 'public');

        Pembayaran::create([
            'pendaftar_id' => $pendaftar->id,
            'jumlah' => $request->jumlah,
            'bukti_pembayaran' => $filePath,
            'status' => 'pending',
        ]);

        $pendaftar->increment('nominal', $request->jumlah);
        $pendaftar->status_pembayaran = 'processing';
        $pendaftar->save();

        return response()->json([
            'message' => 'Pembayaran berhasil dikirim, menunggu verifikasi admin',
            'pendaftar' => $pendaftar->fresh()->load('product'),
        ]);
    }

    public function destroy($id)
    {
        $pendaftar = Pendaftar::findOrFail($id);

        if ($pendaftar->bukti_pembayaran) {
            Storage::disk('public')->delete($pendaftar->bukti_pembayaran);
        }

        $pendaftar->delete();

        return response()->json(['message' => 'Pendaftar deleted']);
    }

    public function kandidat(Request $request)
    {
        $query = Pendaftar::with(['product', 'batch', 'user']);

        if ($request->search) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('nama', 'like', "%{$s}%")
                  ->orWhere('email', 'like', "%{$s}%");
            });
        }

        $pendaftar = $query->orderBy('created_at', 'desc')->get();

        $grouped = $pendaftar->groupBy(function ($p) {
            return $p->batch_id ?? 0;
        });

        $batches = [];
        $ungrouped = $grouped->pull(0);

        foreach ($grouped as $batchId => $items) {
            $batch = $items->first()->batch;
            $batches[] = [
                'id' => $batchId,
                'nama' => $batch?->nama_batch ?? 'Batch #' . $batchId,
                'jumlahKandidat' => $items->count(),
                'kandidat' => $items->map(function ($p) {
                    return [
                        'id' => $p->id,
                        'nama' => $p->nama,
                        'email' => $p->email,
                        'telepon' => $p->telepon,
                        'posisi' => $p->product?->nama ?? '-',
                        'status' => $p->status_pendaftaran === 'pending' ? 'Pending'
                            : ($p->status_pendaftaran === 'disetujui' ? 'Disetujui'
                            : ($p->status_pendaftaran === 'ditolak' ? 'Ditolak' : $p->status_pendaftaran)),
                        'tanggalDaftar' => $p->created_at->format('d F Y'),
                        'user_id' => $p->user_id,
                    ];
                }),
            ];
        }

        if ($ungrouped) {
            $batches[] = [
                'id' => 0,
                'nama' => 'Tanpa Batch',
                'jumlahKandidat' => $ungrouped->count(),
                'kandidat' => $ungrouped->map(function ($p) {
                    return [
                        'id' => $p->id,
                        'nama' => $p->nama,
                        'email' => $p->email,
                        'telepon' => $p->telepon,
                        'posisi' => $p->product?->nama ?? '-',
                        'status' => $p->status_pendaftaran === 'pending' ? 'Pending'
                            : ($p->status_pendaftaran === 'disetujui' ? 'Disetujui'
                            : ($p->status_pendaftaran === 'ditolak' ? 'Ditolak' : $p->status_pendaftaran)),
                        'tanggalDaftar' => $p->created_at->format('d F Y'),
                        'user_id' => $p->user_id,
                    ];
                }),
            ];
        }

        $totalKandidat = $pendaftar->count();
        $kandidatAktif = $pendaftar->where('status_pendaftaran', 'disetujui')->count();

        return response()->json([
            'batches' => $batches,
            'totalBatch' => count($batches),
            'totalKandidat' => $totalKandidat,
            'kandidatAktif' => $kandidatAktif,
        ]);
    }
}
