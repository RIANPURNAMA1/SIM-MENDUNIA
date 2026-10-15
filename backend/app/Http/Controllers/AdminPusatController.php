<?php

namespace App\Http\Controllers;

use App\Models\Pendaftar;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AdminPusatController extends Controller
{
    public function dashboard(Request $request)
    {
        $statuses = ['disetujui', 'pending', 'ditolak'];

        $rows = DB::table('pendaftar')
            ->leftJoin('batches', 'pendaftar.batch_id', '=', 'batches.id')
            ->leftJoin('cabangs', 'batches.cabang_id', '=', 'cabangs.id')
            ->select(
                'cabangs.id as cabang_id',
                'cabangs.nama_cabang as cabang_nama',
                'batches.id as batch_id',
                'batches.nama_batch as nama_batch',
                'batches.warna as warna',
                'pendaftar.status_pendaftaran as status_pendaftaran',
                DB::raw('COUNT(*) as total')
            )
            ->groupBy(
                'cabangs.id',
                'cabangs.nama_cabang',
                'batches.id',
                'batches.nama_batch',
                'batches.warna',
                'pendaftar.status_pendaftaran'
            )
            ->get();

        $cabangs = [];
        $batchIds = [];
        $stats = [
            'total_pendaftar' => 0,
            'pendaftar_disetujui' => 0,
            'pendaftar_pending' => 0,
            'pendaftar_ditolak' => 0,
            'total_cabang' => 0,
            'total_batch' => 0,
        ];

        foreach ($rows as $r) {
            $cid = $r->cabang_id ?? 0;
            $bid = $r->batch_id ?? 0;
            $total = (int) $r->total;
            $status = in_array($r->status_pendaftaran, $statuses, true) ? $r->status_pendaftaran : 'pending';

            if (! isset($cabangs[$cid])) {
                $cabangs[$cid] = [
                    'cabang_id' => $r->cabang_id,
                    'cabang_nama' => $r->cabang_nama ?? 'Tanpa Cabang',
                    'total' => 0,
                    'disetujui' => 0,
                    'pending' => 0,
                    'ditolak' => 0,
                    'batches' => [],
                ];
            }

            if (! isset($cabangs[$cid]['batches'][$bid])) {
                $cabangs[$cid]['batches'][$bid] = [
                    'batch_id' => $r->batch_id,
                    'nama_batch' => $r->nama_batch ?? 'Tanpa Batch',
                    'warna' => $r->warna,
                    'total' => 0,
                    'disetujui' => 0,
                    'pending' => 0,
                    'ditolak' => 0,
                ];
            }

            $cabangs[$cid]['total'] += $total;
            $cabangs[$cid][$status] += $total;
            $cabangs[$cid]['batches'][$bid]['total'] += $total;
            $cabangs[$cid]['batches'][$bid][$status] += $total;

            $stats['total_pendaftar'] += $total;
            $stats['pendaftar_'.$status] += $total;
            if ($r->batch_id) {
                $batchIds[$r->batch_id] = true;
            }
        }

        foreach ($cabangs as &$c) {
            $c['batches'] = array_values($c['batches']);
            usort($c['batches'], fn ($a, $b) => $b['total'] <=> $a['total']);
        }
        unset($c);

        $cabangs = array_values($cabangs);
        usort($cabangs, fn ($a, $b) => $b['total'] <=> $a['total']);

        $stats['total_cabang'] = count($cabangs);
        $stats['total_batch'] = count($batchIds);

        $recent = Pendaftar::with(['batch.cabang'])
            ->orderByDesc('id')
            ->limit(8)
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'nama' => $p->nama,
                'batch' => $p->batch->nama_batch ?? 'Tanpa Batch',
                'cabang' => $p->batch->cabang->nama_cabang ?? 'Tanpa Cabang',
                'status' => $p->status_pendaftaran,
                'created_at' => optional($p->created_at)->toDateTimeString(),
            ]);

        return response()->json([
            'user' => [
                'name' => Auth::user()->name ?? '',
                'role' => Auth::user()->role ?? '',
            ],
            'stats' => $stats,
            'per_cabang' => $cabangs,
            'recent_pendaftar' => $recent,
        ]);
    }
}
