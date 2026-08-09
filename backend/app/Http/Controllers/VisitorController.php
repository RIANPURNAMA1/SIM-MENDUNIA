<?php

namespace App\Http\Controllers;

use App\Models\Visit;
use Illuminate\Http\Request;

class VisitorController extends Controller
{
    public function stats()
    {
        $total = Visit::count();
        $today = Visit::whereDate('created_at', today())->count();
        $thisWeek = Visit::where('created_at', '>=', now()->startOfWeek())->count();
        $thisMonth = Visit::where('created_at', '>=', now()->startOfMonth())->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total' => $total,
                'today' => $today,
                'this_week' => $thisWeek,
                'this_month' => $thisMonth,
            ],
        ]);
    }

    public function record(Request $request)
    {
        $key = $request->input('visitor_key');

        if ($key) {
            $visit = Visit::firstOrCreate(['visitor_key' => $key], [
                'ip' => $request->ip(),
                'user_agent' => $request->header('User-Agent'),
            ]);

            return response()->json([
                'success' => true,
                'is_new' => $visit->wasRecentlyCreated,
                'total' => Visit::count(),
            ]);
        }

        Visit::create([
            'visitor_key' => null,
            'ip' => $request->ip(),
            'user_agent' => $request->header('User-Agent'),
        ]);

        return response()->json([
            'success' => true,
            'is_new' => true,
            'total' => Visit::count(),
        ]);
    }
}