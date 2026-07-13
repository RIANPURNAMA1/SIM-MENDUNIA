<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function userKaryawan()
    {
        $users = User::all();
        return view('user.index', compact('users'));
    }

    public function apiIndex(Request $request)
    {
        $query = User::with('divisi');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('nip', 'like', "%{$search}%");
            });
        }

        if ($request->filled('role')) {
            $roles = explode(',', $request->role);
            $query->whereIn('role', $roles);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $perPage = $request->per_page ?? 50;
        $users = $query->latest()->paginate($perPage);

        return response()->json([
            'status' => 'success',
            'data' => $users->items(),
            'pagination' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'total' => $users->total(),
                'per_page' => $users->perPage(),
            ],
        ]);
    }



    // Hapus user dengan validasi role
    public function destroy($id)
    {
        $user = User::findOrFail($id);

        // Cek role
        if (in_array(strtoupper($user->role), ['MANAGER', 'HR'])) {
            return response()->json([
                'success' => false,
                'message' => 'User dengan role MANAGER atau HR tidak bisa dihapus!'
            ], 403); // 403 Forbidden
        }

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'User berhasil dihapus.'
        ]);
    }


    public function index()
    {
        // Hanya ambil HR dan MANAGER
        $admins = User::whereIn('role', ['HR', 'MANAGER'])->get();
        return view('pengaturan.user.index', compact('admins'));
    }
    

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6',
            'role' => 'required|in:HR,MANAGER',
            'status' => 'required'
        ]);

        User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'status' => $request->status,
        ]);

        return back()->with('success', 'Akun admin berhasil ditambahkan');
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);
        
        $request->validate([
            'name' => 'required',
            'email' => 'required|email|unique:users,email,'.$id,
            'role' => 'required|in:HR,MANAGER',
            'status' => 'required'
        ]);

        $user->name = $request->name;
        $user->email = $request->email;
        $user->role = $request->role;
        $user->status = $request->status;

        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
        }

        $user->save();
        return back()->with('success', 'Data akun berhasil diperbarui');
    }

    public function destroyAdmin($id)
    {
        $user = User::findOrFail($id);
        $user->delete();
        return response()->json(['status' => 'success']);
    }

    public function apiStore(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6',
            'role' => 'required|in:HR,MANAGER,KARYAWAN,GURU,ADMIN_CABANG',
            'status' => 'required|in:AKTIF,NONAKTIF',
            'cabang_ids' => 'nullable|array',
            'cabang_ids.*' => 'integer|exists:cabangs,id',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'status' => $request->status,
            'cabang_ids' => $request->cabang_ids ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Akun berhasil ditambahkan',
            'data' => $user,
        ]);
    }

    public function apiUpdate(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,'.$id,
            'role' => 'required|in:HR,MANAGER,KARYAWAN,GURU,ADMIN_CABANG',
            'status' => 'required|in:AKTIF,NONAKTIF',
            'password' => 'nullable|min:6',
            'cabang_ids' => 'nullable|array',
            'cabang_ids.*' => 'integer|exists:cabangs,id',
        ]);

        $user->name = $request->name;
        $user->email = $request->email;
        $user->role = $request->role;
        $user->status = $request->status;

        if ($request->has('cabang_ids')) {
            $user->cabang_ids = $request->cabang_ids;
        }

        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
        }

        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Akun berhasil diperbarui',
            'data' => $user,
        ]);
    }


    
}
