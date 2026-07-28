<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LoginLog;
use Illuminate\Http\Request;

class LoginLogController extends Controller
{
    public function index(Request $request)
    {
        $query = LoginLog::with('user');

        if ($search = $request->search) {
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            })->orWhere('ip_address', 'like', "%{$search}%")
              ->orWhere('browser', 'like', "%{$search}%")
              ->orWhere('platform', 'like', "%{$search}%");
        }

        return response()->json(
            $query->orderBy('login_at', 'desc')
                  ->paginate($request->per_page ?? 50)
        );
    }
}
