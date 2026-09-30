<?php

namespace App\Services;

use App\Models\KomisiAffiliate;
use App\Models\KomisiTier;
use App\Models\PembayaranItem;
use App\Models\Pendaftar;
use App\Models\Product;
use Illuminate\Support\Collection;

class KomisiAffiliateService
{
    /**
     * Peta kategori induk -> sub-kategori, dibangun dari `kategori_items` produk.
     * Hanya kategori yang punya children yang bisa memicu komisi.
     */
    public function parentMap(Product $product): array
    {
        $product->loadMissing(['biayaKategoris', 'komisiTiers']);
        if ($product->biayaKategoris->isEmpty()) return [];

        $parentMap = [];
        foreach (($product->kategori_items ?? []) as $item) {
            $name = strtolower(trim($item['name'] ?? ''));
            if (empty($item['children']) || count($item['children']) === 0) continue;

            $parentKategori = $product->biayaKategoris->first(
                fn($k) => strtolower($k->nama) === $name || strtolower($k->kode) === $name
            );
            if (!$parentKategori) continue;

            $childrenIds = [];
            $childrenNames = [];
            foreach ($item['children'] as $child) {
                $childName = strtolower(trim($child['name'] ?? ''));
                $childKategori = $product->biayaKategoris->first(
                    fn($k) => strtolower($k->nama) === $childName || strtolower($k->kode) === $childName
                );
                if ($childKategori) {
                    $childrenIds[] = $childKategori->id;
                    $childrenNames[] = $childKategori->nama;
                }
            }

            $parentMap[$parentKategori->id] = [
                'name' => $parentKategori->nama,
                'children_ids' => $childrenIds,
                'children_names' => $childrenNames,
                'children_count' => count($childrenIds),
            ];
        }

        return $parentMap;
    }

    /**
     * Syarat lunas: total dibayar untuk (induk + semua anak) >= total biaya grup.
     */
    public function isLunas(int $pendaftarId, array $allIds, Collection $biayaKategoris): bool
    {
        $totalBiaya = 0.0;
        foreach ($allIds as $id) {
            $kat = $biayaKategoris->first(fn($k) => $k->id === $id);
            $totalBiaya += $kat ? (float) $kat->pivot->harga : 0;
        }

        if ($totalBiaya <= 0) return false;

        $dibayar = (float) PembayaranItem::where('pendaftar_id', $pendaftarId)
            ->whereIn('kategori_id', $allIds)
            ->sum('jumlah');

        return $dibayar >= $totalBiaya;
    }

    /**
     * Jumlah pendaftar dari link affiliate yang sama pada batch yang sama
     * dan sudah lunas di grup kategori ini. Kandidat "ditolak" dan
     * "Mengundurkan Diri" tidak dihitung.
     */
    public function lunasCount(int $affiliateLinkId, ?int $batchId, array $allIds, Collection $biayaKategoris): int
    {
        $affiliatePendaftar = Pendaftar::where('affiliate_link_id', $affiliateLinkId)
            ->where('batch_id', $batchId)
            ->where('status_pendaftaran', '!=', 'ditolak')
            ->where(function ($q) {
                $q->whereDoesntHave('siswa')
                  ->orWhereHas('siswa', fn($q) => $q->where(function ($inner) {
                      $inner->whereNull('status_kandidat')
                            ->orWhere('status_kandidat', '!=', 'Mengundurkan Diri');
                  }));
            })
            ->get(['id']);

        $count = 0;
        foreach ($affiliatePendaftar as $ap) {
            if ($this->isLunas($ap->id, $allIds, $biayaKategoris)) $count++;
        }

        return $count;
    }

