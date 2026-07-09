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
            'telepon' => 'nullable|string|max:20',
            'alamat' => 'nullable|string',
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
                  ->orWhere('email', 'like', "%{$s}%");
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

        $pembayarans = Pembayaran::where('pendaftar_id', $pendaftar->id)
            ->where('status', 'pending')
            ->get();

        foreach ($pembayarans as $p) {
            $p->update(['status' => 'verified']);
            if ($p->kategori_id) {
                PembayaranItem::updateOrCreate(
                    [
                        'pendaftar_id' => $pendaftar->id,
                        'kategori_id' => $p->kategori_id,
                    ],
                    ['jumlah' => $p->jumlah]
                );
            }
        }

        // Sync total nominal
        $totalDibayar = PembayaranItem::where('pendaftar_id', $pendaftar->id)->sum('jumlah');
        $pendaftar->nominal = $totalDibayar;
        $pendaftar->save();

        return response()->json(['message' => 'Pembayaran terverifikasi']);
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

        $pembayaran = Pembayaran::where('pendaftar_id', $pendaftar->id)
            ->orderBy('created_at', 'desc')
            ->get();

        // Include PembayaranItem as synthetic records (for payments created during approve)
        $paidKatIds = $pembayaran->pluck('kategori_id')->filter()->unique()->values()->toArray();
        $items = PembayaranItem::where('pendaftar_id', $pendaftar->id)
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
            'bukti_pembayaran' => 'required|file|mimes:jpg,jpeg,png,pdf|max:2048',
        ]);

        $pendaftar = Pendaftar::findOrFail($id);

        $filePath = $request->file('bukti_pembayaran')->store('bukti_pembayaran', 'public');

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

        return response()->json([
            'message' => 'Pembayaran berhasil dikirim, menunggu verifikasi admin',
            'pendaftar' => $pendaftar->fresh()->load('product.biayaKategoris'),
        ]);
    }

    public function bayarManual(Request $request, $id)
    {
        $request->validate([
            'jumlah' => 'required|numeric|min:1',
            'kategori_id' => 'required|exists:biaya_kategoris,id',
        ]);

        $pendaftar = Pendaftar::with('product.biayaKategoris')->findOrFail($id);

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

        // Update PembayaranItem
        PembayaranItem::updateOrCreate(
            [
                'pendaftar_id' => $pendaftar->id,
                'kategori_id' => $request->kategori_id,
            ],
            ['jumlah' => $request->jumlah]
        );

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
}
