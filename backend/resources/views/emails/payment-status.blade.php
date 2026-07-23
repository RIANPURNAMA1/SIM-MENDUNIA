<php
$statusColors = [
    'success' => '#22C55E',
    'rejected' => '#EF4444',
    'partial' => '#3B82F6',
    'full_payment' => '#10B981',
    'new_bill' => '#F59E0B',
];
$statusLabels = [
    'success' => 'Berhasil Diverifikasi',
    'rejected' => 'Ditolak',
    'partial' => 'Cicilan Diterima',
    'full_payment' => 'Lunas',
    'new_bill' => 'Tagihan Baru',
];
$color = $statusColors[$status] ?? '#6B7280';
$label = $statusLabels[$status] ?? ucfirst($status);
?>
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

                            <!-- Status Badge -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                                <tr>
                                    <td align="center">
                                        <span style="display:inline-block;background-color:{{ $color }}15;color:{{ $color }};padding:8px 20px;border-radius:20px;font-size:14px;font-weight:700;border:1px solid {{ $color }}30;">
                                            {{ $label }}
                                        </span>
                                    </td>
                                </tr>
                            </table>

                            <!-- Info Card -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:24px;">
                                <tr>
                                    <td style="padding:20px;">
                                        <p style="color:#334155;margin:0;font-size:14px;line-height:1.6;">{{ $keterangan }}</p>
                                    </td>
                                </tr>
                            </table>

                            <p style="color:#94a3b8;margin:0;font-size:12px;text-align:center;">
                                Jika ada pertanyaan, silakan hubungi admin.
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
