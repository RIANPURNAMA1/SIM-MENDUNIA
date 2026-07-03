<?php

namespace App\Http\Controllers;

use App\Models\Projects;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class TaskController extends Controller
{

  public function index()
{
    $project = Projects::with(['lists.tasks.users'])->first();
    $users = User::all();

    return response()->json([
        'project' => $project,
        'available_users' => $users
    ]);
}

public function store(Request $request)
{
    $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
        'project_list_id'   => 'required|exists:project_lists,id',
        'judul_tugas'       => 'required|string|max:255',
        'prioritas'         => 'required|in:RENDAH,SEDANG,TINGGI,DARURAT',
        'user_ids'          => 'nullable|array',
    ]);

    if ($validator->fails()) {
        return response()->json(['errors' => $validator->errors()], 422);
    }

    $task = \App\Models\Task::create([
        'project_list_id'   => $request->project_list_id,
        'judul_tugas'       => $request->judul_tugas,
        'deskripsi_tugas'   => $request->deskripsi_tugas,
        'prioritas'         => $request->prioritas,
        'tgl_mulai_tugas'   => now(),
        'tgl_selesai_tugas' => $request->tgl_selesai_tugas,
        'urutan_kartu'      => \App\Models\Task::where('project_list_id', $request->project_list_id)->count() + 1,
        'is_selesai'        => false,
    ]);

    if ($request->has('user_ids')) {
        $task->users()->attach($request->user_ids);
    }

    return response()->json([
        'message' => 'Tugas berhasil dibuat!',
        'task' => $task->load('users')
    ], 201);
}
}
