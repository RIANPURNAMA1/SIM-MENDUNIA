<?php

namespace App\Http\Controllers;

use App\Models\PaymentSetting;
use App\Models\BankAccount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PaymentController extends Controller
{
    // ==================== PAYMENT SETTINGS ====================

    public function settingsIndex()
    {
        $settings = PaymentSetting::all()->keyBy('key');
        return response()->json($settings);
    }

    public function settingsUpdate(Request $request)
    {
        $data = $request->validate([
            'manual_payment_enabled' => 'nullable|boolean',
            'unique_code_max' => 'nullable|integer|min:1',
            'unique_code_operation' => 'nullable|in:add,subtract',
        ]);

        $mapping = [
            'manual_payment_enabled' => 'manual_payment_enabled',
            'unique_code_max' => 'unique_code_max',
            'unique_code_operation' => 'unique_code_operation',
        ];

        foreach ($mapping as $bodyKey => $dbKey) {
            if (array_key_exists($bodyKey, $data)) {
                $setting = PaymentSetting::where('key', $dbKey)->first();
                if ($setting) {
                    if ($bodyKey === 'manual_payment_enabled') {
                        $setting->is_enabled = (bool) $data[$bodyKey];
                    } else {
                        $setting->value = (string) $data[$bodyKey];
                    }
                    $setting->save();
                }
            }
        }

        return response()->json(['message' => 'Pengaturan pembayaran berhasil disimpan']);
    }

    // ==================== BANK ACCOUNTS ====================

    public function bankAccountIndex()
    {
        $accounts = BankAccount::orderBy('created_at', 'desc')->get();
        return response()->json($accounts);
    }

    public function bankAccountStore(Request $request)
    {
        $validated = $request->validate([
            'bank_name' => 'required|string|max:100',
            'account_holder' => 'required|string|max:200',
            'account_number' => 'required|string|max:50',
            'branch' => 'nullable|string|max:100',
            'additional_info' => 'nullable|string',
            'is_active' => 'nullable|boolean',
            'bank_logo' => 'nullable|file|mimes:jpg,jpeg,png|max:2048',
        ]);

        if ($request->hasFile('bank_logo')) {
            $validated['bank_logo'] = $request->file('bank_logo')->store('bank_logos', 'public');
        }

        $validated['is_active'] = $validated['is_active'] ?? true;

        $account = BankAccount::create($validated);

        return response()->json(['message' => 'Rekening bank berhasil ditambahkan', 'data' => $account]);
    }

    public function bankAccountUpdate(Request $request, $id)
    {
        $account = BankAccount::findOrFail($id);

        $validated = $request->validate([
            'bank_name' => 'nullable|string|max:100',
            'account_holder' => 'nullable|string|max:200',
            'account_number' => 'nullable|string|max:50',
            'branch' => 'nullable|string|max:100',
            'additional_info' => 'nullable|string',
            'is_active' => 'nullable|boolean',
            'bank_logo' => 'nullable|file|mimes:jpg,jpeg,png|max:2048',
        ]);

        if ($request->hasFile('bank_logo')) {
            if ($account->bank_logo) {
                Storage::disk('public')->delete($account->bank_logo);
            }
            $validated['bank_logo'] = $request->file('bank_logo')->store('bank_logos', 'public');
        }

        $account->update($validated);

        return response()->json(['message' => 'Rekening bank berhasil diperbarui', 'data' => $account]);
    }

    public function bankAccountDestroy($id)
    {
        $account = BankAccount::findOrFail($id);

        if ($account->bank_logo) {
            Storage::disk('public')->delete($account->bank_logo);
        }

        $account->delete();

        return response()->json(['message' => 'Rekening bank berhasil dihapus']);
    }

    // Public endpoint for candidates to see active bank accounts
    public function bankAccountsPublic()
    {
        $accounts = BankAccount::active()->get();
        return response()->json($accounts);
    }

    // Public endpoint for registration forms to show unique code info
    public function paymentSettingsPublic()
    {
        return response()->json([
            'manual_payment_enabled' => PaymentSetting::isEnabled('manual_payment_enabled'),
            'unique_code_max' => PaymentSetting::getUniqueCodeMax(),
            'unique_code_operation' => PaymentSetting::getUniqueCodeOperation(),
        ]);
    }
}
