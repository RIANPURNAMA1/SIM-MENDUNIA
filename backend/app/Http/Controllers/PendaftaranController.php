<?php

namespace App\Http\Controllers;

use App\Models\Pendaftar;
use App\Models\Siswa;
use App\Models\Product;
use App\Models\AffiliateLink;
use App\Models\KomisiAffiliate;
use App\Models\Coupon;
use App\Models\Batch;

use App\Models\BatchKategoriDeadline;
use App\Models\BiayaKategori;
use App\Models\Pembayaran;
use App\Models\PembayaranItem;
use App\Models\PaymentSetting;
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
            'alamat' => 'nullable|string',
            'provinsi' => 'nullable|string|max:255',
            'kabupaten' => 'nullable|string|max:255',
            'kecamatan' => 'nullable|string|max:255',
            'desa' => 'nullable|string|max:255',
            'selected_kategori_items' => 'nullable|string',
            'kode_unik' => 'nullable|integer|min:0|max:999',
        ]);

        $product = Product::findOrFail($data['product_id']);
        $nominal = $product->harga;
        $selectedKategoriItems = !empty($data['selected_kategori_items']) ? json_decode($data['selected_kategori_items'], true) : [];
        if (!empty($selectedKategoriItems) && is_array($selectedKategoriItems)) {
            $first = $selectedKategoriItems[0] ?? null;
            $kategoriItems = $product->kategori_items ?? [];
            foreach ($kategoriItems as $item) {
                if (is_string($first) && strtolower($item['name'] ?? '') === strtolower($first)) {
                    $nominal = $item['harga'] ?? $nominal;
                    break;
                }
                if (is_array($first) && strtolower($item['name'] ?? '') === strtolower($first['name'] ?? '')) {
                    $nominal = $item['harga'] ?? $first['harga'] ?? $nominal;
                    break;
                }
            }
        }

        $kupon = $this->applyCoupon($data['kode_kupon'] ?? null, $data['product_id'], $nominal);

        $user = User::create([
            'name' => $data['nama'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role' => 'KANDIDAT',
            'status' => 'AKTIF',
        ]);

        $pendaftar = Pendaftar::create([
            'product_id' => $data['product_id'],
            'batch_id' => $data['batch_id'] ?? $product->batch_id ?? null,
            'coupon_id' => $kupon['coupon_id'],
            'nama' => $data['nama'],
            'email' => $data['email'],
            'password' => $user->password,
            'telepon' => $data['telepon'],
            'alamat' => $data['alamat'] ?? null,
            'provinsi' => $data['provinsi'] ?? null,
            'kabupaten' => $data['kabupaten'] ?? null,
            'kecamatan' => $data['kecamatan'] ?? null,
            'desa' => $data['desa'] ?? null,
            'nominal' => $nominal,
            'diskon' => $kupon['diskon'],
            'status_pendaftaran' => 'pending',
            'status_pembayaran' => 'unpaid',
            'user_id' => $user->id,
        ]);

        $noReg = $pendaftar->no_registrasi ?? ('REG/' . now()->format('Ymd') . '/' . str_pad($pendaftar->id, 4, '0', STR_PAD_LEFT));

        // Generate kode_unik and create PembayaranItem
        $firstParentName = null;
        if (!empty($selectedKategoriItems) && is_array($selectedKategoriItems)) {
            $firstParentName = trim((string) ($selectedKategoriItems[0] ?? ''));
        }
        if (!$firstParentName && is_array($product->kategori_items)) {
            foreach ($product->kategori_items as $item) {
                $name = trim($item['name'] ?? '');
                if ($name !== '' && ($item['harga'] ?? 0) > 0) {
                    $firstParentName = $name;
                    break;
                }
            }
        }

        $kategori = null;
        if ($firstParentName) {
            $kategori = \App\Models\BiayaKategori::whereRaw('LOWER(nama) = ?', [strtolower($firstParentName)])
                ->orWhereRaw('LOWER(kode) = ?', [strtolower($firstParentName)])
                ->first();
        }
        if (!$kategori) {
            $kategori = \App\Models\BiayaKategori::orderBy('urutan')->first();
        }

        if ($kategori && $nominal > 0) {
            $kodeUnik = isset($data['kode_unik']) && $data['kode_unik'] !== '' ? (int) $data['kode_unik'] : \App\Models\PaymentSetting::generateUniqueCode();
            $totalTransfer = \App\Models\PaymentSetting::calculateTotalTransfer($nominal, $kodeUnik);
            $paymentCode = 'PAY/' . str_pad($pendaftar->id, 5, '0', STR_PAD_LEFT) . '/' . now()->format('Ym');

            \App\Models\PembayaranItem::create([
                'pendaftar_id' => $pendaftar->id,
                'kategori_id' => $kategori->id,
                'jumlah' => 0,
                'kode_unik' => $kodeUnik,
                'total_transfer' => $totalTransfer,
                'payment_code' => $paymentCode,
            ]);
        }

        // Kirim WA notifikasi pendaftaran sukses
        try {
            $waService = new \App\Services\WhatsAppService();
            $waService->sendRegistrationSuccessNotification($pendaftar->fresh()->load('product'));
        } catch (\Exception $e) {
            \Log::error('Gagal kirim WA notifikasi daftarLangsung: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Pendaftaran berhasil',
            'id' => $pendaftar->id,
            'no_registrasi' => $noReg,
            'invoice_url' => '/pendaftar/' . $pendaftar->id . '/invoice',
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
            'alamat' => 'nullable|string',
            'provinsi' => 'nullable|string|max:255',
            'kabupaten' => 'nullable|string|max:255',
            'kecamatan' => 'nullable|string|max:255',
            'desa' => 'nullable|string|max:255',
            'kode_unik' => 'nullable|integer|min:0|max:999',
        ]);

        $link = AffiliateLink::with('product')->where('kode', $data['kode_link'])->firstOrFail();
        $nominal = $link->product->harga ?? 0;

        // Samakan nominal awal pendaftaran affiliate dengan pendaftaran
        // langsung: tagihan pertama adalah kategori induk pertama (mis.
        // "Daftar"), bukan total harga seluruh program.
        if (is_array($link->product->kategori_items)) {
            foreach ($link->product->kategori_items as $item) {
                $hargaKategoriPertama = (float) ($item['harga'] ?? 0);
                if ($hargaKategoriPertama > 0) {
                    $nominal = $hargaKategoriPertama;
                    break;
                }
            }
        }

        $kupon = $this->applyCoupon($data['kode_kupon'] ?? null, $link->product_id, $nominal);

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
            // Batch affiliate selalu mengikuti batch yang telah ditetapkan
            // pada produk, bukan pilihan dari form pendaftar.
            'batch_id' => $link->product->batch_id,
            'coupon_id' => $kupon['coupon_id'],
            'nama' => $data['nama'],
            'email' => $data['email'],
            'password' => $user->password,
            'telepon' => $data['telepon'],
            'alamat' => $data['alamat'] ?? null,
            'provinsi' => $data['provinsi'] ?? null,
            'kabupaten' => $data['kabupaten'] ?? null,
            'kecamatan' => $data['kecamatan'] ?? null,
            'desa' => $data['desa'] ?? null,
            'nominal' => $nominal,
            'diskon' => $kupon['diskon'],
            'status_pendaftaran' => 'pending',
            'status_pembayaran' => 'unpaid',
            'user_id' => $user->id,
        ]);

        $link->increment('pendaftar_count');

        $noReg = $pendaftar->no_registrasi ?? ('REG/' . now()->format('Ymd') . '/' . str_pad($pendaftar->id, 4, '0', STR_PAD_LEFT));

        // Generate kode_unik and create PembayaranItem — match kategori by product's kategori_items
        $firstParentName = null;
        if (is_array($link->product->kategori_items)) {
            foreach ($link->product->kategori_items as $item) {
                $name = trim($item['name'] ?? '');
                if ($name !== '' && ($item['harga'] ?? 0) > 0) {
                    $firstParentName = $name;
                    break;
                }
            }
        }

        $kategori = null;
        if ($firstParentName) {
            $kategori = \App\Models\BiayaKategori::whereRaw('LOWER(nama) = ?', [strtolower($firstParentName)])
                ->orWhereRaw('LOWER(kode) = ?', [strtolower($firstParentName)])
                ->first();
        }
        if (!$kategori) {
            $kategori = \App\Models\BiayaKategori::orderBy('urutan')->first();
        }
        if ($kategori && $nominal > 0) {
            $kodeUnik = isset($data['kode_unik']) && $data['kode_unik'] !== '' ? (int) $data['kode_unik'] : \App\Models\PaymentSetting::generateUniqueCode();
            $totalTransfer = \App\Models\PaymentSetting::calculateTotalTransfer($nominal, $kodeUnik);
            $paymentCode = 'PAY/' . str_pad($pendaftar->id, 5, '0', STR_PAD_LEFT) . '/' . now()->format('Ym');

            \App\Models\PembayaranItem::create([
                'pendaftar_id' => $pendaftar->id,
                'kategori_id' => $kategori->id,
                'jumlah' => 0,
                'kode_unik' => $kodeUnik,
                'total_transfer' => $totalTransfer,
                'payment_code' => $paymentCode,
            ]);
        }

        // Kirim WA notifikasi pendaftaran sukses
        try {
            $waService = new \App\Services\WhatsAppService();
            $waService->sendRegistrationSuccessNotification($pendaftar->fresh()->load('product'));
        } catch (\Exception $e) {
            \Log::error('Gagal kirim WA notifikasi daftar: ' . $e->getMessage());
        }

        Auth::login($user);

        return response()->json([
            'message' => 'Pendaftaran berhasil',
            'id' => $pendaftar->id,
            'no_registrasi' => $noReg,
            'invoice_url' => '/pendaftar/' . $pendaftar->id . '/invoice',
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
        $pendaftarIds = $data->pluck('id');
        $allPembayaran = PembayaranItem::whereIn('pendaftar_id', $pendaftarIds)
            ->get()
            ->groupBy('pendaftar_id');

        $allBayar = \App\Models\Pembayaran::whereIn('pendaftar_id', $pendaftarIds)
            ->where('status', 'verified')
            ->get()
            ->groupBy('pendaftar_id');

        $result = $data->map(function ($p) use ($allPembayaran, $allBayar) {
            $pembayaranItems = $allPembayaran->get($p->id, collect())->keyBy('kategori_id');
            $pembayaranList = $allBayar->get($p->id, collect());
            $product = $p->product;
            $pivotById = collect();
            if ($product && $product->relationLoaded('biayaKategoris')) {
                $pivotById = $product->biayaKategoris->keyBy('id');
            }

            // Build aggregated kategori items from product's kategori_items JSON (same as bayarInfo)
            $aggregated = collect();
            if ($product && is_array($product->kategori_items)) {
                $walkAgg = function ($items, $depth) use (&$walkAgg, $pivotById, &$aggregated) {
                    foreach ($items as $item) {
                        $name = strtolower(trim($item['name'] ?? ''));
                        if ($name === '') continue;
                        $kategori = $pivotById->first(fn($k) => strtolower($k->nama) === $name || strtolower($k->kode) === $name);
                        if (!$kategori) continue;

                        $children = $item['children'] ?? [];
                        $childHarga = 0;
                        foreach ($children as $c) {
                            $cn = strtolower(trim($c['name'] ?? ''));
                            $ck = $pivotById->first(fn($k) => strtolower($k->nama) === $cn || strtolower($k->kode) === $cn);
                            if ($ck) $childHarga += (float) ($ck->pivot->harga ?? 0);
                        }

                        if ($depth === 0) {
                            $aggregated->push([
                                'id' => $kategori->id,
                                'kode' => $kategori->kode,
                                'nama' => $kategori->nama,
                                'biaya' => (float) ($kategori->pivot->harga ?? 0) + $childHarga,
                            ]);
                        }

                        if (!empty($children)) {
                            $walkAgg($children, $depth + 1);
                        }
                    }
                };
                $walkAgg($product->kategori_items, 0);
            }

            // Add remaining kategoris not in JSON hierarchy
            $allKategoris = BiayaKategori::orderBy('urutan')->get();
            foreach ($allKategoris as $k) {
                if (!$aggregated->firstWhere('id', $k->id)) {
                    $aggregated->push([
                        'id' => $k->id,
                        'kode' => $k->kode,
                        'nama' => $k->nama,
                        'biaya' => (float) ($pivotById->get($k->id)?->pivot->harga ?? 0),
                    ]);
                }
            }

            $detail = $aggregated->map(function ($item) use ($pembayaranItems, $pembayaranList) {
                $pi = $pembayaranItems->get($item['id']);
                $dibayar = $pi ? (int) $pi->jumlah : 0;
                $pembayaran = $pembayaranList->firstWhere('kategori_id', $item['id']);
                return [
                    'kategori_id' => $item['id'],
                    'kode' => $item['kode'],
                    'nama' => $item['nama'],
                    'biaya' => $item['biaya'],
                    'dibayar' => $dibayar,
                    'kode_unik' => $pi ? ($pi->kode_unik ?? 0) : 0,
                    'total_transfer' => $pi ? ($pi->total_transfer ?? $item['biaya']) : 0,
                    'tanggal_bayar' => $pembayaran ? $pembayaran->created_at : null,
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
            'tanggal_persetujuan' => now(),
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
                        'email' => $pendaftar->email,
                        'nik' => $pendaftar->nik,
                        'alamat' => $pendaftar->alamat,
                        'provinsi' => $pendaftar->provinsi,
                        'kabupaten' => $pendaftar->kabupaten,
                        'kecamatan' => $pendaftar->kecamatan,
                        'desa' => $pendaftar->desa,
                        'tempat_lahir' => $pendaftar->tempat_lahir ?? $user->tempat_lahir,
                        'tanggal_lahir' => $pendaftar->tanggal_lahir ?? $user->tanggal_lahir,
                        'jenis_kelamin' => $pendaftar->jenis_kelamin ?? $user->jenis_kelamin,
                        'no_registrasi' => $noReg,
                        'status' => 'AKTIF',
                    ]
                );
            }
        }

        // Komisi affiliate dicatat saat Level 1 LUNAS (lihat cekDanCatatKomisiAffiliate)

        // Auto-create PembayaranItem and Pembayaran for first parent category if none exist
        $existingItems = PembayaranItem::where('pendaftar_id', $pendaftar->id)->count();
        if ($existingItems === 0 && $pendaftar->nominal > 0) {
            // Find the first parent kategori from product's kategori_items JSON
            $firstParentName = null;
            if (is_array($pendaftar->product->kategori_items)) {
                foreach ($pendaftar->product->kategori_items as $item) {
                    $harga = (int) ($item['harga'] ?? 0);
                    $name = trim($item['name'] ?? '');
                    if ($name !== '' && $harga > 0) {
                        $firstParentName = $name;
                        break;
                    }
                }
            }

            // Find the BiayaKategori matching by name (case-insensitive)
            $kategori = null;
            if ($firstParentName) {
                $kategori = BiayaKategori::whereRaw('LOWER(nama) = ?', [strtolower($firstParentName)])
                    ->orWhereRaw('LOWER(kode) = ?', [strtolower($firstParentName)])
                    ->first();
            }
            // Fallback: use first kategori by urutan
            if (!$kategori) {
                $kategori = BiayaKategori::orderBy('urutan')->first();
            }

            if ($kategori) {
                $kodeUnik = PaymentSetting::generateUniqueCode();
                $totalTransfer = PaymentSetting::calculateTotalTransfer($pendaftar->nominal, $kodeUnik);
                $paymentCode = 'PAY/' . str_pad($pendaftar->id, 5, '0', STR_PAD_LEFT) . '/' . now()->format('Ym');

                PembayaranItem::updateOrCreate(
                    [
                        'pendaftar_id' => $pendaftar->id,
                        'kategori_id' => $kategori->id,
                    ],
                    [
                        'jumlah' => $pendaftar->nominal,
                        'kode_unik' => $kodeUnik,
                        'total_transfer' => $totalTransfer,
                        'payment_code' => $paymentCode,
                    ]
                );
                Pembayaran::create([
                    'pendaftar_id' => $pendaftar->id,
                    'jumlah' => $pendaftar->nominal,
                    'kategori_id' => $kategori->id,
                    'status' => 'verified',
                    'bukti_pembayaran' => $pendaftar->bukti_pembayaran ?? 'auto',
                ]);
            }
        }

        // Ensure existing PembayaranItems have kode_unik and total_transfer set
        $itemsWithoutUnique = PembayaranItem::where('pendaftar_id', $pendaftar->id)
            ->where(function ($q) { $q->where('kode_unik', 0)->orWhereNull('kode_unik'); })
            ->get();
        foreach ($itemsWithoutUnique as $pi) {
            $ku = PaymentSetting::generateUniqueCode();
            $tt = PaymentSetting::calculateTotalTransfer((float) $pi->jumlah, $ku);
            $pc = $pi->payment_code ?? ('PAY/' . str_pad($pendaftar->id, 5, '0', STR_PAD_LEFT) . '/' . now()->format('Ym'));
            $pi->update(['kode_unik' => $ku, 'total_transfer' => $tt, 'payment_code' => $pc]);
        }

        // Update semua Pembayaran yang masih pending jadi verified
        Pembayaran::where('pendaftar_id', $pendaftar->id)
            ->where('status', 'pending')
            ->update(['status' => 'verified']);

        // Recalculate PembayaranItem dari semua verified Pembayaran
        $verifiedByKategori = Pembayaran::where('pendaftar_id', $pendaftar->id)
            ->where('status', 'verified')
            ->whereNotNull('kategori_id')
            ->selectRaw('kategori_id, SUM(jumlah) as total')
            ->groupBy('kategori_id')
            ->get();

        foreach ($verifiedByKategori as $vb) {
            PembayaranItem::updateOrCreate(
                ['pendaftar_id' => $pendaftar->id, 'kategori_id' => $vb->kategori_id],
                ['jumlah' => $vb->total]
            );
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
        $pendaftar = Pendaftar::with('user', 'product.biayaKategoris')->findOrFail($id);
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
            $katHarga = (int) ($pendaftar->product->biayaKategoris->firstWhere('id', $vb->kategori_id)?->pivot->harga ?? 0);
            $jumlah = $katHarga > 0 ? min((int) $vb->total, $katHarga) : (int) $vb->total;
            PembayaranItem::updateOrCreate(
                [
                    'pendaftar_id' => $pendaftar->id,
                    'kategori_id' => $vb->kategori_id,
                ],
                ['jumlah' => $jumlah]
            );
        }

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
            // Fallback: sum from kategori_items JSON (parent only)
            if ($totalBiaya === 0 && is_array($freshPendaftar->product->kategori_items)) {
                foreach ($freshPendaftar->product->kategori_items as $item) {
                    $totalBiaya += (int) ($item['harga'] ?? 0);
                }
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

    public function updateStatus(Request $request, $id)
    {
        $pendaftar = \App\Models\Pendaftar::findOrFail($id);

        $data = $request->validate([
            'status_pembayaran' => 'nullable|string|in:unpaid,pending,processing,verified,ditolak,refund',
            'status_pendaftaran' => 'nullable|string|in:pending,disetujui,ditolak',
        ]);

        if (isset($data['status_pembayaran'])) {
            $pendaftar->status_pembayaran = $data['status_pembayaran'];
        }
        if (isset($data['status_pendaftaran'])) {
            $pendaftar->status_pendaftaran = $data['status_pendaftaran'];
        }
        $pendaftar->save();

        if (isset($data['status_pendaftaran']) && $data['status_pendaftaran'] === 'disetujui') {
            if (!$pendaftar->no_registrasi) {
                $today = now()->format('Ymd');
                $lastReg = \App\Models\Pendaftar::where('no_registrasi', 'like', "REG/{$today}/%")
                    ->orderByDesc('no_registrasi')
                    ->value('no_registrasi');
                if ($lastReg) {
                    $lastNum = (int) substr($lastReg, -4);
                    $nextNum = str_pad($lastNum + 1, 4, '0', STR_PAD_LEFT);
                } else {
                    $nextNum = '0001';
                }
                $pendaftar->no_registrasi = "REG/{$today}/{$nextNum}";
            }
            if (!$pendaftar->tanggal_persetujuan) {
                $pendaftar->tanggal_persetujuan = now();
            }
            $pendaftar->save();

            if ($pendaftar->user_id) {
                $user = \App\Models\User::find($pendaftar->user_id);
                if ($user) {
                    \App\Models\Siswa::updateOrCreate(
                        ['user_id' => $user->id],
                        [
                            'nama' => $pendaftar->nama,
                            'batch_id' => $pendaftar->batch_id,
                            'no_hp' => $pendaftar->telepon,
                            'nik' => $pendaftar->nik,
                            'alamat' => $pendaftar->alamat,
                            'provinsi' => $pendaftar->provinsi,
                            'kabupaten' => $pendaftar->kabupaten,
                            'kecamatan' => $pendaftar->kecamatan,
                            'desa' => $pendaftar->desa,
                            'tempat_lahir' => $pendaftar->tempat_lahir ?? $user->tempat_lahir,
                            'tanggal_lahir' => $pendaftar->tanggal_lahir ?? $user->tanggal_lahir,
                            'jenis_kelamin' => $pendaftar->jenis_kelamin ?? $user->jenis_kelamin,
                            'no_registrasi' => $pendaftar->no_registrasi,
                            'status' => 'AKTIF',
                        ]
                    );
                }
            }
        }

        if (isset($data['status_pembayaran']) && $data['status_pembayaran'] === 'verified') {
            // Verify all pending/processing Pembayaran records
            \App\Models\Pembayaran::where('pendaftar_id', $pendaftar->id)
                ->whereIn('status', ['pending', 'processing'])
                ->update(['status' => 'verified']);

            // Recalculate PembayaranItem for each kategori based on actual verified payments, capped at biaya
            $product = $pendaftar->product;
            if ($product) {
                $product->load('biayaKategoris');
                $biayaKategoris = $product->biayaKategoris;
                foreach ($biayaKategoris as $kat) {
                    $totalVerified = \App\Models\Pembayaran::where('pendaftar_id', $pendaftar->id)
                        ->where('kategori_id', $kat->id)
                        ->where('status', 'verified')
                        ->sum('jumlah');

                    $harga = (int) $kat->pivot->harga;
                    if ($totalVerified > 0) {
                        $jumlah = $harga > 0 ? min((int) $totalVerified, $harga) : (int) $totalVerified;
                        $existingPi = \App\Models\PembayaranItem::where('pendaftar_id', $pendaftar->id)
                            ->where('kategori_id', $kat->id)->first();
                        $ku = $existingPi ? ($existingPi->kode_unik ?: \App\Models\PaymentSetting::generateUniqueCode()) : \App\Models\PaymentSetting::generateUniqueCode();
                        $tt = \App\Models\PaymentSetting::calculateTotalTransfer($jumlah, $ku);
                        $pc = $existingPi?->payment_code ?? ('PAY/' . str_pad($pendaftar->id, 5, '0', STR_PAD_LEFT) . '/' . now()->format('Ym'));
                        \App\Models\PembayaranItem::updateOrCreate(
                            ['pendaftar_id' => $pendaftar->id, 'kategori_id' => $kat->id],
                            [
                                'jumlah' => $jumlah,
                                'kode_unik' => $ku,
                                'total_transfer' => $tt,
                                'payment_code' => $pc,
                            ]
                        );
                    }
                }
            }
        }

        // When setting to ditolak/refund, also update Pembayaran records
        if (isset($data['status_pembayaran']) && in_array($data['status_pembayaran'], ['ditolak', 'refund'])) {
            \App\Models\Pembayaran::where('pendaftar_id', $pendaftar->id)
                ->whereIn('status', ['pending', 'processing'])
                ->update(['status' => $data['status_pembayaran']]);
        }

        return response()->json(['message' => 'Status berhasil diperbarui']);
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
        $query = Pembayaran::with(['pendaftar.product', 'pendaftar.batch', 'kategori']);

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

        // Perbaiki data lama yang sudah dinyatakan selesai oleh admin, tetapi
        // record transaksi individualnya masih tertinggal pada status pending.
        if ($pendaftar->status_pembayaran === 'verified') {
            Pembayaran::where('pendaftar_id', $pendaftar->id)
                ->whereIn('status', ['pending', 'processing'])
                ->update(['status' => 'verified']);
        }

        $pembayaran = Pembayaran::with('kategori')->where('pendaftar_id', $pendaftar->id)
            ->orderBy('created_at', 'desc')
            ->get();

        // Include PembayaranItem as synthetic records (for payments created during approve)
        $paidKatIds = $pembayaran->pluck('kategori_id')->filter()->unique()->values()->toArray();
        $items = PembayaranItem::with('kategori')->where('pendaftar_id', $pendaftar->id)
            ->whereNotIn('kategori_id', $paidKatIds)
            ->where('jumlah', '>', 0)
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

        $pendaftar = Pendaftar::with('batch', 'product.biayaKategoris')->findOrFail($id);

        $filePath = $request->file('bukti_pembayaran')->store('bukti_pembayaran', 'public');

        $kategori = BiayaKategori::find($request->kategori_id);

        // Resolve actual biaya for this kategori from product pivot
        $katModel = $pendaftar->product?->biayaKategoris?->firstWhere('id', $request->kategori_id);
        $harga = $katModel ? (int) $katModel->pivot->harga : 0;

        // Sum already paid for this kategori
        $sudahDibayar = PembayaranItem::where('pendaftar_id', $pendaftar->id)
            ->where('kategori_id', $request->kategori_id)
            ->value('jumlah') ?? 0;

        // Use sisa (remaining biaya) as jumlah — unique code is for bank matching only
        $sisaBiaya = max(0, $harga - $sudahDibayar);
        $jumlahBayar = min($request->jumlah, $sisaBiaya > 0 ? $sisaBiaya : $request->jumlah);

        Pembayaran::create([
            'pendaftar_id' => $pendaftar->id,
            'jumlah' => $jumlahBayar,
            'kategori_id' => $request->kategori_id,
            'bukti_pembayaran' => $filePath,
            'status' => 'pending',
        ]);

        // Update PembayaranItem untuk kategori ini (jumlah submitted, bukan hanya verified)
        $totalPerKategori = Pembayaran::where('pendaftar_id', $pendaftar->id)
            ->where('kategori_id', $request->kategori_id)
            ->where('status', '!=', 'ditolak')
            ->sum('jumlah');

        // Cap at the kategori biaya
        if ($harga > 0 && $totalPerKategori > $harga) {
            $totalPerKategori = $harga;
        }

        PembayaranItem::updateOrCreate(
            [
                'pendaftar_id' => $pendaftar->id,
                'kategori_id' => $request->kategori_id,
            ],
            ['jumlah' => $totalPerKategori]
        );

        $pendaftar->status_pembayaran = 'processing';
        $pendaftar->bukti_pembayaran = $filePath;
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
            'bank_pengirim' => 'nullable|string|max:100',
            'nama_pengirim' => 'nullable|string|max:200',
            'bukti_pembayaran' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ]);

        $pendaftar = Pendaftar::with('batch', 'product.biayaKategoris')->findOrFail($id);
        $filePath = $request->file('bukti_pembayaran')->store('bukti_pembayaran', 'public');

        // Order kategoris by product's kategori_items hierarchy — parent only
        $allKategoris = BiayaKategori::orderBy('urutan')->get()->keyBy('id');
        $parentOnly = collect();
        $usedIds = [];

        if ($pendaftar->product && is_array($pendaftar->product->kategori_items)) {
            $walk = function ($items) use (&$walk, &$parentOnly, &$usedIds, $allKategoris) {
                foreach ($items as $item) {
                    $name = strtolower(trim($item['name'] ?? ''));
                    if ($name !== '') {
                        $kategori = $allKategoris->first(fn($k) => strtolower($k->nama) === $name || strtolower($k->kode) === $name);
                        if ($kategori && !in_array($kategori->id, $usedIds)) {
                            $children = $item['children'] ?? [];
                            $childIds = collect($children)->map(function ($c) use ($allKategoris) {
                                $cn = strtolower(trim($c['name'] ?? ''));
                                $ck = $allKategoris->first(fn($k) => strtolower($k->nama) === $cn || strtolower($k->kode) === $cn);
                                return $ck ? $ck->id : null;
                            })->filter()->values()->toArray();
                            $kategori->child_ids = $childIds;
                            $parentOnly->push($kategori);
                            $usedIds[] = $kategori->id;
                        }
                    }
                    if (!empty($item['children'])) {
                        $walk($item['children']);
                    }
                }
            };
            $walk($pendaftar->product->kategori_items);
        }
        // Append remaining parents
        foreach ($allKategoris->whereNull('parent_id') as $k) {
            if (!in_array($k->id, $usedIds)) {
                $k->child_ids = [];
                $parentOnly->push($k);
            }
        }
        $kategoris = $parentOnly;

        // Ambil biaya per kategori dari product pivot
        $pivotHarga = collect();
        if ($pendaftar->product && $pendaftar->product->relationLoaded('biayaKategoris')) {
            $pivotHarga = $pendaftar->product->biayaKategoris->keyBy('id')->map(fn($k) => (int) $k->pivot->harga);
        }

        // Fallback: name-based prices from kategori_items JSON
        $namaHarga = collect();
        if ($pendaftar->product && is_array($pendaftar->product->kategori_items)) {
            $buildHarga = function ($items) use (&$buildHarga, &$namaHarga) {
                foreach ($items as $item) {
                    $name = strtolower(trim($item['name'] ?? ''));
                    $harga = (int) ($item['harga'] ?? 0);
                    if ($name !== '' && $harga > 0) {
                        $namaHarga->put($name, $harga);
                    }
                    if (!empty($item['children'])) {
                        $buildHarga($item['children']);
                    }
                }
            };
            $buildHarga($pendaftar->product->kategori_items);
        }

        // Ambil sudah dibayar per kategori
        $existingItems = PembayaranItem::where('pendaftar_id', $pendaftar->id)
            ->get()
            ->keyBy('kategori_id');

        $sisa = (int) $request->jumlah;
        $detailPerKategori = [];

        foreach ($kategoris as $k) {
            if ($sisa <= 0) break;

            // Include child amounts in parent totals
            $catIds = array_merge([$k->id], $k->child_ids ?? []);

            $totalBiaya = 0;
            $totalSudahBayar = 0;
            foreach ($catIds as $cid) {
                $h = $pivotHarga->get($cid, 0);
                if ($h <= 0) {
                    $childKat = $allKategoris->get($cid);
                    $h = $childKat ? $namaHarga->get(strtolower($childKat->nama), 0) : 0;
                }
                $totalBiaya += $h;
                $totalSudahBayar += $existingItems->has($cid) ? (int) $existingItems->get($cid)->jumlah : 0;
            }

            $kurang = $totalBiaya - $totalSudahBayar;
            if ($kurang <= 0) continue;

            $bayar = min($sisa, $kurang);
            $sisa -= $bayar;

            // Distribute proportionally across parent + children
            $remainingToDistribute = $bayar;
            foreach ($catIds as $cid) {
                if ($remainingToDistribute <= 0) break;
                $h = $pivotHarga->get($cid, 0);
                if ($h <= 0) {
                    $childKat = $allKategoris->get($cid);
                    $h = $childKat ? $namaHarga->get(strtolower($childKat->nama), 0) : 0;
                }
                $sdh = $existingItems->has($cid) ? (int) $existingItems->get($cid)->jumlah : 0;
                $krg = $h - $sdh;
                if ($krg <= 0) continue;
                $alokasi = min($remainingToDistribute, $krg);
                $remainingToDistribute -= $alokasi;

                Pembayaran::create([
                    'pendaftar_id' => $pendaftar->id,
                    'jumlah' => $alokasi,
                    'kategori_id' => $cid,
                    'bukti_pembayaran' => $filePath,
                    'status' => 'pending',
                ]);
            }

            $detailPerKategori[] = [
                'kategori' => $k->nama,
                'biaya' => $totalBiaya,
                'dibayar_sebelumnya' => $totalSudahBayar,
                'dibayar_sekarang' => $bayar,
                'total_dibayar' => $totalSudahBayar + $bayar,
                'lunas' => ($totalSudahBayar + $bayar) >= $totalBiaya,
            ];
        }

        // Update pendaftar
        $pendaftar->status_pembayaran = 'processing';
        $pendaftar->bukti_pembayaran = $filePath;
        if ($request->filled('bank_pengirim')) $pendaftar->bank_pengirim = $request->bank_pengirim;
        if ($request->filled('nama_pengirim')) $pendaftar->nama_pengirim = $request->nama_pengirim;
        $pendaftar->save();

        // Recalculate PembayaranItem per kategori, capped at biaya
        $allPembs = Pembayaran::where('pendaftar_id', $pendaftar->id)
            ->where('status', '!=', 'ditolak')
            ->whereNotNull('kategori_id')
            ->selectRaw('kategori_id, SUM(jumlah) as total')
            ->groupBy('kategori_id')
            ->get();

        foreach ($allPembs as $pemb) {
            $hargaKat = $pivotHarga->get($pemb->kategori_id, 0);
            $jumlah = $hargaKat > 0 ? min((int) $pemb->total, $hargaKat) : (int) $pemb->total;
            PembayaranItem::updateOrCreate(
                ['pendaftar_id' => $pendaftar->id, 'kategori_id' => $pemb->kategori_id],
                ['jumlah' => $jumlah]
            );
        }

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

        $totalBiaya = 0;
        if ($pendaftar->product && $pendaftar->product->relationLoaded('biayaKategoris')) {
            $totalBiaya = $pendaftar->product->biayaKategoris->sum(fn($k) => (int) $k->pivot->harga);
        }
        $totalBiaya = $totalBiaya ?: ($pendaftar->product?->harga ?? 0);
        $tagihan = $totalBiaya - ($pendaftar->diskon ?? 0);

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

        $totalDibayar = Pembayaran::where('pendaftar_id', $pendaftar->id)
            ->where('status', 'verified')
            ->sum('jumlah');

        $pendaftar->status_pembayaran = $totalDibayar >= $tagihan ? 'verified' : 'processing';
        $pendaftar->save();

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
        $totalDibayar = (float) PembayaranItem::where('pendaftar_id', $pendaftar->id)->sum('jumlah');
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
        $query = Pendaftar::with(['product', 'batch', 'user', 'siswa'])
            ->where('status_pendaftaran', 'disetujui');

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
                'desa' => $siswa?->desa ?? $p->desa ?? '-',
                'kecamatan' => $siswa?->kecamatan ?? $p->kecamatan ?? '-',
                'kabupaten' => $siswa?->kabupaten ?? $p->kabupaten ?? '-',
                'provinsi' => $siswa?->provinsi ?? $p->provinsi ?? '-',
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
                'status_akademik' => $siswa?->status ?? 'AKTIF',
                'is_cuti' => $siswa?->is_cuti ?? false,
                'cuti_sejak' => $siswa?->cuti_sejak,
                'level_status_keluar' => $siswa && $siswa->level_status
                    ? collect($siswa->level_status)->contains('Keluar')
                    : false,
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
        $allKategoris = BiayaKategori::orderBy('urutan')->get();

        $result = [];

        foreach ($batches as $batch) {
            $pendaftar = Pendaftar::with(['product.biayaKategoris'])
                ->where('batch_id', $batch->id)
                ->orderBy('nama')
                ->get();

            if ($pendaftar->isEmpty()) continue;

            $allPendaftarIds = $pendaftar->pluck('id');
            $allPembayaran = PembayaranItem::whereIn('pendaftar_id', $allPendaftarIds)
                ->get()
                ->groupBy('pendaftar_id');

            $allBayar = \App\Models\Pembayaran::whereIn('pendaftar_id', $allPendaftarIds)
                ->where('status', 'verified')
                ->get()
                ->groupBy('pendaftar_id');

            $batchKategoriUsedIds = new \Illuminate\Support\Collection();

            $items = $pendaftar->map(function ($p) use ($allKategoris, $allPembayaran, $allBayar, &$batchKategoriUsedIds) {
                $pembayaranItems = $allPembayaran->get($p->id, collect())->keyBy('kategori_id');
                $pembayaranList = $allBayar->get($p->id, collect());
                $product = $p->product;

                $pivotById = collect();
                if ($product && $product->relationLoaded('biayaKategoris')) {
                    $pivotById = $product->biayaKategoris->keyBy('id');
                }

                $aggregated = collect();
                if ($product && is_array($product->kategori_items)) {
                    $walkAgg = function ($items, $depth) use (&$walkAgg, $pivotById, &$aggregated) {
                        foreach ($items as $item) {
                            $name = strtolower(trim($item['name'] ?? ''));
                            if ($name === '') continue;
                            $kategori = $pivotById->first(fn($k) => strtolower($k->nama) === $name || strtolower($k->kode) === $name);
                            if (!$kategori) continue;

                            $children = $item['children'] ?? [];
                            $childHarga = 0;
                            foreach ($children as $c) {
                                $cn = strtolower(trim($c['name'] ?? ''));
                                $ck = $pivotById->first(fn($k) => strtolower($k->nama) === $cn || strtolower($k->kode) === $cn);
                                if ($ck) $childHarga += (float) ($ck->pivot->harga ?? 0);
                            }

                            if ($depth === 0) {
                                $aggregated->push([
                                    'id' => $kategori->id,
                                    'kode' => $kategori->kode,
                                    'nama' => $kategori->nama,
                                    'biaya' => (float) ($kategori->pivot->harga ?? 0) + $childHarga,
                                ]);
                            }

                            if (!empty($children)) {
                                $walkAgg($children, $depth + 1);
                            }
                        }
                    };
                    $walkAgg($product->kategori_items, 0);
                }

                foreach ($allKategoris as $k) {
                    if (!$aggregated->firstWhere('id', $k->id)) {
                        $aggregated->push([
                            'id' => $k->id,
                            'kode' => $k->kode,
                            'nama' => $k->nama,
                            'biaya' => (float) ($pivotById->get($k->id)?->pivot->harga ?? 0),
                        ]);
                    }
                }

                $detail = $aggregated->map(function ($item) use ($pembayaranItems, $pembayaranList) {
                    $pi = $pembayaranItems->get($item['id']);
                    $dibayar = $pi ? (int) $pi->jumlah : 0;
                    $pembayaran = $pembayaranList->firstWhere('kategori_id', $item['id']);
                    return [
                        'kategori_id' => $item['id'],
                        'kode' => $item['kode'],
                        'nama' => $item['nama'],
                        'biaya' => $item['biaya'],
                        'dibayar' => $dibayar,
                        'kode_unik' => $pi ? ($pi->kode_unik ?? 0) : 0,
                        'total_transfer' => $pi ? ($pi->total_transfer ?? $item['biaya']) : $item['biaya'],
                    ];
                });

                $detail->filter(fn($d) => $d['biaya'] > 0)->each(fn($d) => $batchKategoriUsedIds->push($d['kategori_id']));

                $totalBiaya = $detail->sum('biaya');
                $totalDibayar = $detail->sum('dibayar');

                return [
                    'id' => $p->id,
                    'nama' => $p->nama,
                    'email' => $p->email,
                    'batch' => $p->batch?->nama_batch ?? '-',
                    'product' => $p->product ? [
                        'id' => $p->product->id,
                        'nama' => $p->product->nama,
                        'kategori_items' => $p->product->kategori_items ?? [],
                    ] : null,
                    'created_at' => $p->created_at->toDateString(),
                    'total_biaya' => $totalBiaya,
                    'total_dibayar' => $totalDibayar,
                    'total_sisa' => max(0, $totalBiaya - $totalDibayar),
                    'status_pembayaran' => $p->status_pembayaran,
                    'status_pendaftaran' => $p->status_pendaftaran,
                    'detail' => $detail,
                ];
            });

            $usedKats = $allKategoris->filter(fn($k) => $batchKategoriUsedIds->contains($k->id));
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
                'kategoris' => $usedKats->map(fn($k) => ['id' => $k->id, 'kode' => $k->kode, 'nama' => $k->nama])->values(),
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

        // Authorization: admin-cabang can only update kandidat in their own batches
        $user = Auth::user();
        if ($user && $user->role === 'ADMIN_CABANG') {
            $branchIds = $user->cabang_ids ?? [];
            $allowedBatchIds = Batch::whereIn('cabang_id', $branchIds)->pluck('id')->toArray();
            if (!in_array($pendaftar->batch_id, $allowedBatchIds)) {
                return response()->json(['message' => 'Akses ditolak. Data ini bukan milik cabang Anda.'], 403);
            }
        }

        // Normalize: convert "-" and empty strings to null before validation
        $normalized = [];
        foreach ($request->all() as $k => $v) {
            $normalized[$k] = ($v === '' || $v === '-' || $v === null) ? null : $v;
        }
        // batch_id 0 means no batch — convert to null
        if (isset($normalized['batch_id']) && (int) $normalized['batch_id'] === 0) {
            $normalized['batch_id'] = null;
        }
        $request->merge($normalized);

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

    public function toggleKandidatStatus($id)
    {
        $pendaftar = Pendaftar::with(['siswa'])->findOrFail($id);
        $siswa = $pendaftar->siswa;

        if (!$siswa) {
            return response()->json(['message' => 'Data siswa tidak ditemukan'], 404);
        }

        $siswa->status = $siswa->status === 'AKTIF' ? 'NONAKTIF' : 'AKTIF';
        $siswa->save();

        return response()->json([
            'message' => 'Status kandidat berhasil diubah menjadi ' . $siswa->status,
            'status_akademik' => $siswa->status,
        ]);
    }

    public function toggleCuti($id)
    {
        $pendaftar = Pendaftar::with(['siswa'])->findOrFail($id);
        $siswa = $pendaftar->siswa;

        if (!$siswa) {
            return response()->json(['message' => 'Data siswa tidak ditemukan'], 404);
        }

        $siswa->is_cuti = !$siswa->is_cuti;
        $siswa->cuti_sejak = $siswa->is_cuti ? now()->toDateString() : null;
        $siswa->save();

        return response()->json([
            'message' => $siswa->is_cuti ? 'Kandidat sedang cuti' : 'Kandidat sudah aktif dari cuti',
            'is_cuti' => $siswa->is_cuti,
            'cuti_sejak' => $siswa->cuti_sejak,
        ]);
    }

    /**
     * Public endpoint: get pendaftar info + company profile for payment page
     */
    public function bayarInfo($id)
    {
        $pendaftar = Pendaftar::with('product')->findOrFail($id);

        $hargaProduk = (float) ($pendaftar->product?->harga ?? 0);
        $totalDibayar = (float) PembayaranItem::where('pendaftar_id', $pendaftar->id)->sum('jumlah');
        $diskon = (float) ($pendaftar->diskon ?? 0);

        $kategoriItems = collect();
        if ($pendaftar->product) {
            $pendaftar->product->load('biayaKategoris');
            $pivotById = $pendaftar->product->biayaKategoris->keyBy('id');

            // Aggregate children into parent based on kategori_items JSON
            $jsonItems = is_array($pendaftar->product->kategori_items) ? $pendaftar->product->kategori_items : [];
            $aggregated = collect();
            $childIds = [];

            $walkAgg = function ($items, $depth) use (&$walkAgg, $pivotById, &$aggregated, &$childIds) {
                foreach ($items as $item) {
                    $name = strtolower(trim($item['name'] ?? ''));
                    if ($name === '') continue;
                    $kategori = $pivotById->first(fn($k) => strtolower($k->nama) === $name || strtolower($k->kode) === $name);
                    if (!$kategori) continue;

                    $children = $item['children'] ?? [];
                    $childHarga = 0;
                    foreach ($children as $c) {
                        $cn = strtolower(trim($c['name'] ?? ''));
                        $ck = $pivotById->first(fn($k) => strtolower($k->nama) === $cn || strtolower($k->kode) === $cn);
                        if ($ck) {
                            $childHarga += (float) ($ck->pivot->harga ?? 0);
                            $childIds[] = $ck->id;
                        }
                    }

                    if ($depth === 0) {
                        $hargaParent = (float) ($kategori->pivot->harga ?? 0);
                        $aggregated->push([
                            'id' => $kategori->id,
                            'nama' => $kategori->nama,
                            'harga' => $hargaParent + $childHarga,
                            'komisi' => (float) ($kategori->pivot->komisi ?? 0),
                        ]);
                    }

                    if (!empty($children)) {
                        $walkAgg($children, $depth + 1);
                    }
                }
            };
            $walkAgg($jsonItems, 0);

            // Add remaining parents not in JSON hierarchy
            foreach ($pivotById as $k) {
                $already = $aggregated->firstWhere('id', $k->id);
                if (!$already && !in_array($k->id, $childIds)) {
                    $aggregated->push([
                        'id' => $k->id,
                        'nama' => $k->nama,
                        'harga' => (float) ($k->pivot->harga ?? 0),
                        'komisi' => (float) ($k->pivot->komisi ?? 0),
                    ]);
                }
            }

            $kategoriItems = $aggregated->values();
        }

        $totalTagihan = max($hargaProduk, $kategoriItems->sum('harga')) - $diskon;
        $sisa = max(0, $totalTagihan - $totalDibayar);
        $noInvoice = 'INV/' . str_pad($pendaftar->id, 5, '0', STR_PAD_LEFT) . '/' . $pendaftar->created_at->format('Ym');
        $company = \App\Models\CompanyProfile::getProfile();

        // Per-kategori paid amounts from verified payments only
        $paidPerKategori = Pembayaran::where('pendaftar_id', $pendaftar->id)
            ->where('status', 'verified')
            ->selectRaw('kategori_id, SUM(jumlah) as total')
            ->groupBy('kategori_id')
            ->pluck('total', 'kategori_id');

        // Resolve deadlines: prefer batch deadlines, then product billing settings, fallback to global reminder settings
        $batchId = $pendaftar->batch_id;
        $batchDeadlines = collect();
        if ($batchId) {
            $batchDeadlines = BatchKategoriDeadline::where('batch_id', $batchId)
                ->where('is_enabled', true)
                ->get()
                ->keyBy('kategori_id');
        }
        $reminderSettings = \App\Models\WaReminderSetting::where('is_enabled', true)
            ->pluck('jatuh_tempo_hari', 'kategori_id');

        // Load billing settings from biaya_kategoris
        $billingMap = collect();
        if ($pendaftar->product) {
            $pendaftar->product->load('biayaKategoris');
            $billingMap = $pendaftar->product->biayaKategoris->keyBy('id');
        }

        // Perbaiki data affiliate lama yang tersimpan dengan harga seluruh
        // program. Selama belum ada transaksi dan tagihannya masih unpaid,
        // nominal invoice pertama harus mengikuti harga kategori pertama.
        $kategoriPertama = $kategoriItems->first();
        $sudahAdaTransaksi = Pembayaran::where('pendaftar_id', $pendaftar->id)->exists();
        if ($kategoriPertama && !$sudahAdaTransaksi && $pendaftar->status_pembayaran === 'unpaid') {
            $nominalAwal = (float) $kategoriPertama['harga'];
            $itemPertama = PembayaranItem::where('pendaftar_id', $pendaftar->id)
                ->where('kategori_id', $kategoriPertama['id'])
                ->first();

            if ($itemPertama && (float) $itemPertama->jumlah !== $nominalAwal) {
                $kodeUnik = (int) ($itemPertama->kode_unik ?? 0);
                $itemPertama->update([
                    'jumlah' => $nominalAwal,
                    'total_transfer' => PaymentSetting::calculateTotalTransfer($nominalAwal, $kodeUnik),
                ]);
            }

            if ((float) $pendaftar->nominal !== $nominalAwal) {
                $pendaftar->update(['nominal' => $nominalAwal]);
            }
        }

        $kategoriItemsEnriched = $kategoriItems->map(function ($item) use ($paidPerKategori, $reminderSettings, $batchDeadlines, $billingMap, $pendaftar) {
            $dibayar = (float) ($paidPerKategori[$item['id']] ?? 0);

            $batchDl = $batchDeadlines->get($item['id']);
            $dueAt = null;
            $jatuh_tempo_hari = 30;

            if ($batchDl && $batchDl->tanggal_akhir) {
                $dueAt = $batchDl->tanggal_akhir->copy()->setTime(23, 59, 59)->timezone('Asia/Jakarta')->toIso8601String();
                $jatuh_tempo_hari = $pendaftar->tanggal_persetujuan
                    ? \Carbon\Carbon::parse($pendaftar->tanggal_persetujuan)->diffInDays($batchDl->tanggal_akhir)
                    : (int) ($reminderSettings[$item['id']] ?? 30);
            } else {
                $billing = $billingMap->get($item['id']);
                $dueType = $billing->due_type ?? null;
                $dueValue = $billing->due_value ?? null;

                if ($dueType && $dueType !== 'none' && $dueType !== 'manual') {
                    $baseDate = $pendaftar->tanggal_persetujuan
                        ? \Carbon\Carbon::parse($pendaftar->tanggal_persetujuan)
                        : \Carbon\Carbon::parse($pendaftar->created_at);

                    if ($dueType === 'days_after_invoice' && $dueValue) {
                        $jatuh_tempo_hari = (int) $dueValue;
                        $dueAt = $baseDate->copy()->addDays($jatuh_tempo_hari)->timezone('Asia/Jakarta')->toIso8601String();
                    } elseif ($dueType === 'fixed_date' && $dueValue) {
                        $dueAt = \Carbon\Carbon::parse($dueValue)->setTime(23, 59, 59)->timezone('Asia/Jakarta')->toIso8601String();
                        $jatuh_tempo_hari = $pendaftar->tanggal_persetujuan
                            ? $baseDate->diffInDays(\Carbon\Carbon::parse($dueValue))
                            : (int) ($reminderSettings[$item['id']] ?? 30);
                    }
                } else {
                    $jatuh_tempo_hari = (int) ($reminderSettings[$item['id']] ?? 30);
                    if ($pendaftar->tanggal_persetujuan) {
                        $dueAt = \Carbon\Carbon::parse($pendaftar->tanggal_persetujuan)
                            ->addDays($jatuh_tempo_hari)->timezone('Asia/Jakarta')->toIso8601String();
                    }
                }
            }

            // Get or create kode_unik from pembayaran_items
            $pi = PembayaranItem::where('pendaftar_id', $pendaftar->id)
                ->where('kategori_id', $item['id'])
                ->first();
            if ($pi) {
                if ((!$pi->kode_unik || $pi->kode_unik == 0) && $item['harga'] > 0) {
                    $ku = PaymentSetting::generateUniqueCode();
                    $tt = PaymentSetting::calculateTotalTransfer((float) $item['harga'], $ku);
                    $pc = $pi->payment_code ?? ('PAY/' . str_pad($pendaftar->id, 5, '0', STR_PAD_LEFT) . '/' . now()->format('Ym'));
                    $pi->update(['kode_unik' => $ku, 'total_transfer' => $tt, 'payment_code' => $pc]);
                    $pi->refresh();
                }
                $kodeUnik = $pi->kode_unik ?? 0;
                $totalTransfer = $pi->total_transfer ?? $item['harga'];
                $paymentCode = $pi->payment_code ?? null;
            } else {
                $ku = PaymentSetting::generateUniqueCode();
                $tt = PaymentSetting::calculateTotalTransfer((float) $item['harga'], $ku);
                $pc = 'PAY/' . str_pad($pendaftar->id, 5, '0', STR_PAD_LEFT) . '/' . now()->format('Ym');
                PembayaranItem::create([
                    'pendaftar_id' => $pendaftar->id,
                    'kategori_id' => $item['id'],
                    'jumlah' => 0,
                    'kode_unik' => $ku,
                    'total_transfer' => $tt,
                    'payment_code' => $pc,
                ]);
                $kodeUnik = $ku;
                $totalTransfer = $tt;
                $paymentCode = $pc;
            }

            return [
                'id'      => $item['id'],
                'nama'    => $item['nama'],
                'harga'   => $item['harga'],
                'komisi'  => $item['komisi'],
                'dibayar' => $dibayar,
                'sisa'    => max(0, $item['harga'] - $dibayar),
                'jatuh_tempo_hari' => $jatuh_tempo_hari ?? 30,
                'due_at' => $dueAt,
                'kode_unik' => $kodeUnik,
                'total_transfer' => $totalTransfer,
                'payment_code' => $paymentCode,
            ];
        });

        return response()->json([
            'no_invoice' => $noInvoice,
            'pendaftar' => [
                'id' => $pendaftar->id,
                'nama' => $pendaftar->nama,
                'email' => $pendaftar->email,
                'telepon' => $pendaftar->telepon,
                'created_at' => $pendaftar->created_at,
                'tanggal_persetujuan' => $pendaftar->tanggal_persetujuan,
                'status_pendaftaran' => $pendaftar->status_pendaftaran,
                'status_pembayaran' => $pendaftar->status_pembayaran,
                'bukti_pembayaran' => $pendaftar->bukti_pembayaran,
            ],
            'product' => $pendaftar->product ? [
                'id' => $pendaftar->product->id,
                'nama' => $pendaftar->product->nama,
                'harga' => $hargaProduk,
            ] : null,
            'keuangan' => [
                'harga_produk' => $hargaProduk,
                'diskon' => $diskon,
                'total_tagihan' => $totalTagihan,
                'total_dibayar' => $totalDibayar,
                'sisa' => $sisa,
            ],
            'company' => [
                'bank_nama' => $company->bank_nama,
                'bank_nomor_rekening' => $company->bank_nomor_rekening,
                'bank_pemilik' => $company->bank_pemilik,
                'company_name' => $company->company_name,
                'pt_name' => $company->pt_name,
            ],
            'bank_accounts' => \App\Models\BankAccount::active()->get(),
            'payment_settings' => [
                'manual_payment_enabled' => \App\Models\PaymentSetting::isEnabled('manual_payment_enabled'),
                'unique_code_max' => \App\Models\PaymentSetting::getUniqueCodeMax(),
                'unique_code_operation' => \App\Models\PaymentSetting::getUniqueCodeOperation(),
            ],
            'kategori_items' => $kategoriItemsEnriched,
        ]);
    }

    private function cekDanCatatKomisiAffiliate($pendaftar)
    {
        if (!$pendaftar->affiliate_link_id) return;

        $product = $pendaftar->product;
        if (!$product) return;

        $product->load(['biayaKategoris', 'komisiTiers']);
        if ($product->biayaKategoris->isEmpty()) return;

        // Build parent→children map from kategori_items JSON
        $kategoriItems = $product->kategori_items ?? [];
        $parentMap = []; // kategori_id => ['name' => ..., 'children_ids' => [...], 'children_count' => N]

        foreach ($kategoriItems as $item) {
            $name = strtolower(trim($item['name'] ?? ''));
            if (empty($item['children']) || count($item['children']) === 0) continue;

            $parentKategori = $product->biayaKategoris->first(
                fn($k) => strtolower($k->nama) === $name || strtolower($k->kode) === $name
            );
            if (!$parentKategori) continue;

            $childrenIds = [];
            foreach ($item['children'] as $child) {
                $childName = strtolower(trim($child['name'] ?? ''));
                $childKategori = $product->biayaKategoris->first(
                    fn($k) => strtolower($k->nama) === $childName || strtolower($k->kode) === $childName
                );
                if ($childKategori) $childrenIds[] = $childKategori->id;
            }

            $parentMap[$parentKategori->id] = [
                'name' => $parentKategori->nama,
                'children_ids' => $childrenIds,
                'children_count' => count($childrenIds),
            ];
        }

        // For each parent kategori, check if this pendaftar is lunas (all children fully paid)
        foreach ($parentMap as $parentId => $info) {
            if ($info['children_count'] === 0) continue;

            $existing = KomisiAffiliate::where('pendaftar_id', $pendaftar->id)
                ->where('kategori_id', $parentId)
                ->first();
            if ($existing) continue;

            // Check all children are fully paid
            $allLunas = true;
            foreach ($info['children_ids'] as $childId) {
                $childBiaya = $product->biayaKategoris->first(fn($k) => $k->id === $childId);
                $hargaChild = $childBiaya ? (float) $childBiaya->pivot->harga : 0;
                if ($hargaChild <= 0) continue;

                $dibayar = PembayaranItem::where('pendaftar_id', $pendaftar->id)
                    ->where('kategori_id', $childId)
                    ->sum('jumlah');
                if ($dibayar < $hargaChild) {
                    $allLunas = false;
                    break;
                }
            }

            if (!$allLunas) continue;

            // Count how many other pendaftar from same affiliate in same batch are also lunas at this parent
            $affiliatePendaftars = \App\Models\Pendaftar::where('affiliate_link_id', $pendaftar->affiliate_link_id)
                ->where('batch_id', $pendaftar->batch_id)
                ->where('status', '!=', 'rejected')
                ->get();

            $lunasCount = 0;
            foreach ($affiliatePendaftars as $ap) {
                $isLunas = true;
                foreach ($info['children_ids'] as $childId) {
                    $childBiaya = $product->biayaKategoris->first(fn($k) => $k->id === $childId);
                    $hargaChild = $childBiaya ? (float) $childBiaya->pivot->harga : 0;
                    if ($hargaChild <= 0) continue;

                    $dibayar = PembayaranItem::where('pendaftar_id', $ap->id)
                        ->where('kategori_id', $childId)
                        ->sum('jumlah');
                    if ($dibayar < $hargaChild) {
                        $isLunas = false;
                        break;
                    }
                }
                if ($isLunas) $lunasCount++;
            }

            // Find matching tier: prefer batch-specific, fallback to global (batch_id=null)
            $komisiAmount = 0;

            $batchTiers = $product->komisiTiers
                ->where('kategori_id', $parentId)
                ->where('batch_id', $pendaftar->batch_id)
                ->filter(fn($t) => $lunasCount >= $t->min_orang && ($t->max_orang === null || $lunasCount <= $t->max_orang))
                ->sortBy('min_orang')
                ->last();

            $globalTiers = $product->komisiTiers
                ->where('kategori_id', $parentId)
                ->whereNull('batch_id')
                ->filter(fn($t) => $lunasCount >= $t->min_orang && ($t->max_orang === null || $lunasCount <= $t->max_orang))
                ->sortBy('min_orang')
                ->last();

            $tier = $batchTiers ?? $globalTiers;

            if ($tier) {
                $komisiAmount = (float) $tier->komisi;
            }

            if ($komisiAmount <= 0) continue;

            KomisiAffiliate::create([
                'affiliate_link_id' => $pendaftar->affiliate_link_id,
                'pendaftar_id' => $pendaftar->id,
                'kategori_id' => $parentId,
                'jumlah' => $komisiAmount,
                'status' => 'pending',
            ]);
        }
    }

    public function banks()
    {
        return response()->json([
            'banks' => [
                ['kode' => 'BCA', 'nama' => 'BCA'],
                ['kode' => 'Mandiri', 'nama' => 'Bank Mandiri'],
                ['kode' => 'BRI', 'nama' => 'BRI'],
                ['kode' => 'BNI', 'nama' => 'BNI'],
                ['kode' => 'BSI', 'nama' => 'BSI (Bank Syariah Indonesia)'],
                ['kode' => 'BTN', 'nama' => 'BTN'],
                ['kode' => 'CIMB Niaga', 'nama' => 'CIMB Niaga'],
                ['kode' => 'Danamon', 'nama' => 'Danamon'],
                ['kode' => 'Permata', 'nama' => 'Permata'],
                ['kode' => 'Maybank', 'nama' => 'Maybank'],
                ['kode' => 'Panin', 'nama' => 'Panin'],
                ['kode' => 'OCBC NISP', 'nama' => 'OCBC NISP'],
                ['kode' => 'UOB', 'nama' => 'UOB'],
                ['kode' => 'HSBC', 'nama' => 'HSBC'],
                ['kode' => 'Standard Chartered', 'nama' => 'Standard Chartered'],
                ['kode' => 'Mega', 'nama' => 'Bank Mega'],
                ['kode' => 'Bukopin', 'nama' => 'Bukopin'],
                ['kode' => 'Artha Graha', 'nama' => 'Artha Graha'],
                ['kode' => 'BPD', 'nama' => 'BPD (Bank Pembangunan Daerah)'],
                ['kode' => 'Bank Lain', 'nama' => 'Bank Lain'],
            ],
            'ewallets' => [
                ['kode' => 'GoPay', 'nama' => 'GoPay'],
                ['kode' => 'OVO', 'nama' => 'OVO'],
                ['kode' => 'DANA', 'nama' => 'DANA'],
                ['kode' => 'LinkAja', 'nama' => 'LinkAja'],
                ['kode' => 'ShopeePay', 'nama' => 'ShopeePay'],
                ['kode' => 'PayLater', 'nama' => 'PayLater'],
                ['kode' => 'Jenius', 'nama' => 'Jenius'],
                ['kode' => 'Sakuku', 'nama' => 'Sakuku (BCA)'],
                ['kode' => 'E-Wallet Lain', 'nama' => 'E-Wallet Lain'],
            ],
        ]);
    }
}
