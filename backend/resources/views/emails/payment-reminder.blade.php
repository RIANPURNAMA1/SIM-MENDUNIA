<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f7fa;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fa;padding:40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                    <!-- Header -->
                    <tr>
                        <td style="background:linear-gradient(135deg,#0E6187 0%,#0a4a6a 100%);padding:32px 40px;text-align:center;">
                            <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;">{{ $company->company_name ?? 'SIM Mendunia' }}</h1>
                            <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:13px;">Sistem Informasi Manajemen</p>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding:40px;">
                            <h2 style="color:#1a1a2e;margin:0 0 8px;font-size:20px;">Halo, {{ $nama }} 👋</h2>
                            <p style="color:#64748b;margin:0 0 24px;font-size:14px;">Ini pengingat untuk pembayaran Anda.</p>

                            <!-- Info Card -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;margin-bottom:24px;">
                                <tr>
                                    <td style="padding:20px;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="padding:6px 0;color:#64748b;font-size:13px;">Kategori</td>
                                                <td style="padding:6px 0;color:#0E6187;font-size:14px;font-weight:700;text-align:right;">{{ $kategori }}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding:6px 0;color:#64748b;font-size:13px;">Jumlah Tagihan</td>
                                                <td style="padding:6px 0;color:#dc2626;font-size:16px;font-weight:700;text-align:right;">{{ $jumlah }}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding:6px 0;color:#64748b;font-size:13px;">Batas Waktu</td>
                                                <td style="padding:6px 0;color:#f59e0b;font-size:14px;font-weight:700;text-align:right;">{{ $hariTersisa }}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                                <tr>
                                    <td align="center">
                                        <a href="{{ $link }}" style="display:inline-block;background-color:#22C55E;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:700;letter-spacing:0.5px;">
                                            Bayar Sekarang
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="color:#94a3b8;margin:0;font-size:12px;text-align:center;">
                                Jika tombol tidak berfungsi, salin link ini:<br>
                                <a href="{{ $link }}" style="color:#0E6187;">{{ $link }}</a>
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 40px;text-align:center;">
                            <p style="color:#94a3b8;margin:0;font-size:11px;">
                                Email ini dikirim otomatis oleh {{ $company->company_name ?? 'SIM Mendunia' }}.<br>
                                Mohon tidak membalas email ini.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
