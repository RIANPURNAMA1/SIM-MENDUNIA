<?php

namespace App\Http\Controllers;

use App\Models\NotificationSetting;
use Illuminate\Http\Request;

class PengaturanController extends Controller
{
    public function index()
    {
        $settings = NotificationSetting::all();
        return view('pengaturan.index', compact('settings'));
    }

    public function update(Request $request)
    {
        $request->validate([
            'settings' => 'array',
        ]);

        $submittedSettings = $request->settings ?? [];

        foreach (NotificationSetting::all() as $setting) {
            NotificationSetting::where('key', $setting->key)->update([
                'is_enabled' => isset($submittedSettings[$setting->key]),
            ]);
        }

        return redirect()->back()->with('success', 'Pengaturan notifikasi berhasil diperbarui.');
    }

    public function apiIndex()
    {
        $settings = NotificationSetting::all();
        return response()->json([
            'success' => true,
            'data' => $settings,
        ]);
    }

    public function apiUpdate(Request $request)
    {
        $request->validate([
            'settings' => 'required|array',
        ]);

        foreach ($request->settings as $key => $value) {
            if (is_array($value) && array_key_exists('is_enabled', $value)) {
                // Support both { is_enabled: true/false } and { is_enabled: true/false, value: '...' }
                NotificationSetting::where('key', $key)->update([
                    'is_enabled' => filter_var($value['is_enabled'], FILTER_VALIDATE_BOOLEAN),
                    'value' => $value['value'] ?? null,
                ]);
            } else {
                // Legacy: just boolean
                NotificationSetting::where('key', $key)->update([
                    'is_enabled' => filter_var($value, FILTER_VALIDATE_BOOLEAN),
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Pengaturan notifikasi berhasil diperbarui.',
        ]);
    }
}
