<?php

namespace App\Http\Controllers;

use App\Models\NotificationTemplate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class NotificationTemplateController extends Controller
{
    public function index()
    {
        return NotificationTemplate::orderBy('name')->get();
    }

    public function show($key)
    {
        $template = NotificationTemplate::where('key', $key)->firstOrFail();
        return $template;
    }

    public function update(Request $request, $id)
    {
        $template = NotificationTemplate::findOrFail($id);

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'channel' => 'sometimes|string|in:email,whatsapp,both',
            'subject' => 'nullable|string|max:255',
            'body' => 'sometimes|string',
            'is_active' => 'sometimes|boolean',
        ]);

        $template->update($data);

        Log::info('Notification template updated', ['key' => $template->key, 'by' => auth()->id()]);

        return response()->json([
            'message' => 'Template notifikasi berhasil diperbarui',
            'data' => $template->fresh(),
        ]);
    }

    public function reset($id)
    {
        $template = NotificationTemplate::findOrFail($id);
        $default = self::getDefaultTemplates()[$template->key] ?? null;
        if (!$default) {
            return response()->json(['message' => 'Default template tidak ditemukan'], 404);
        }
        $template->update([
            'subject' => $default['subject'],
            'body' => $default['body'],
        ]);
        return response()->json([
            'message' => 'Template berhasil direset ke default',
            'data' => $template->fresh(),
        ]);
    }

    public function destroy($id)
    {
        $template = NotificationTemplate::findOrFail($id);
        $key = $template->key;
        $template->delete();

        Log::info('Notification template deleted', ['key' => $key, 'by' => auth()->id()]);

        return response()->json(['message' => 'Template notifikasi berhasil dihapus']);
    }

    public static function getDefaultTemplates(): array
    {
        return [
            'welcome_email' => [
                'name' => 'Email Selamat Datang',
                'description' => 'Dikirim saat pendaftaran berhasil',
                'channel' => 'email',
                'subject' => '[SIM Mendunia] Pendaftaran Berhasil - {nama}',
                'variables' => ['nama', 'program', 'batch', 'no_registrasi', 'no_invoice', 'total', 'total_transfer', 'kode_unik', 'payment_code', 'jatuh_tempo', 'company_name', 'bank_nama', 'bank_rekening', 'bank_pemilik', 'konfirmasi_url', 'invoice_url', 'tanggal_daftar'],
                'body' => "Halo, {nama}!\n\nSelamat! Pendaftaran Anda di {company_name} berhasil.\n\nINVOICE\nNo. Invoice: {no_invoice}\nNo. Registrasi: {no_registrasi}\nTanggal Daftar: {tanggal_daftar}\nStatus: Menunggu Pembayaran\n\nDETAIL PROGRAM\nProgram: {program}\nBatch: {batch}\nTotal: Rp {total}\n\nBATAS PEMBAYARAN\nJatuh Tempo {jatuh_tempo}\n\nKODE PEMBAYARAN\n{payment_code}\n\nTRANSFER KE\n{bank_nama} a.n {bank_pemilik}\nNo. Rekening: {bank_rekening}\n\nTotal yang harus ditransfer: Rp {total_transfer}\n\nPembayaran yang berhasil akan diverifikasi kurang dari 15 menit dan paling lambat 1×24 jam setelah bukti pembayaran diterima.\n\nSelesaikan Pembayaran: {konfirmasi_url}\nLihat Invoice Detail: {invoice_url}\n\nEmail ini dikirim otomatis oleh {company_name}.",
            ],
            'status_approved' => [
                'name' => 'Pendaftaran Disetujui',
                'description' => 'Dikirim saat admin menyetujui pendaftaran',
                'channel' => 'email',
                'subject' => '[SIM Mendunia] Pendaftaran Disetujui - {nama}',
                'variables' => ['nama', 'program', 'no_registrasi', 'status', 'waktu', 'company_name', 'login_url'],
                'body' => "Status pendaftaran Anda telah diperbarui.\n\nProgram: {program}\nNo. Registrasi: {no_registrasi}\nWaktu: {waktu}\n\nPendaftaran Anda telah disetujui. Selamat! Anda sekarang dapat mengakses layanan kami.\n\nLogin: {login_url}",
            ],
            'status_rejected' => [
                'name' => 'Pendaftaran Ditolak',
                'description' => 'Dikirim saat admin menolak pendaftaran',
                'channel' => 'email',
                'subject' => '[SIM Mendunia] Pendaftaran Ditolak - {nama}',
                'variables' => ['nama', 'program', 'no_registrasi', 'status', 'waktu', 'company_name', 'login_url'],
                'body' => "Status pendaftaran Anda telah diperbarui.\n\nProgram: {program}\nNo. Registrasi: {no_registrasi}\nWaktu: {waktu}\n\nMaaf, pendaftaran Anda ditolak. Silakan hubungi admin untuk informasi lebih lanjut.",
            ],
            'status_pending' => [
                'name' => 'Menunggu Verifikasi',
                'description' => 'Dikirim saat status pendaftaran diubah menjadi pending',
                'channel' => 'email',
                'subject' => '[SIM Mendunia] Status Pendaftaran Diubah - {nama}',
                'variables' => ['nama', 'program', 'no_registrasi', 'status', 'waktu', 'company_name', 'login_url'],
                'body' => "Status pendaftaran Anda telah diperbarui.\n\nProgram: {program}\nNo. Registrasi: {no_registrasi}\nWaktu: {waktu}\n\nPendaftaran Anda sedang dalam proses verifikasi. Kami akan memberitahu Anda begitu ada perkembangan.",
            ],
            'payment_verified' => [
                'name' => 'Pembayaran Dikonfirmasi',
                'description' => 'Dikirim saat pembayaran berhasil dikonfirmasi',
                'channel' => 'email',
                'subject' => '[SIM Mendunia] Pembayaran Berhasil - {nama}',
                'variables' => ['nama', 'program', 'no_registrasi', 'status', 'waktu', 'company_name', 'login_url'],
                'body' => "Status pembayaran Anda telah diperbarui.\n\nProgram: {program}\nNo. Registrasi: {no_registrasi}\nWaktu: {waktu}\n\nPembayaran Anda telah berhasil dikonfirmasi. Terima kasih!\n\nLogin: {login_url}",
            ],
            'payment_rejected' => [
                'name' => 'Pembayaran Ditolak',
                'description' => 'Dikirim saat pembayaran ditolak',
                'channel' => 'email',
                'subject' => '[SIM Mendunia] Pembayaran Ditolak - {nama}',
                'variables' => ['nama', 'program', 'no_registrasi', 'status', 'waktu', 'company_name', 'login_url'],
                'body' => "Status pembayaran Anda telah diperbarui.\n\nProgram: {program}\nNo. Registrasi: {no_registrasi}\nWaktu: {waktu}\n\nMaaf, pembayaran Anda ditolak. Silakan hubungi admin untuk informasi lebih lanjut.",
            ],
            'payment_unpaid' => [
                'name' => 'Menunggu Pembayaran',
                'description' => 'Dikirim saat status pembayaran diubah menjadi unpaid',
                'channel' => 'email',
                'subject' => '[SIM Mendunia] Menunggu Pembayaran - {nama}',
                'variables' => ['nama', 'program', 'no_registrasi', 'status', 'waktu', 'company_name', 'login_url'],
                'body' => "Status pembayaran Anda telah diperbarui.\n\nProgram: {program}\nNo. Registrasi: {no_registrasi}\nWaktu: {waktu}\n\nKami menunggu konfirmasi pembayaran Anda. Silakan lakukan pembayaran sesuai nominal yang tertera.",
            ],
            'payment_pending' => [
                'name' => 'Pembayaran Diproses',
                'description' => 'Dikirim saat pembayaran dalam proses',
                'channel' => 'email',
                'subject' => '[SIM Mendunia] Pembayaran Diproses - {nama}',
                'variables' => ['nama', 'program', 'no_registrasi', 'status', 'waktu', 'company_name', 'login_url'],
                'body' => "Status pembayaran Anda telah diperbarui.\n\nProgram: {program}\nNo. Registrasi: {no_registrasi}\nWaktu: {waktu}\n\nPembayaran Anda sedang diproses oleh sistem.",
            ],
            'payment_processing' => [
                'name' => 'Pembayaran Diverifikasi',
                'description' => 'Dikirim saat pembayaran sedang diverifikasi',
                'channel' => 'email',
                'subject' => '[SIM Mendunia] Pembayaran Diverifikasi - {nama}',
                'variables' => ['nama', 'program', 'no_registrasi', 'status', 'waktu', 'company_name', 'login_url'],
                'body' => "Status pembayaran Anda telah diperbarui.\n\nProgram: {program}\nNo. Registrasi: {no_registrasi}\nWaktu: {waktu}\n\nPembayaran Anda sedang diverifikasi oleh admin.",
            ],
            'payment_refund' => [
                'name' => 'Refund',
                'description' => 'Dikirim saat pembayaran direfund',
                'channel' => 'email',
                'subject' => '[SIM Mendunia] Pembayaran Direfund - {nama}',
                'variables' => ['nama', 'program', 'no_registrasi', 'status', 'waktu', 'company_name', 'login_url'],
                'body' => "Status pembayaran Anda telah diperbarui.\n\nProgram: {program}\nNo. Registrasi: {no_registrasi}\nWaktu: {waktu}\n\nPembayaran Anda telah direfund. Silakan cek rekening Anda untuk detail refund.",
            ],

            // ─── WhatsApp Templates ───
            'welcome_wa' => [
                'name' => 'WA Selamat Datang',
                'description' => 'Dikirim via WhatsApp saat pendaftaran berhasil',
                'channel' => 'whatsapp',
                'subject' => null,
                'variables' => ['nama', 'program', 'batch', 'no_registrasi', 'total_transfer', 'jatuh_tempo', 'company_name', 'bank_nama', 'bank_rekening', 'bank_pemilik', 'konfirmasi_url'],
                'body' => "Halo *{nama}*! 👋\n\nPendaftaran kamu di *{company_name}* berhasil!\n\n📋 No. Registrasi: {no_registrasi}\n📚 Program: {program} ({batch})\n💰 Total Transfer: Rp {total_transfer}\n⏰ Jatuh Tempo: {jatuh_tempo}\n\n🏦 Transfer ke:\n{bank_nama} a.n {bank_pemilik}\nNo. Rekening: {bank_rekening}\n\n✅ Konfirmasi Pembayaran:\n{konfirmasi_url}\n\n*Email ini dikirim otomatis oleh {company_name}*",
            ],
            'admin_new_registration_wa' => [
                'name' => 'WA Pendaftar Baru (ke Admin)',
                'description' => 'Dikirim via WhatsApp ke admin saat ada pendaftaran baru',
                'channel' => 'whatsapp',
                'subject' => null,
                'variables' => ['nama', 'program', 'batch', 'no_registrasi', 'total_transfer', 'tanggal', 'no_hp', 'konfirmasi_url', 'invoice_url', 'company_name', 'label_affiliate'],
                'body' => "📋 *PENDAFTARAN BARU{label_affiliate}*\n\nHalo Admin,\n\nAda pendaftar baru di *{company_name}*.\n\n👤 Nama: {nama}\n📚 Program: {program} ({batch})\n🗂️ No. Registrasi: {no_registrasi}\n💰 Total Transfer: Rp {total_transfer}\n📱 No. WhatsApp: {no_hp}\n🕒 Waktu: {tanggal}\n\n🔗 Konfirmasi Pembayaran:\n{konfirmasi_url}\n🧾 Lihat Invoice:\n{invoice_url}\n\nSilakan cek panel admin untuk memproses pendaftaran ini.\n\n*{company_name}*",
            ],
            'status_approved_wa' => [
                'name' => 'WA Disetujui',
                'description' => 'Dikirim via WhatsApp saat pendaftaran disetujui',
                'channel' => 'whatsapp',
                'subject' => null,
                'variables' => ['nama', 'program', 'no_registrasi', 'company_name'],
                'body' => "Halo *{nama}*! 🎉\n\nSelamat! Pendaftaran kamu di *{company_name}* telah *DISETUJUI*!\n\n📋 No. Registrasi: {no_registrasi}\n📚 Program: {program}\n\nKamu sekarang dapat mengakses layanan kami. Terima kasih telah bergabung!\n\n*{company_name}*",
            ],
            'status_rejected_wa' => [
                'name' => 'WA Ditolak',
                'description' => 'Dikirim via WhatsApp saat pendaftaran ditolak',
                'channel' => 'whatsapp',
                'subject' => null,
                'variables' => ['nama', 'program', 'no_registrasi', 'company_name'],
                'body' => "Halo *{nama}*,\n\nMohon maaf, pendaftaran kamu di *{company_name}* untuk program *{program}* (No. Registrasi: {no_registrasi}) *tidak dapat disetujui*.\n\nSilakan hubungi admin untuk informasi lebih lanjut.\n\n*{company_name}*",
            ],
            'payment_verified_wa' => [
                'name' => 'WA Pembayaran Dikonfirmasi',
                'description' => 'Dikirim via WhatsApp saat pembayaran berhasil dikonfirmasi',
                'channel' => 'whatsapp',
                'subject' => null,
                'variables' => ['nama', 'program', 'no_registrasi', 'link_grup', 'company_name'],
                'body' => "Halo *{nama}*! ✅\n\nPembayaran kamu untuk *{program}* (No. Registrasi: {no_registrasi}) telah *BERHASIL DIKONFIRMASI*!\n\nTerima kasih! Kamu sekarang resmi terdaftar di *{company_name}*.\n\n{link_grup}\n\n*{company_name}*",
            ],
            'payment_rejected_wa' => [
                'name' => 'WA Pembayaran Ditolak',
                'description' => 'Dikirim via WhatsApp saat pembayaran ditolak',
                'channel' => 'whatsapp',
                'subject' => null,
                'variables' => ['nama', 'program', 'no_registrasi', 'company_name'],
                'body' => "Halo *{nama}*,\n\nMohon maaf, pembayaran kamu untuk *{program}* (No. Registrasi: {no_registrasi}) *tidak dapat diterima*.\n\nSilakan hubungi admin untuk informasi lebih lanjut.\n\n*{company_name}*",
            ],
            'payment_unpaid_wa' => [
                'name' => 'WA Menunggu Pembayaran',
                'description' => 'Dikirim via WhatsApp saat status unpaid',
                'channel' => 'whatsapp',
                'subject' => null,
                'variables' => ['nama', 'program', 'no_registrasi', 'total_transfer', 'jatuh_tempo', 'bank_nama', 'bank_rekening', 'bank_pemilik', 'konfirmasi_url', 'company_name'],
                'body' => "Halo *{nama}*! ⏰\n\nKami masih *menunggu pembayaran* kamu untuk *{program}* (No. Registrasi: {no_registrasi}).\n\n💰 Total Transfer: Rp {total_transfer}\n⏰ Jatuh Tempo: {jatuh_tempo}\n\n🏦 Transfer ke:\n{bank_nama} a.n {bank_pemilik}\nNo. Rekening: {bank_rekening}\n\n✅ Konfirmasi Sekarang:\n{konfirmasi_url}\n\n*{company_name}*",
            ],
            'status_pending_wa' => [
                'name' => 'WA Menunggu Verifikasi',
                'description' => 'Dikirim via WhatsApp saat pendaftaran menunggu verifikasi',
                'channel' => 'whatsapp',
                'subject' => null,
                'variables' => ['nama', 'program', 'no_registrasi', 'status', 'waktu', 'company_name'],
                'body' => "Halo *{nama}*,\n\nPendaftaran kamu di *{company_name}* untuk program *{program}* (No. Registrasi: {no_registrasi}) sedang *menunggu verifikasi*.\n\nStatus saat ini: *{status}*\nKami akan mengabari kamu begitu ada perkembangan. Terima kasih!\n\n*{company_name}*",
            ],
            'payment_processing_wa' => [
                'name' => 'WA Pembayaran Diverifikasi',
                'description' => 'Dikirim via WhatsApp saat pembayaran sedang diverifikasi',
                'channel' => 'whatsapp',
                'subject' => null,
                'variables' => ['nama', 'program', 'no_registrasi', 'status', 'waktu', 'company_name'],
                'body' => "Halo *{nama}*! ⏳\n\nBukti pembayaran kamu untuk *{program}* (No. Registrasi: {no_registrasi}) sedang *diverifikasi*.\n\nStatus saat ini: *{status}*\nMohon tunggu, kami akan konfirmasi segera setelah pembayaran terverifikasi.\n\n*{company_name}*",
            ],
            'payment_new_wa' => [
                'name' => 'WA Pembayaran Baru (ke Admin Mutasi)',
                'description' => 'Dikirim via WhatsApp ke admin saat kandidat mengirim konfirmasi pembayaran',
                'channel' => 'whatsapp',
                'subject' => null,
                'variables' => ['tanggal', 'nama', 'no_registrasi', 'batch', 'kategori', 'jumlah', 'bukti_link', 'bukti_section', 'company_name'],
                'body' => "💰 *NOTIFIKASI PEMBAYARAN BARU*\n\nTanggal: {tanggal}\nNama: {nama}\nNo. Registrasi: {no_registrasi}\nBatch: {batch}\nKategori: {kategori}\nJumlah: {jumlah}\nStatus: Menunggu Verifikasi\n\n{bukti_section}Silakan verifikasi pembayaran ini di panel admin.\n\n- {company_name}",
            ],
        ];
    }
}