    /**
     * Pilih tier: utamakan tier milik batch spesifik, fallback ke tier global
     * ("Semua Batch"). Null batch_id otomatis menjadi whereNull.
     */
    public function pickTier(Collection $komisiTiers, int $kategoriId, ?int $batchId, int $lunasCount): ?KomisiTier
    {
        $match = fn($t) => $lunasCount >= $t->min_orang
            && ($t->max_orang === null || $lunasCount <= $t->max_orang);

        $batchTiers = $komisiTiers->where('kategori_id', $kategoriId)
            ->where('batch_id', $batchId)
            ->filter($match)
            ->sortBy('min_orang')
            ->last();

        if ($batchTiers) return $batchTiers;

        return $komisiTiers->where('kategori_id', $kategoriId)
            ->whereNull('batch_id')
            ->filter($match)
            ->sortBy('min_orang')
            ->last();
    }

    /**
     * Catat komisi affiliate untuk satu pendaftar. Dipanggil setiap kali status
     * pembayaran berubah (set lunas, verifikasi, approval, dsb).
     *
     * Komisi bersifat flat per affiliate + batch + kategori, tapi nominalnya
     * dihitung ulang ketika jumlah kandidat lunas melewati batas tier berikutnya.
     */
    public function catat(Pendaftar $pendaftar): void
    {
        if (!$pendaftar->affiliate_link_id) return;

        $product = $pendaftar->product;
        if (!$product) return;

        $product->loadMissing(['biayaKategoris', 'komisiTiers']);
        if ($product->biayaKategoris->isEmpty()) return;

        foreach ($this->parentMap($product) as $parentId => $info) {
            if ($info['children_count'] === 0) continue;

            $allIds = array_merge([$parentId], $info['children_ids']);

            if (!$this->isLunas($pendaftar->id, $allIds, $product->biayaKategoris)) continue;

            $lunasCount = $this->lunasCount(
                $pendaftar->affiliate_link_id,
                $pendaftar->batch_id,
                $allIds,
                $product->biayaKategoris
            );

            $tier = $this->pickTier($product->komisiTiers, $parentId, $pendaftar->batch_id, $lunasCount);
            if (!$tier) continue;

            $komisiAmount = (float) $tier->komisi;
            if ($komisiAmount <= 0) continue;

            $existingKomisi = KomisiAffiliate::where('affiliate_link_id', $pendaftar->affiliate_link_id)
                ->where('kategori_id', $parentId)
                ->whereHas('pendaftar', fn($q) => $q->where('batch_id', $pendaftar->batch_id))
                ->first();

            if ($existingKomisi) {
                $linkedPendaftar = Pendaftar::with('siswa')->find($existingKomisi->pendaftar_id);
                $isWithdrawn = $linkedPendaftar && $linkedPendaftar->siswa
                    && $linkedPendaftar->siswa->status_kandidat === 'Mengundurkan Diri';

                if ($isWithdrawn) {
                    $existingKomisi->delete();
                } elseif ($existingKomisi->status === 'pending' && (float) $existingKomisi->jumlah !== $komisiAmount) {
                    $existingKomisi->update(['jumlah' => $komisiAmount]);
                    continue;
                } else {
                    continue;
                }
            }

            KomisiAffiliate::create([
                'affiliate_link_id' => $pendaftar->affiliate_link_id,
                'pendaftar_id' => $pendaftar->id,
                'kategori_id' => $parentId,
                'jumlah' => $komisiAmount,
                'status' => 'pending',
            ]);
        }
    }

