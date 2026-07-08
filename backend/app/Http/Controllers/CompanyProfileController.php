<?php

namespace App\Http\Controllers;

use App\Models\CompanyProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CompanyProfileController extends Controller
{
    public function show()
    {
        $profile = CompanyProfile::getProfile();
        return response()->json([
            'success' => true,
            'data' => $profile,
        ]);
    }

    public function update(Request $request)
    {
        $profile = CompanyProfile::getProfile();

        $request->validate([
            'company_name' => 'required|string|max:255',
            'pt_name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:255',
            'logo' => 'nullable|file|mimes:jpg,jpeg,png,webp,svg|max:2048',
        ]);

        $data = $request->only(['company_name', 'pt_name', 'address', 'email', 'phone']);

        if ($request->hasFile('logo')) {
            if ($profile->logo) {
                Storage::disk('public')->delete($profile->logo);
            }
            $data['logo'] = $request->file('logo')->store('logo', 'public');
        }

        $profile->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Profil perusahaan berhasil diperbarui',
            'data' => $profile->fresh(),
        ]);
    }
}
