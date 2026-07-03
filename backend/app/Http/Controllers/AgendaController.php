<?php

namespace App\Http\Controllers;

use App\Models\Agenda;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AgendaController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $today = now()->toDateString();

        // Ambil agenda hari ini berdasarkan user yang login
        $agendas = Agenda::where('user_id', Auth::id())
            ->where('tanggal', $today)
            ->where('status', 'terjadwal')
            ->orderBy('jam_mulai', 'asc')
            ->get();

        return view('absensi.agenda');
    }

    public function store(Request $request)
    {
        $today = now()->toDateString();

        $sudahAdaAgenda = Agenda::where('user_id', Auth::id())
            ->where('tanggal', $today)
            ->exists();

        if ($sudahAdaAgenda) {
            return response()->json([
                'success' => false,
                'message' => 'Anda sudah membuat agenda hari ini. Tidak dapat membuat agenda kedua.',
            ], 422);
        }

        $request->validate([
            'keterangan' => 'required|string|max:500',
            'jam_mulai' => 'nullable',
            'jam_selesai' => 'nullable',
        ]);

        $data = [
            'user_id' => Auth::id(),
            'judul' => 'Agenda Hari Ini',
            'keterangan' => $request->keterangan,
            'tanggal' => now()->toDateString(),
            'jam_mulai' => $request->jam_mulai,
            'jam_selesai' => $request->jam_selesai,
            'jam_absen_masuk' => now()->format('H:i:s'),
            'status' => 'terjadwal',
            'status_absen' => 'hadir',
        ];

        // Handle base64 image from mobile camera
        if ($request->foto && strpos($request->foto, 'data:image') === 0) {
            $imageData = $request->foto;

            // Extract base64 content
            preg_match('/data:image\/(\w+);base64,(.+)/', $imageData, $matches);
            $extension = $matches[1] ?? 'jpg';
            $imageData = $matches[2] ?? '';
            $image = base64_decode($imageData);

            $filename = time().'_agenda_'.Auth::id().'.'.$extension;
            $directory = public_path('uploads/agenda');

            if (! file_exists($directory)) {
                mkdir($directory, 0755, true);
            }

            file_put_contents($directory.'/'.$filename, $image);
            $data['foto'] = $filename;
        } elseif ($request->hasFile('foto')) {
            $foto = $request->file('foto');
            $filename = time().'_agenda_'.Auth::id().'.'.$foto->getClientOriginalExtension();
            $foto->move(public_path('uploads/agenda'), $filename);
            $data['foto'] = $filename;
        }

        $agenda = Agenda::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Agenda berhasil ditambahkan',
            'data' => $agenda,
        ]);
    }

    public function show($id)
    {
        $agenda = Agenda::where('id', $id)->where('user_id', Auth::id())->first();

        if (! $agenda) {
            return response()->json([
                'success' => false,
                'message' => 'Agenda tidak ditemukan',
            ], 404);
        }

        return response()->json($agenda);
    }

    public function update(Request $request, $id)
    {
        $agenda = Agenda::where('id', $id)->where('user_id', Auth::id())->first();

        if (! $agenda) {
            return response()->json([
                'success' => false,
                'message' => 'Agenda tidak ditemukan',
            ], 404);
        }

        $request->validate([
            'judul' => 'required|string|max:255',
            'keterangan' => 'nullable|string',
            'tanggal' => 'required|date',
            'jam_mulai' => 'nullable',
            'jam_selesai' => 'nullable',
            'foto' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
        ]);

        $updateData = $request->only(['judul', 'keterangan', 'tanggal', 'jam_mulai', 'jam_selesai']);

        if ($request->hasFile('foto')) {
            if ($agenda->foto && file_exists(public_path('uploads/agenda/'.$agenda->foto))) {
                unlink(public_path('uploads/agenda/'.$agenda->foto));
            }

            $foto = $request->file('foto');
            $filename = time().'_agenda_'.Auth::id().'.'.$foto->getClientOriginalExtension();
            $foto->move(public_path('uploads/agenda'), $filename);
            $updateData['foto'] = $filename;
        }

        $agenda->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'Agenda berhasil diupdate',
            'data' => $agenda,
        ]);
    }

    public function destroy($id)
    {
        $agenda = Agenda::where('id', $id)->where('user_id', Auth::id())->first();

        if (! $agenda) {
            return response()->json([
                'success' => false,
                'message' => 'Agenda tidak ditemukan',
            ], 404);
        }

        if ($agenda->foto && file_exists(storage_path('app/public/agenda/'.$agenda->foto))) {
            unlink(storage_path('app/public/agenda/'.$agenda->foto));
        }

        $agenda->delete();

        return response()->json([
            'success' => true,
            'message' => 'Agenda berhasil dihapus',
        ]);
    }

    public function complete($id)
    {
        $agenda = Agenda::where('id', $id)->where('user_id', Auth::id())->first();

        if (! $agenda) {
            return response()->json([
                'success' => false,
                'message' => 'Agenda tidak ditemukan',
            ], 404);
        }

        $agenda->update(['status' => 'selesai']);

        return response()->json([
            'success' => true,
            'message' => 'Agenda diselesaikan',
        ]);
    }

    public function getByDate(Request $request)
    {
        $tanggal = $request->tanggal ?? now()->toDateString();

        $agendas = Agenda::where('user_id', Auth::id())
            ->where('tanggal', $tanggal)
            ->where('status', 'terjadwal')
            ->orderBy('jam_mulai', 'asc')
            ->get();

        return response()->json($agendas);
    }

    public function absenMasuk(Request $request)
    {
        $agenda = Agenda::where('id', $request->id)->where('user_id', Auth::id())->first();

        if (! $agenda) {
            return response()->json(['success' => false, 'message' => 'Agenda tidak ditemukan'], 404);
        }

        $agenda->update([
            'jam_absen_masuk' => now()->format('H:i:s'),
            'status_absen' => 'hadir',
        ]);

        return response()->json(['success' => true, 'message' => 'Absen masuk agenda berhasil']);
    }

    public function absenPulang(Request $request)
    {
        $agenda = Agenda::where('id', $request->id)->where('user_id', Auth::id())->first();

        if (! $agenda) {
            return response()->json(['success' => false, 'message' => 'Agenda tidak ditemukan'], 404);
        }

        $agenda->update([
            'jam_absen_keluar' => now()->format('H:i:s'),
            'status' => 'selesai',
            'status_absen' => 'selesai',
        ]);

        return response()->json(['success' => true, 'message' => 'Absen pulang agenda berhasil']);
    }
}
