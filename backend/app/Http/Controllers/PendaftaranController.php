<?php

namespace App\Http\Controllers;

use App\Models\Pendaftar;
use App\Models\Siswa;
use App\Models\AffiliateLink;
use App\Models\KomisiAffiliate;
use App\Models\Coupon;
use App\Models\BatchBiaya;
use App\Models\BiayaKategori;
use App\Models\Pembayaran;
use App\Models\PembayaranItem;
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
            'telepon' => 'required|string|max:20',
            'alamat' => 'required|string',
            'provinsi' => 'nullable|string|max:255',
            'kabupaten' => 'nullable|string|max:255',
            'kecamatan' => 'nullable|string|max:255',
            'desa' => 'nullable|string|max:255',
            'bank_asal' => 'required|string|max:100',
            'nama_rekening' => 'required|string|max:255',
            'nominal' => 'required|numeric|min:0',
            'bukti_pembayaran' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',
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
            'provinsi' => $data['provinsi'] ?? null,
            'kabupaten' => $data['kabupaten'] ?? null,
            'kecamatan' => $data['kecamatan'] ?? null,
            'desa' => $data['desa'] ?? null,
            'bank_asal' => $data['bank_asal'],
            'nama_rekening' => $data['nama_rekening'],
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
            'telepon' => 'required|string|max:20',
            'alamat' => 'required|string',
            'bank_asal' => 'required|string|max:100',
            'nama_rekening' => 'required|string|max:255',
            'nominal' => 'required|numeric|min:0',
            'bukti_pembayaran' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',
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
            'bank_asal' => $data['bank_asal'],
            'nama_rekening' => $data['nama_rekening'],
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
        $pendaftars = Pendaftar::with(['affiliateLink.affiliate', 'product.biayaKategoris', 'user', 'coupon', 'batch'])
            ->orderBy('created_at', 'desc');

        if ($request->status_pendaftaran) {
            $pendaftars->where('status_pendaftaran', $request->status_pendaftaran);
        }

        if ($request->status_pembayaran) {
            $pendaftars->where('status_pembayaran', $request->status_pembayaran);
        }

        if ($request->search) {
            $s = $request->search;
            $pendaftars->where(function ($q) use ($s) {
                $q->where('nama', 'like', "%{$s}%")
                  ->orWhere('email', 'like', "%{$s}%")
                  ->orWhere('no_registrasi', 'like', "%{$s}%");
            });
        }

        if ($request->batch_id) {
            $pendaftars->where('batch_id', $request->batch_id);
        }

        if ($request->product_id) {
            $pendaftars->where('product_id', $request->product_id);
        }

        $data = $pendaftars->get();

        // Include per-kategori payments
        $kategoris = BiayaKategori::orderBy('urutan')->get();
        $pendaftarIds = $data->pluck('id');
        $allPembayaran = PembayaranItem::whereIn('pendaftar_id', $pendaftarIds)
            ->get()
            ->groupBy('pendaftar_id');

        $result = $data->map(function ($p) use ($kategoris, $allPembayaran) {
            $pembayaranItems = $allPembayaran->get($p->id, collect())->keyBy('kategori_id');
            $product = $p->product;
            $pivotPrices = collect();
            if ($product && $product->relationLoaded('biayaKategoris')) {
                $pivotPrices = $product->biayaKategoris->keyBy('id')->map(fn($k) => (int) $k->pivot->harga);
            }
            $detail = $kategoris->map(function ($k) use ($pembayaranItems, $pivotPrices) {
                $pi = $pembayaranItems->get($k->id);
                $default = $pivotPrices->get($k->id, 0);
                return [
                    'kategori_id' => $k->id,
                    'kode' => $k->kode,
                    'nama' => $k->nama,
                    'biaya' => $default,
                    'dibayar' => $pi ? (int) $pi->jumlah : 0,
                ];
            });
            return array_merge($p->toArray(), ['detail' => $detail]);
        });

        return response()->json($result);
    }

    public function show($id)
    {
        $pendaftar = Pendaftar::with(['affiliateLink.affiliate', 'product', 'user', 'coupon', 'batch'])->findOrFail($id);
        return response()->json($pendaftar);
    }

    public function approve($id)
    {
        $pendaftar = Pendaftar::with(['affiliateLink.product', 'product.biayaKategoris'])->findOrFail($id);

        // Generate No. Registrasi: REG/YYYYMMDD/XXXX
        $today = now()->format('Ymd');
        $lastReg = Pendaftar::where('no_registrasi', 'like', "REG/{$today}/%")
            ->orderByDesc('no_registrasi')
            ->value('no_registrasi');
        if ($lastReg) {
            $lastNum = (int) substr($lastReg, -4);
            $nextNum = str_pad($lastNum + 1, 4, '0', STR_PAD_LEFT);
        } else {
            $nextNum = '0001';
        }
        $noReg = "REG/{$today}/{$nextNum}";

        $pendaftar->update([
            'status_pendaftaran' => 'disetujui',
            'status_pembayaran' => 'verified',
            'no_registrasi' => $noReg,
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
                        'no_registrasi' => $noReg,
                        'status' => 'AKTIF',
                    ]
                );
            }
        }

        // Komisi affiliate dicatat saat Level 1 LUNAS (lihat cekDanCatatKomisiAffiliate)

        // Auto-create PembayaranItem and Pembayaran for first category if none exist
        $existingItems = PembayaranItem::where('pendaftar_id', $pendaftar->id)->count();
        if ($existingItems === 0) {
            $firstKat = BiayaKategori::orderBy('urutan')->first();
            if ($firstKat && $pendaftar->nominal > 0) {
                PembayaranItem::updateOrCreate(
                    [
                        'pendaftar_id' => $pendaftar->id,
                        'kategori_id' => $firstKat->id,
                    ],
                    ['jumlah' => $pendaftar->nominal]
                );
                Pembayaran::create([
                    'pendaftar_id' => $pendaftar->id,
                    'jumlah' => $pendaftar->nominal,
                    'kategori_id' => $firstKat->id,
                    'status' => 'verified',
                    'bukti_pembayaran' => $pendaftar->bukti_pembayaran ?? 'auto',
                ]);
            }
        }

        // WA: Kirim notifikasi persetujuan + tagihan baru
        try {
            $waService = new \App\Services\WhatsAppService();
            $waService->sendRegistrationApprovedNotification($pendaftar->fresh()->load('product'));
            $noInvoice = 'INV/' . str_pad($pendaftar->id, 5, '0', STR_PAD_LEFT) . '/' . $pendaftar->created_at->format('Ym');
            $waService->sendNewBillNotification($pendaftar->fresh()->load(['product', 'user']), $noInvoice);
        } catch (\Exception $e) {
            \Log::error('Gagal kirim notifikasi WA approve: ' . $e->getMessage());
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
        $pendaftar = Pendaftar::with('user')->findOrFail($id);
        $pendaftar->update(['status_pembayaran' => 'verified']);

        $pembayarans = Pembayaran::with('kategori')->where('pendaftar_id', $pendaftar->id)
            ->where('status', 'pending')
            ->get();

        foreach ($pembayarans as $p) {
            $p->update(['status' => 'verified']);
        }

        // Recalculate PembayaranItem: SUM total verified per kategori
        $verifiedByKategori = Pembayaran::where('pendaftar_id', $pendaftar->id)
            ->where('status', 'verified')
            ->whereNotNull('kategori_id')
            ->selectRaw('kategori_id, SUM(jumlah) as total')
            ->groupBy('kategori_id')
            ->get();

        foreach ($verifiedByKategori as $vb) {
            PembayaranItem::updateOrCreate(
                [
                    'pendaftar_id' => $pendaftar->id,
                    'kategori_id' => $vb->kategori_id,
                ],
                ['jumlah' => $vb->total]
            );
        }

        // Sync total nominal
        $totalDibayar = PembayaranItem::where('pendaftar_id', $pendaftar->id)->sum('jumlah');
        $pendaftar->nominal = $totalDibayar;
        $pendaftar->save();

        $this->cekDanCatatKomisiAffiliate($pendaftar->fresh());

        // Kirim notifikasi WA ke kandidat
        try {
            $waService = new \App\Services\WhatsAppService();
            $kategoriNama = $pembayarans->first()?->kategori?->nama ?? 'Pembayaran';
            $jumlahDibayar = $pembayarans->sum('jumlah');
            $freshPendaftar = $pendaftar->fresh()->load(['user', 'product.biayaKategoris']);

            // Hitung total tagihan dan sisa
            $totalBiaya = 0;
            if ($freshPendaftar->product && $freshPendaftar->product->relationLoaded('biayaKategoris')) {
                $totalBiaya = $freshPendaftar->product->biayaKategoris->sum(fn($k) => (int) $k->pivot->harga);
            }
            $totalBiaya = $totalBiaya ?: ($freshPendaftar->product?->harga ?? 0);
            $tagihan = $totalBiaya - ($freshPendaftar->diskon ?? 0);
            $sisa = max(0, $tagihan - $totalDibayar);

            if ($sisa <= 0 && $tagihan > 0) {
                // Lunas
                $waService->sendFullPaymentNotification($freshPendaftar);
            } else {
                // Cicilan / sebagian
                $waService->sendPartialPaymentNotification($freshPendaftar, $kategoriNama, $jumlahDibayar);
            }
        } catch (\Exception $e) {
            \Log::error('Gagal kirim notifikasi WA verifikasi: ' . $e->getMessage());
        }

        return response()->json(['message' => 'Pembayaran terverifikasi']);
    }

    /**
     * Tolak pembayaran (hapus record pending)
     */
    public function rejectPayment($pembayaranId)
    {
        $pembayaran = Pembayaran::with('pendaftar')->findOrFail($pembayaranId);

        if ($pembayaran->status !== 'pending') {
            return response()->json(['message' => 'Hanya pembayaran pending yang bisa ditolak'], 422);
        }

        $pendaftar = $pembayaran->pendaftar;
        $kategoriId = $pembayaran->kategori_id;
        $jumlah = $pembayaran->jumlah;

        // Hapus record pembayaran
        $pembayaran->delete();

        // Kurangi nominal pendaftar
        if ($pendaftar) {
            $pendaftar->decrement('nominal', $jumlah);
        }

        // Recalculate PembayaranItem: SUM total verified per kategori
        if ($kategoriId && $pendaftar) {
            $totalVerified = Pembayaran::where('pendaftar_id', $pendaftar->id)
                ->where('kategori_id', $kategoriId)
                ->where('status', 'verified')
                ->sum('jumlah');

            if ($totalVerified > 0) {
                PembayaranItem::updateOrCreate(
                    ['pendaftar_id' => $pendaftar->id, 'kategori_id' => $kategoriId],
                    ['jumlah' => $totalVerified]
                );
            } else {
                PembayaranItem::where('pendaftar_id', $pendaftar->id)
                    ->where('kategori_id', $kategoriId)
                    ->delete();
            }
        }

        // Kirim notifikasi WA ke kandidat
        try {
            if ($pendaftar) {
                $waService = new \App\Services\WhatsAppService();
                $kategoriNama = $pembayaran->kategori?->nama ?? 'Pembayaran';
                $waService->sendPaymentRejectedNotification(
                    $pendaftar->fresh()->load(['user', 'product']),
                    $kategoriNama,
                    'Nominal tidak sesuai atau bukti kurang jelas'
                );
            }
        } catch (\Exception $e) {
            \Log::error('Gagal kirim notifikasi WA reject: ' . $e->getMessage());
        }

        return response()->json(['message' => 'Pembayaran ditolak dan dihapus']);
    }

    public function pendingCount()
    {
        $pendaftaran = Pendaftar::where('status_pendaftaran', 'pending')->count();
        $tagihan = Pendaftar::where('status_pembayaran', 'processing')->count();
        return response()->json(['count' => $pendaftaran, 'tagihan' => $tagihan]);
    }

    public function allPembayaran(Request $request)
    {
        $query = Pembayaran::with(['pendaftar.product']);

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->search) {
            $s = $request->search;
            $query->whereHas('pendaftar', function ($q) use ($s) {
                $q->where('nama', 'like', "%{$s}%")
                  ->orWhere('email', 'like', "%{$s}%");
            });
        }

        if ($request->tgl_mulai) {
            $query->whereDate('created_at', '>=', $request->tgl_mulai);
        }
        if ($request->tgl_selesai) {
            $query->whereDate('created_at', '<=', $request->tgl_selesai);
        }

        $pembayaran = $query->orderBy('created_at', 'desc')->get();

        // Also include payments from pendaftar that don't have pembayaran records yet
        $existingPendaftarIds = Pembayaran::pluck('pendaftar_id')->unique()->toArray();
        $pendaftarWithoutPembayaran = \App\Models\Pendaftar::with('product')
            ->whereNotIn('id', $existingPendaftarIds)
            ->where('nominal', '>', 0)
            ->where(function ($q) use ($request) {
                if ($request->status) {
                    $q->where('status_pembayaran', $request->status === 'verified' ? 'verified' : $request->status);
                }
                if ($request->search) {
                    $s = $request->search;
                    $q->where('nama', 'like', "%{$s}%")
                      ->orWhere('email', 'like', "%{$s}%");
                }
            })
            ->get();

        $synthetic = $pendaftarWithoutPembayaran->map(function ($p) {
            $tagihan = ($p->product?->harga ?? 0) - ($p->diskon ?? 0);
            return [
                'id' => -$p->id,
                'pendaftar_id' => $p->id,
                'jumlah' => $p->nominal,
                'status' => $p->status_pembayaran === 'verified' ? 'verified' : ($p->status_pembayaran ?: 'pending'),
                'created_at' => $p->updated_at ?? $p->created_at,
                'updated_at' => $p->updated_at ?? $p->created_at,
                'bukti_pembayaran' => null,
                'pendaftar' => $p->load('product')->toArray(),
            ];
        });

        $merged = collect($pembayaran->toArray())
            ->merge($synthetic)
            ->sortByDesc('created_at')
            ->values();

        return response()->json($merged);
    }

    public function pendingPembayaran()
    {
        $pembayaran = Pembayaran::with(['pendaftar.product', 'kategori'])
            ->where('status', 'pending')
            ->whereNotNull('kategori_id')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'total' => $pembayaran->count(),
            'data' => $pembayaran,
        ]);
    }

    public function riwayatPembayaran($id)
    {
        $pendaftar = Pendaftar::with('product.biayaKategoris')->findOrFail($id);

        $pembayaran = Pembayaran::with('kategori')->where('pendaftar_id', $pendaftar->id)
            ->orderBy('created_at', 'desc')
            ->get();

        // Include PembayaranItem as synthetic records (for payments created during approve)
        $paidKatIds = $pembayaran->pluck('kategori_id')->filter()->unique()->values()->toArray();
        $items = PembayaranItem::with('kategori')->where('pendaftar_id', $pendaftar->id)
            ->whereNotIn('kategori_id', $paidKatIds)
            ->get();

        $synthetic = $items->map(function ($item) use ($pendaftar) {
            return (object) [
                'id' => -$item->id,
                'pendaftar_id' => $pendaftar->id,
                'jumlah' => $item->jumlah,
                'status' => 'verified',
                'created_at' => $item->created_at ?? $pendaftar->updated_at ?? $pendaftar->created_at,
                'bukti_pembayaran' => $pendaftar->bukti_pembayaran ?? null,
                'kategori_id' => $item->kategori_id,
                'kategori' => $item->kategori,
            ];
        });

        $riwayat = collect($pembayaran)->merge($synthetic)->sortByDesc('created_at')->values();

        // Fallback: if still empty but pendaftar has nominal > 0
        if ($riwayat->isEmpty() && $pendaftar->nominal > 0) {
            $riwayat = collect([
                (object) [
                    'id' => -$pendaftar->id,
                    'pendaftar_id' => $pendaftar->id,
                    'jumlah' => $pendaftar->nominal,
                    'status' => $pendaftar->status_pembayaran === 'verified' ? 'verified' : ($pendaftar->status_pembayaran ?: 'pending'),
                    'created_at' => $pendaftar->updated_at ?? $pendaftar->created_at,
                    'bukti_pembayaran' => $pendaftar->bukti_pembayaran ?? null,
                ]
            ]);
        }

        return response()->json($riwayat);
    }

    public function bayar(Request $request, $id)
    {
        $request->validate([
            'jumlah' => 'required|numeric|min:1',
            'kategori_id' => 'required|exists:biaya_kategoris,id',
            'bukti_pembayaran' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ]);

        $pendaftar = Pendaftar::with('batch')->findOrFail($id);

        $filePath = $request->file('bukti_pembayaran')->store('bukti_pembayaran', 'public');

        $kategori = BiayaKategori::find($request->kategori_id);

        Pembayaran::create([
            'pendaftar_id' => $pendaftar->id,
            'jumlah' => $request->jumlah,
            'kategori_id' => $request->kategori_id,
            'bukti_pembayaran' => $filePath,
            'status' => 'pending',
        ]);

        $pendaftar->increment('nominal', $request->jumlah);
        $pendaftar->status_pembayaran = 'processing';
        $pendaftar->save();

        // Kirim notifikasi WA ke admin
        try {
            $waService = new \App\Services\WhatsAppService();
            $waService->sendPaymentNotificationToAdmin(
                $pendaftar->fresh()->load('batch'),
                $request->jumlah,
                $kategori?->nama ?? 'Tidak Diketahui',
                $filePath
            );
        } catch (\Exception $e) {
            \Log::error('Gagal kirim notifikasi WA pembayaran: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Pembayaran berhasil dikirim, menunggu verifikasi admin',
            'pendaftar' => $pendaftar->fresh()->load('product.biayaKategoris'),
        ]);
    }

    /**
     * Bayar semua tahapan sekaligus — distribusi otomatis ke kategori berikutnya
     */
    public function bayarAll(Request $request, $id)
    {
        $request->validate([
            'jumlah' => 'required|numeric|min:1',
            'bukti_pembayaran' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ]);

        $pendaftar = Pendaftar::with('batch', 'product.biayaKategoris')->findOrFail($id);
        $filePath = $request->file('bukti_pembayaran')->store('bukti_pembayaran', 'public');

        // Ambil semua kategori biaya, urutkan
        $kategoris = BiayaKategori::orderBy('urutan')->get();

        // Ambil biaya per kategori dari product pivot
        $pivotHarga = collect();
        if ($pendaftar->product && $pendaftar->product->relationLoaded('biayaKategoris')) {
            $pivotHarga = $pendaftar->product->biayaKategoris->keyBy('id')->map(fn($k) => (int) $k->pivot->harga);
        }

        // Ambil sudah dibayar per kategori
        $existingItems = PembayaranItem::where('pendaftar_id', $pendaftar->id)
            ->get()
            ->keyBy('kategori_id');

        $sisa = (int) $request->jumlah;
        $createdPayments = [];
        $detailPerKategori = [];

        foreach ($kategoris as $k) {
            if ($sisa <= 0) break;

            $biaya = $pivotHarga->get($k->id, 0);
            if ($biaya <= 0) continue;

            $sudahBayar = $existingItems->has($k->id) ? (int) $existingItems->get($k->id)->jumlah : 0;
            $kurang = $biaya - $sudahBayar;

            if ($kurang <= 0) continue; // sudah lunas

            $bayar = min($sisa, $kurang);
            $sisa -= $bayar;

            // Simpan Pembayaran (status pending, belum update PembayaranItem)
            $pembayaran = Pembayaran::create([
                'pendaftar_id' => $pendaftar->id,
                'jumlah' => $bayar,
                'kategori_id' => $k->id,
                'bukti_pembayaran' => $filePath,
                'status' => 'pending',
            ]);
            $createdPayments[] = $pembayaran;

            $detailPerKategori[] = [
                'kategori' => $k->nama,
                'biaya' => $biaya,
                'dibayar_sebelumnya' => $sudahBayar,
                'dibayar_sekarang' => $bayar,
                'total_dibayar' => $sudahBayar + $bayar,
                'lunas' => ($sudahBayar + $bayar) >= $biaya,
            ];
        }

        // Update pendaftar
        $pendaftar->increment('nominal', $request->jumlah - $sisa); // jumlah aktual yang terserap
        $pendaftar->status_pembayaran = 'processing';
        $pendaftar->save();

        // Kirim notifikasi WA ke admin
        try {
            $waService = new \App\Services\WhatsAppService();
            $waService->sendPaymentNotificationToAdmin(
                $pendaftar->fresh()->load('batch'),
                $request->jumlah - $sisa,
                'Pembayaran Multi Tahap',
                $filePath
            );
        } catch (\Exception $e) {
            \Log::error('Gagal kirim notifikasi WA bayarAll: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Pembayaran berhasil didistribusikan ke ' . count($detailPerKategori) . ' kategori',
            'detail' => $detailPerKategori,
            'sisa_kembali' => $sisa,
            'pendaftar' => $pendaftar->fresh()->load('product.biayaKategoris'),
        ]);
    }

    public function bayarManual(Request $request, $id)
    {
        $request->validate([
            'jumlah' => 'required|numeric|min:1',
            'kategori_id' => 'required|exists:biaya_kategoris,id',
        ]);

        $pendaftar = Pendaftar::with('product.biayaKategoris', 'user', 'batch')->findOrFail($id);

        $kategori = BiayaKategori::find($request->kategori_id);

        $pendaftar->increment('nominal', $request->jumlah);

        $totalBiaya = 0;
        if ($pendaftar->product && $pendaftar->product->relationLoaded('biayaKategoris')) {
            $totalBiaya = $pendaftar->product->biayaKategoris->sum(fn($k) => (int) $k->pivot->harga);
        }
        $totalBiaya = $totalBiaya ?: ($pendaftar->product?->harga ?? 0);
        $tagihan = $totalBiaya - ($pendaftar->diskon ?? 0);
        $totalDibayar = $pendaftar->fresh()->nominal ?? 0;

        $pendaftar->status_pembayaran = $totalDibayar >= $tagihan ? 'verified' : 'processing';
        $pendaftar->save();

        Pembayaran::create([
            'pendaftar_id' => $pendaftar->id,
            'jumlah' => $request->jumlah,
            'kategori_id' => $request->kategori_id,
            'bukti_pembayaran' => 'manual',
            'status' => 'verified',
        ]);

        // Update PembayaranItem — SUM total verified per kategori
        $totalPerKategori = Pembayaran::where('pendaftar_id', $pendaftar->id)
            ->where('status', 'verified')
            ->where('kategori_id', $request->kategori_id)
            ->sum('jumlah');

        PembayaranItem::updateOrCreate(
            [
                'pendaftar_id' => $pendaftar->id,
                'kategori_id' => $request->kategori_id,
            ],
            ['jumlah' => $totalPerKategori]
        );

        $this->cekDanCatatKomisiAffiliate($pendaftar->fresh());

        // Kirim notifikasi WA ke kandidat (manual = langsung verified)
        try {
            $waService = new \App\Services\WhatsAppService();
            $freshPendaftar = $pendaftar->fresh()->load(['user', 'product.biayaKategoris']);
            $kategoriNama = $kategori?->nama ?? 'Pembayaran';

            if ($totalDibayar >= $tagihan && $tagihan > 0) {
                $waService->sendFullPaymentNotification($freshPendaftar);
            } else {
                $waService->sendPartialPaymentNotification($freshPendaftar, $kategoriNama, $request->jumlah);
            }
        } catch (\Exception $e) {
            \Log::error('Gagal kirim notifikasi WA bayar manual: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Pembayaran manual berhasil dicatat',
            'pendaftar' => $pendaftar->fresh()->load('product.biayaKategoris'),
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

    public function invoice($id)
    {
        $pendaftar = Pendaftar::with(['product', 'coupon', 'user'])->findOrFail($id);

        $riwayat = Pembayaran::where('pendaftar_id', $pendaftar->id)
            ->orderBy('created_at', 'asc')
            ->get();

        $hargaProduk = (float) ($pendaftar->product?->harga ?? 0);
        $totalDibayar = (float) $pendaftar->nominal;
        $diskon = (float) ($pendaftar->diskon ?? 0);
        $totalTagihan = $hargaProduk - $diskon;
        $sisa = max(0, $totalTagihan - $totalDibayar);

        $noInvoice = 'INV/' . str_pad($pendaftar->id, 5, '0', STR_PAD_LEFT) . '/' . $pendaftar->created_at->format('Ym');

        return response()->json([
            'no_invoice' => $noInvoice,
            'pendaftar' => [
                'id' => $pendaftar->id,
                'nama' => $pendaftar->nama,
                'email' => $pendaftar->email,
                'telepon' => $pendaftar->telepon,
                'alamat' => $pendaftar->alamat,
                'created_at' => $pendaftar->created_at,
                'status_pendaftaran' => $pendaftar->status_pendaftaran,
                'status_pembayaran' => $pendaftar->status_pembayaran,
            ],
            'product' => $pendaftar->product ? [
                'id' => $pendaftar->product->id,
                'nama' => $pendaftar->product->nama,
                'harga' => $hargaProduk,
            ] : null,
            'coupon' => $pendaftar->coupon ? [
                'kode' => $pendaftar->coupon->kode,
                'diskon' => $diskon,
            ] : null,
            'keuangan' => [
                'harga_produk' => $hargaProduk,
                'diskon' => $diskon,
                'total_tagihan' => $totalTagihan,
                'total_dibayar' => $totalDibayar,
                'sisa' => $sisa,
            ],
            'riwayat_pembayaran' => $riwayat->map(function ($r) {
                return [
                    'id' => $r->id,
                    'jumlah' => (float) $r->jumlah,
                    'status' => $r->status,
                    'created_at' => $r->created_at,
                    'bukti_pembayaran' => $r->bukti_pembayaran,
                ];
            }),
        ]);
    }

    public function kandidat(Request $request)
    {
        $query = Pendaftar::with(['product', 'batch', 'user', 'siswa']);

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

        $mapKandidat = function ($p) {
            $siswa = $p->siswa;
            $user = $p->user;
            return [
                'id' => $p->id,
                'nama' => $p->nama,
                'email' => $p->email,
                'telepon' => $p->telepon,
                'nik' => $siswa?->nik ?? $user?->nik ?? '-',
                'no_registrasi' => $p->no_registrasi ?? $siswa?->no_registrasi ?? '-',
                'batch_id' => $p->batch_id,
                'batch_nama' => $p->batch?->nama_batch ?? '-',
                'real_batch' => $siswa?->real_batch ?? '-',
                'jenis_kelamin' => $siswa?->jenis_kelamin ?? '-',
                'tempat_lahir' => $siswa?->tempat_lahir ?? '-',
                'tanggal_lahir' => $siswa?->tanggal_lahir ? \Carbon\Carbon::parse($siswa->tanggal_lahir)->format('d M Y') : '-',
                'alamat' => $siswa?->alamat ?? $p->alamat ?? '-',
                'desa' => $siswa?->desa ?? '-',
                'kecamatan' => $siswa?->kecamatan ?? '-',
                'kabupaten' => $siswa?->kabupaten ?? '-',
                'provinsi' => $siswa?->provinsi ?? '-',
                'pendidikan_terakhir' => $siswa?->pendidikan_terakhir ?? $user?->pendidikan_terakhir ?? '-',
                'tahun_lulus' => $siswa?->tahun_lulus ?? '-',
                'tinggi_badan' => $siswa?->tinggi_badan ?? '-',
                'berat_badan' => $siswa?->berat_badan ?? '-',
                'goldar' => $siswa?->goldar ?? '-',
                'ukuran_baju' => $siswa?->ukuran_baju ?? '-',
                'status_pernikahan' => $siswa?->status_pernikahan ?? '-',
                'no_hp' => $siswa?->no_hp ?? $p->telepon ?? '-',
                'nama_ortu' => $siswa?->nama_ortu ?? '-',
                'no_hp_ortu' => $siswa?->no_hp_ortu ?? '-',
                'status_pendaftaran' => $p->status_pendaftaran,
                'status' => $p->status_pendaftaran === 'pending' ? 'Pending'
                    : ($p->status_pendaftaran === 'disetujui' ? 'Disetujui'
                    : ($p->status_pendaftaran === 'ditolak' ? 'Ditolak' : $p->status_pendaftaran)),
                'tanggalDaftar' => $p->created_at->format('d F Y'),
                'user_id' => $p->user_id,
                'keterangan' => $siswa?->keterangan ?? '-',
                'posisi' => $p->product?->nama ?? '-',
            ];
        };

        foreach ($grouped as $batchId => $items) {
            $batch = $items->first()->batch;
            $batches[] = [
                'id' => $batchId,
                'nama' => $batch?->nama_batch ?? 'Batch #' . $batchId,
                'jumlahKandidat' => $items->count(),
                'kandidat' => $items->map($mapKandidat),
            ];
        }

        if ($ungrouped) {
            $batches[] = [
                'id' => 0,
                'nama' => 'Tanpa Batch',
                'jumlahKandidat' => $ungrouped->count(),
                'kandidat' => $ungrouped->map($mapKandidat),
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

    public function rekapPerBatch()
    {
        $batches = \App\Models\Batch::aktif()->orderBy('nama_batch')->get();
        $kategoris = BiayaKategori::orderBy('urutan')->get();

        $result = [];

        foreach ($batches as $batch) {
            $pendaftar = Pendaftar::with(['product'])
                ->where('batch_id', $batch->id)
                ->orderBy('nama')
                ->get();

            if ($pendaftar->isEmpty()) continue;

            $biayaBatch = BatchBiaya::where('batch_id', $batch->id)
                ->get()
                ->keyBy('kategori_id');

            $pembayaranBatch = PembayaranItem::whereIn('pendaftar_id', $pendaftar->pluck('id'))
                ->get()
                ->groupBy('pendaftar_id');

            $items = $pendaftar->map(function ($p) use ($kategoris, $biayaBatch, $pembayaranBatch) {
                $pembayaranItems = $pembayaranBatch->get($p->id, collect())->keyBy('kategori_id');

                $detail = $kategoris->map(function ($k) use ($biayaBatch, $pembayaranItems) {
                    $bb = $biayaBatch->get($k->id);
                    $pi = $pembayaranItems->get($k->id);
                    $biaya = $bb ? (int) $bb->biaya : 0;
                    $dibayar = $pi ? (int) $pi->jumlah : 0;
                    return [
                        'kategori_id' => $k->id,
                        'kode' => $k->kode,
                        'nama' => $k->nama,
                        'biaya' => $biaya,
                        'dibayar' => $dibayar,
                        'sisa' => max(0, $biaya - $dibayar),
                    ];
                });

                $totalBiaya = $detail->sum('biaya');
                $totalDibayar = $detail->sum('dibayar');

                return [
                    'id' => $p->id,
                    'nama' => $p->nama,
                    'email' => $p->email,
                    'program' => $p->product?->nama ?? '-',
                    'created_at' => $p->created_at->toDateString(),
                    'total_biaya' => $totalBiaya,
                    'total_dibayar' => $totalDibayar,
                    'total_sisa' => max(0, $totalBiaya - $totalDibayar),
                    'status_pembayaran' => $p->status_pembayaran,
                    'status_pendaftaran' => $p->status_pendaftaran,
                    'detail' => $detail,
                ];
            });

            $grandBiaya = $items->sum('total_biaya');
            $grandDibayar = $items->sum('total_dibayar');

            $result[] = [
                'batch_id' => $batch->id,
                'batch' => $batch->nama_batch,
                'kuota' => $batch->kuota,
                'siswas_count' => $pendaftar->count(),
                'total_biaya' => $grandBiaya,
                'total_dibayar' => $grandDibayar,
                'total_sisa' => $grandBiaya - $grandDibayar,
                'items' => $items,
            ];
        }

        $grandBiaya = collect($result)->sum('total_biaya');
        $grandDibayar = collect($result)->sum('total_dibayar');

        return response()->json([
            'data' => $result,
            'grand_total_biaya' => $grandBiaya,
            'grand_total_dibayar' => $grandDibayar,
            'grand_total_sisa' => $grandBiaya - $grandDibayar,
            'kategoris' => $kategoris->map(fn($k) => ['id' => $k->id, 'kode' => $k->kode, 'nama' => $k->nama]),
        ]);
    }

    public function storeKandidat(Request $request)
    {
        $messages = [
            'nama.required' => 'Nama lengkap wajib diisi.',
            'email.required' => 'Email wajib diisi.',
            'email.email' => 'Format email tidak valid.',
            'email.unique' => 'Email sudah digunakan oleh akun lain.',
            'nik.string' => 'NIK harus berupa teks.',
            'telepon.max' => 'No. telepon maksimal 20 karakter.',
            'batch_id.exists' => 'Batch yang dipilih tidak valid.',
            'jenis_kelamin.in' => 'Jenis kelamin harus L atau P.',
            'tanggal_lahir.date' => 'Format tanggal lahir tidak valid.',
            'pendidikan_terakhir.string' => 'Pendidikan terakhir harus berupa teks.',
            'tinggi_badan.numeric' => 'Tinggi badan harus berupa angka.',
            'berat_badan.numeric' => 'Berat badan harus berupa angka.',
            'goldar.in' => 'Golongan darah harus A, B, AB, atau O.',
            'ukuran_baju.in' => 'Ukuran baju tidak valid.',
            'status_pernikahan.in' => 'Status nikah tidak valid.',
        ];

        $data = $request->validate([
            'nik' => 'nullable|string|max:50',
            'nama' => 'required|string|max:255',
            'email' => 'required|email|unique:pendaftar,email|unique:users,email',
            'telepon' => 'nullable|string|max:20',
            'batch_id' => 'nullable|integer|exists:batches,id',
            'real_batch' => 'nullable|string|max:255',
            'jenis_kelamin' => 'nullable|in:L,P',
            'tempat_lahir' => 'nullable|string|max:255',
            'tanggal_lahir' => 'nullable|date',
            'alamat' => 'nullable|string',
            'desa' => 'nullable|string|max:255',
            'kecamatan' => 'nullable|string|max:255',
            'kabupaten' => 'nullable|string|max:255',
            'provinsi' => 'nullable|string|max:255',
            'pendidikan_terakhir' => 'nullable|string|max:100',
            'tahun_lulus' => 'nullable|string|max:4',
            'tinggi_badan' => 'nullable|numeric',
            'berat_badan' => 'nullable|numeric',
            'goldar' => 'nullable|in:A,B,AB,O',
            'ukuran_baju' => 'nullable|in:XS,S,M,L,XL,XXL',
            'status_pernikahan' => 'nullable|in:Belum Nikah,Nikah,Cerai',
            'no_hp' => 'nullable|string|max:20',
            'nama_ortu' => 'nullable|string|max:255',
            'no_hp_ortu' => 'nullable|string|max:20',
            'keterangan' => 'nullable|string|max:500',
        ], $messages);

        // Generate No. Registrasi
        $today = now()->format('Ymd');
        $lastReg = Pendaftar::where('no_registrasi', 'like', "REG/{$today}/%")
            ->orderByDesc('no_registrasi')
            ->value('no_registrasi');
        if ($lastReg) {
            $lastNum = (int) substr($lastReg, -4);
            $nextNum = str_pad($lastNum + 1, 4, '0', STR_PAD_LEFT);
        } else {
            $nextNum = '0001';
        }
        $noReg = "REG/{$today}/{$nextNum}";

        // Generate random password
        $password = strtoupper(bin2hex(random_bytes(4)));

        try {
            // Create user — nik wajib diisi karena kolom NOT NULL di DB
            $user = User::create([
                'name' => $data['nama'],
                'email' => $data['email'],
                'password' => Hash::make($password),
                'nik' => $data['nik'] ?? $data['email'],
                'role' => 'KANDIDAT',
                'status' => 'AKTIF',
                'no_hp' => $data['no_hp'] ?? $data['telepon'] ?? null,
                'pendidikan_terakhir' => $data['pendidikan_terakhir'] ?? null,
                'tempat_lahir' => $data['tempat_lahir'] ?? null,
                'tanggal_lahir' => $data['tanggal_lahir'] ?? null,
                'jenis_kelamin' => $data['jenis_kelamin'] ?? null,
                'alamat' => $data['alamat'] ?? null,
            ]);

            // Create pendaftar
            $pendaftar = Pendaftar::create([
                'nama' => $data['nama'],
                'email' => $data['email'],
                'password' => Hash::make($password),
                'telepon' => $data['telepon'] ?? null,
                'alamat' => $data['alamat'] ?? null,
                'batch_id' => $data['batch_id'] ?? null,
                'no_registrasi' => $noReg,
                'status_pendaftaran' => 'disetujui',
                'status_pembayaran' => 'verified',
                'nominal' => 0,
                'user_id' => $user->id,
            ]);

            // Create siswa
            Siswa::create([
                'user_id' => $user->id,
                'batch_id' => $data['batch_id'] ?? null,
                'nama' => $data['nama'],
                'nik' => $data['nik'] ?? null,
                'no_registrasi' => $noReg,
                'jenis_kelamin' => $data['jenis_kelamin'] ?? null,
                'tempat_lahir' => $data['tempat_lahir'] ?? null,
                'tanggal_lahir' => $data['tanggal_lahir'] ?? null,
                'alamat' => $data['alamat'] ?? null,
                'desa' => $data['desa'] ?? null,
                'kecamatan' => $data['kecamatan'] ?? null,
                'kabupaten' => $data['kabupaten'] ?? null,
                'provinsi' => $data['provinsi'] ?? null,
                'pendidikan_terakhir' => $data['pendidikan_terakhir'] ?? null,
                'tahun_lulus' => $data['tahun_lulus'] ?? null,
                'tinggi_badan' => $data['tinggi_badan'] ?? null,
                'berat_badan' => $data['berat_badan'] ?? null,
                'goldar' => $data['goldar'] ?? null,
                'ukuran_baju' => $data['ukuran_baju'] ?? null,
                'status_pernikahan' => $data['status_pernikahan'] ?? null,
                'no_hp' => $data['no_hp'] ?? $data['telepon'] ?? null,
                'nama_ortu' => $data['nama_ortu'] ?? null,
                'no_hp_ortu' => $data['no_hp_ortu'] ?? null,
                'real_batch' => $data['real_batch'] ?? null,
                'keterangan' => $data['keterangan'] ?? null,
                'status' => 'AKTIF',
            ]);

            return response()->json([
                'message' => 'Kandidat berhasil ditambahkan',
                'no_registrasi' => $noReg,
                'password' => $password,
            ], 201);
        } catch (\Illuminate\Database\QueryException $e) {
            \Log::error('storeKandidat QueryException: ' . $e->getMessage());
            $errorMap = [
                "Duplicate entry" => 'Data sudah ada di database (kemungkinan email atau NIK sudah terdaftar).',
                "doesn't have a default value" => 'Ada kolom wajib yang belum diisi. Silakan lengkapi semua data.',
                "Cannot add or update a child row" => 'Data referensi tidak valid (batch atau data lain tidak ditemukan).',
                "Data too long" => 'Ada data yang melebihi batas maksimum karakter.',
                "Integrity constraint" => 'Ada data yang tidak konsisten. Silakan periksa kembali.',
                "Column" => 'Ada kolom data yang bermasalah.',
            ];
            $msg = $e->getMessage();
            $userMsg = 'Terjadi kesalahan saat menyimpan data.';
            foreach ($errorMap as $en => $id) {
                if (str_contains($msg, $en)) {
                    $userMsg = $id;
                    break;
                }
            }
            return response()->json(['message' => $userMsg, 'debug' => config('app.debug') ? $msg : null], 422);
        } catch (\Exception $e) {
            \Log::error('storeKandidat Exception: ' . $e->getMessage());
            return response()->json(['message' => 'Terjadi kesalahan saat menyimpan data: ' . $e->getMessage()], 500);
        }
    }

    public function updateKandidat(Request $request, $id)
    {
        $messages = [
            'nama.string' => 'Nama harus berupa teks.',
            'email.email' => 'Format email tidak valid.',
            'nik.string' => 'NIK harus berupa teks.',
            'batch_id.exists' => 'Batch yang dipilih tidak valid.',
            'jenis_kelamin.in' => 'Jenis kelamin harus L atau P.',
            'tanggal_lahir.date' => 'Format tanggal lahir tidak valid.',
            'tinggi_badan.numeric' => 'Tinggi badan harus berupa angka.',
            'berat_badan.numeric' => 'Berat badan harus berupa angka.',
            'goldar.in' => 'Golongan darah harus A, B, AB, atau O.',
            'ukuran_baju.in' => 'Ukuran baju tidak valid.',
            'status_pernikahan.in' => 'Status nikah tidak valid.',
        ];

        $pendaftar = Pendaftar::with(['siswa'])->findOrFail($id);

        $data = $request->validate([
            'nik' => 'nullable|string|max:50',
            'nama' => 'nullable|string|max:255',
            'email' => 'nullable|email',
            'batch_id' => 'nullable|exists:batches,id',
            'real_batch' => 'nullable|string|max:255',
            'jenis_kelamin' => 'nullable|in:L,P',
            'tempat_lahir' => 'nullable|string|max:255',
            'tanggal_lahir' => 'nullable|date',
            'alamat' => 'nullable|string',
            'desa' => 'nullable|string|max:255',
            'kecamatan' => 'nullable|string|max:255',
            'kabupaten' => 'nullable|string|max:255',
            'provinsi' => 'nullable|string|max:255',
            'pendidikan_terakhir' => 'nullable|string|max:100',
            'tahun_lulus' => 'nullable|string|max:4',
            'tinggi_badan' => 'nullable|numeric',
            'berat_badan' => 'nullable|numeric',
            'goldar' => 'nullable|in:A,B,AB,O',
            'ukuran_baju' => 'nullable|in:XS,S,M,L,XL,XXL',
            'status_pernikahan' => 'nullable|in:Belum Nikah,Nikah,Cerai',
            'no_hp' => 'nullable|string|max:20',
            'nama_ortu' => 'nullable|string|max:255',
            'no_hp_ortu' => 'nullable|string|max:20',
            'keterangan' => 'nullable|string|max:500',
        ], $messages);

        // Update pendaftar fields
        $pendaftarFields = ['nama', 'email', 'batch_id'];
        foreach ($pendaftarFields as $f) {
            if (array_key_exists($f, $data)) $pendaftar->$f = $data[$f];
        }
        $pendaftar->save();

        // Update user if email/name changed
        if ($pendaftar->user_id) {
            $user = User::find($pendaftar->user_id);
            if ($user) {
                if (isset($data['nama'])) $user->name = $data['nama'];
                if (isset($data['email'])) $user->email = $data['email'];
                $user->save();
            }
        }

        // Update siswa fields
        $siswa = $pendaftar->siswa;
        if ($siswa) {
            $siswaFields = [
                'nik', 'real_batch', 'jenis_kelamin', 'tempat_lahir', 'tanggal_lahir',
                'alamat', 'desa', 'kecamatan', 'kabupaten', 'provinsi',
                'pendidikan_terakhir', 'tahun_lulus', 'tinggi_badan', 'berat_badan',
                'goldar', 'ukuran_baju', 'status_pernikahan', 'no_hp',
                'nama_ortu', 'no_hp_ortu', 'keterangan', 'batch_id',
            ];
            foreach ($siswaFields as $f) {
                if (array_key_exists($f, $data)) $siswa->$f = $data[$f];
            }
            if (isset($data['nama'])) $siswa->nama = $data['nama'];
            $siswa->save();
        }

        return response()->json(['message' => 'Data kandidat berhasil diperbarui']);
    }

    private function cekDanCatatKomisiAffiliate($pendaftar)
    {
        if (!$pendaftar->affiliate_link_id) return;

        $product = $pendaftar->product;
        if (!$product) return;

        $product->load(['biayaKategoris', 'komisiTiers']);
        if ($product->biayaKategoris->isEmpty()) return;

        $batchCount = \App\Models\Pendaftar::where('affiliate_link_id', $pendaftar->affiliate_link_id)
            ->where('batch_id', $pendaftar->batch_id)
            ->count();

        foreach ($product->biayaKategoris as $kategori) {
            $hargaKategori = (float) $kategori->pivot->harga;
            if ($hargaKategori <= 0) continue;

            $existing = KomisiAffiliate::where('pendaftar_id', $pendaftar->id)
                ->where('kategori_id', $kategori->id)
                ->first();
            if ($existing) continue;

            $dibayar = PembayaranItem::where('pendaftar_id', $pendaftar->id)
                ->where('kategori_id', $kategori->id)
                ->sum('jumlah');

            if ($dibayar >= $hargaKategori) {
                $komisiPerKategori = 0;

                $tier = $product->komisiTiers
                    ->where('kategori_id', $kategori->id)
                    ->filter(fn($t) => $batchCount >= $t->min_orang && ($t->max_orang === null || $batchCount <= $t->max_orang))
                    ->sortBy('min_orang')
                    ->last();

                if ($tier) {
                    $komisiPerKategori = (float) $tier->komisi;
                } else {
                    $komisiPerKategori = (float) ($kategori->pivot->komisi ?? 0);
                }

                if ($komisiPerKategori <= 0) continue;

                KomisiAffiliate::create([
                    'affiliate_link_id' => $pendaftar->affiliate_link_id,
                    'pendaftar_id' => $pendaftar->id,
                    'kategori_id' => $kategori->id,
                    'jumlah' => $komisiPerKategori,
                    'status' => 'pending',
                ]);
            }
        }
    }
}
