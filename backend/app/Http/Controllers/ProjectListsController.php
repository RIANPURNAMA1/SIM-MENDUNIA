<?php

namespace App\Http\Controllers;

use App\Models\project_lists;
use Illuminate\Http\Request;

class ProjectListsController extends Controller
{
 public function store(Request $request)
{
    $request->validate([
        'nama_list'  => 'required|string|max:50',
        'project_id' => 'required|exists:projects,id' 
    ]);

    $list = project_lists::create([
        'project_id' => $request->project_id,
        'nama_list'  => $request->nama_list,
        'urutan'     => project_lists::where('project_id', $request->project_id)->count() + 1,
    ]);

    return response()->json([
        'message' => 'Daftar berhasil ditambahkan!',
        'data' => $list
    ], 201);
}
}