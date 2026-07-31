<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;padding:40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
                    <tr>
                        <td style="padding:36px 40px 12px;text-align:center;">
                            <img src="{{ $logoUrl ?? ($company->logo_url ?? '') }}" alt="{{ $company->company_name ?? 'MENDUNIA.ID' }}"
                                 style="max-height:48px;margin-bottom:12px;">
                            <h1 style="color:#0f172a;margin:0;font-size:20px;font-weight:700;letter-spacing:-0.2px;">{{ $company->company_name ?? 'MENDUNIA.ID' }}</h1>
                            <p style="color:#64748b;margin:6px 0 0;font-size:13px;">Pembaruan Status Pendaftaran</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:24px 40px 40px;">
                            <h2 style="color:#0f172a;margin:0 0 20px;font-size:18px;font-weight:600;">Halo, {{ $nama }}!</h2>

                            <!-- Status Badge -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                                <tr>
                                    <td align="center">
                                        <span style="display:inline-block;background-color:{{ $badgeBg }};color:{{ $badgeColor }};padding:7px 20px;border-radius:20px;font-size:14px;font-weight:700;border:1px solid {{ $badgeBorder }};">
                                            {{ $statusLabel }}
                                        </span>
                                    </td>
                                </tr>
                            </table>

                            <!-- Body Content -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:24px;">
                                <tr>
                                    <td style="padding:20px;font-size:13px;color:#475569;line-height:1.7;">
                                        {!! nl2br(e($bodyContent)) !!}
                                    </td>
                                </tr>
                            </table>

                            @if($loginUrl)
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
                                <tr>
                                    <td align="center">
                                        <a href="{{ $loginUrl }}"
                                           style="display:inline-block;background-color:#0f172a;color:#ffffff;text-decoration:none;padding:13px 32px;border-radius:8px;font-size:14px;font-weight:600;">
                                            Login ke Akun
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            @endif
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color:#ffffff;border-top:1px solid #eef2f7;padding:24px 40px;text-align:center;">
                            <p style="color:#94a3b8;margin:0;font-size:11px;">
                                Email ini dikirim otomatis oleh {{ $company->company_name ?? 'MENDUNIA.ID' }}.<br>
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
