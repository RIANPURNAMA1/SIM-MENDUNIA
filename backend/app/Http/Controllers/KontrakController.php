<?php

namespace App\Http\Controllers;

use App\Models\Kontrak;
use App\Models\KontrakTandaTangan;
use App\Models\Pendaftar;
use App\Models\Siswa;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class KontrakController extends Controller
{
    private function siswaCabangId($user): ?int
    {
        $siswa = Siswa::where('user_id', $user->id)->first();
        $pendaftar = Pendaftar::where('user_id', $user->id)->orderBy('created_at', 'desc')->first();
        $batchId = $siswa?->batch_id ?: $pendaftar?->batch_id;
        if (!$batchId) return null;

        $batch = \App\Models\Batch::find($batchId);

        return $batch?->cabang_id;
    }

    private function siswaPendaftar($user): ?Pendaftar
    {
        return Pendaftar::where('user_id', $user->id)->orderBy('created_at', 'desc')->first();
    }

    // ========== Admin ==========
    public function index(Request $request)
    {
        $query = Kontrak::with(['cabang:id,nama_cabang,kode_cabang', 'uploader:id,name']);

        if ($request->filled('cabang_id')) {
            $query->where('cabang_id', $request->cabang_id);
        }
        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(fn($q) => $q->where('judul', 'like', "%$s%")
                ->orWhereHas('cabang', fn($c) => $c->where('nama_cabang', 'like', "%$s%")));
        }

        return response()->json(
            $query->orderBy('created_at', 'desc')->get()->map(function ($k) {
                return [
                    'id' => $k->id,
                    'judul' => $k->judul,
                    'cabang_id' => $k->cabang_id,
                    'cabang_nama' => $k->cabang?->nama_cabang,
                    'file_kontrak' => $k->file_kontrak,
                    'file_kontrak_ttd' => $k->file_kontrak_ttd,
                    'ttd_uploaded_at' => $k->ttd_uploaded_at,
                    'keterangan' => $k->keterangan,
                    'uploaded_by' => $k->uploader?->name,
                    'ttd_count' => $k->tandaTangans->count(),
                    'ttds' => $k->tandaTangans->map(fn($t) => [
                        'id' => $t->id,
                        'pendaftar_nama' => $t->pendaftar?->nama,
                        'no_registrasi' => $t->pendaftar?->no_registrasi,
                        'file_ttd' => $t->file_ttd,
                        'uploaded_at' => $t->created_at,
                    ]),
                    'created_at' => $k->created_at,
                ];
            })
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'cabang_id' => 'required|exists:cabangs,id',
            'judul' => 'required|string|max:255',
            'file' => 'required|file|mimes:pdf|max:20480',
            'keterangan' => 'nullable|string',
        ]);

        $path = $request->file('file')->store('kontrak', 'public');

        $kontrak = Kontrak::create([
            'cabang_id' => $validated['cabang_id'],
            'judul' => $validated['judul'],
            'file_kontrak' => $path,
            'keterangan' => $validated['keterangan'] ?? null,
            'uploaded_by' => Auth::id(),
        ]);

        return response()->json($kontrak->load('cabang'), 201);
    }

    public function destroy($id)
    {
        $kontrak = Kontrak::findOrFail($id);
        Storage::disk('public')->delete([$kontrak->file_kontrak, $kontrak->file_kontrak_ttd]);
        $kontrak->delete();

        return response()->json(['message' => 'Kontrak dihapus']);
    }

    // ========== Siswa ==========
    public function siswaIndex()
    {
        $user = Auth::guard('sanctum')->user();
        $cabangId = $this->siswaCabangId($user);
        $pendaftar = $this->siswaPendaftar($user);

        if (!$cabangId) {
            return response()->json(['items' => [], 'message' => 'Cabang tidak ditemukan']);
        }

        $items = Kontrak::with('cabang:id,nama_cabang')
            ->where('cabang_id', $cabangId)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($k) use ($pendaftar) {
                $myTtd = $pendaftar
                    ? \App\Models\KontrakTandaTangan::where('kontrak_id', $k->id)
                        ->where('pendaftar_id', $pendaftar->id)
                        ->first()
                    : null;

                return [
                    'id' => $k->id,
                    'judul' => $k->judul,
                    'cabang_nama' => $k->cabang?->nama_cabang,
                    'file_kontrak' => $k->file_kontrak,
                    'keterangan' => $k->keterangan,
                    'created_at' => $k->created_at,
                    'my_ttd' => $myTtd ? [
                        'file_ttd' => $myTtd->file_ttd,
                        'uploaded_at' => $myTtd->created_at,
                    ] : null,
                ];
            });

        return response()->json(['items' => $items]);
    }

    public function uploadTandaTangan(Request $request, $id)
    {
        $user = Auth::guard('sanctum')->user();
        $cabangId = $this->siswaCabangId($user);
        $pendaftar = $this->siswaPendaftar($user);

        if (!$pendaftar) {
            return response()->json(['message' => 'Data pendaftar tidak ditemukan'], 404);
        }

        $kontrak = Kontrak::where('id', $id)
            ->when($cabangId, fn($q) => $q->where('cabang_id', $cabangId))
            ->firstOrFail();

        $validated = $request->validate([
            'file' => 'required|file|mimes:pdf,jpg,jpeg,png|max:10240',
        ]);

        $existing = \App\Models\KontrakTandaTangan::where('kontrak_id', $kontrak->id)
            ->where('pendaftar_id', $pendaftar->id)
            ->first();

        if ($existing) {
            Storage::disk('public')->delete($existing->file_ttd);
        }

        $path = $request->file('file')->store('kontrak/ttd', 'public');

        KontrakTandaTangan::updateOrCreate(
            ['kontrak_id' => $kontrak->id, 'pendaftar_id' => $pendaftar->id],
            ['file_ttd' => $path]
        );

        return response()->json(['message' => 'Kontrak berhasil diunggah']);
    }
}