    /**
     * Ringkasan aturan komisi + progres affiliate, untuk ditampilkan di dashboard.
     * Satu entri per link affiliate yang dimiliki user.
     */
    public function progressForAffiliate(int $affiliateUserId): array
    {
        $links = \App\Models\AffiliateLink::with(['product' => function ($q) {
            $q->with(['biayaKategoris', 'komisiTiers.kategori', 'komisiTiers.batch']);
        }])
            ->where('affiliate_id', $affiliateUserId)
            ->orderBy('created_at', 'desc')
            ->get();

        $out = [];

        foreach ($links as $link) {
            $product = $link->product;
            if (!$product) continue;

            $parentMap = $this->parentMap($product);
            if (empty($parentMap)) continue;

            // Pendaftaran lewat link affiliate mengikuti batch produk, jadi
            // pastikan batch tersebut selalu ikut ditampilkan walau belum ada
            // pendaftar (affiliate baru membuat link, belum ada yang mendaftar).
            $batchIds = Pendaftar::where('affiliate_link_id', $link->id)
                ->whereNotNull('batch_id')
                ->distinct()
                ->pluck('batch_id')
                ->all();

            if ($product->batch_id && !in_array($product->batch_id, $batchIds, true)) {
                $batchIds[] = (int) $product->batch_id;
            }

            if (empty($batchIds)) continue;

            $batchNames = \App\Models\Batch::whereIn('id', $batchIds)->pluck('nama_batch', 'id');

            $komisiRecords = KomisiAffiliate::where('affiliate_link_id', $link->id)->get()
                ->keyBy('kategori_id');

            $kategori = [];

            foreach ($parentMap as $parentId => $info) {
                if ($info['children_count'] === 0) continue;

                $allIds = array_merge([$parentId], $info['children_ids']);

                $tiers = $product->komisiTiers
                    ->where('kategori_id', $parentId)
                    ->sortBy(fn($t) => [$t->batch_id === null ? 1 : 0, $t->min_orang])
                    ->values()
                    ->map(fn($t) => [
                        'id' => $t->id,
                        'batch_id' => $t->batch_id,
                        'batch_nama' => $t->batch_id ? ($batchNames[$t->batch_id] ?? $t->batch?->nama_batch) : null,
                        'min_orang' => (int) $t->min_orang,
                        'max_orang' => $t->max_orang === null ? null : (int) $t->max_orang,
                        'komisi' => (float) $t->komisi,
                    ]);

                if ($tiers->isEmpty()) continue;

                $progres = [];
                foreach ($batchIds as $batchId) {
                    $lunasCount = $this->lunasCount(
                        $link->id,
                        (int) $batchId,
                        $allIds,
                        $product->biayaKategoris
                    );

                    $tierAktif = $this->pickTier($product->komisiTiers, $parentId, (int) $batchId, $lunasCount);

                    $tierBerikut = $product->komisiTiers
                        ->where('kategori_id', $parentId)
                        ->filter(function ($t) use ($lunasCount, $batchId) {
                            $cocokBatch = $t->batch_id === null || (int) $t->batch_id === (int) $batchId;
                            return $cocokBatch && $t->min_orang > $lunasCount;
                        })
                        ->sortBy('min_orang')
                        ->first();

                $recorded = $komisiRecords->get($parentId);

                    $progres[] = [
                        'batch_id' => (int) $batchId,
                        'batch_nama' => $batchNames[$batchId] ?? 'Tanpa Batch',
                        'lunas_count' => $lunasCount,
                        'komisi_berkas' => $recorded ? (float) $recorded->jumlah : 0,
                        'status_komisi' => $recorded?->status ?? null,
                        'tier_aktif' => $tierAktif ? (float) $tierAktif->komisi : null,
                        'tier_berikut' => $tierBerikut ? [
                            'min_orang' => (int) $tierBerikut->min_orang,
                            'komisi' => (float) $tierBerikut->komisi,
                        ] : null,
                        'kurang_orang' => $tierBerikut ? (int) $tierBerikut->min_orang - $lunasCount : 0,
                    ];
                }

                $kategori[] = [
                    'kategori_id' => (int) $parentId,
                    'nama' => $info['name'],
                    'sub' => $info['children_names'],
                    'tiers' => $tiers,
                    'progres' => $progres,
                ];
            }

            if (empty($kategori)) continue;

            $out[] = [
                'link_id' => $link->id,
                'kode' => $link->kode,
                'nama_link' => $link->nama_link,
                'product' => [
                    'id' => $product->id,
                    'nama' => $product->nama,
                    'harga' => (float) $product->harga,
                ],
                'kategori' => $kategori,
            ];
        }

        return $out;
    }
}
