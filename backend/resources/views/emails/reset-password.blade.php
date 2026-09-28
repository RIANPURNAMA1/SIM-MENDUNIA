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
                    <tr>
                        <td style="background:linear-gradient(135deg,#0E6187 0%,#0a4a6a 100%);padding:32px 40px;text-align:center;">
                            <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;">{{ config('app.name') }}</h1>
                            <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:13px;">Reset Password</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:40px;">
                            <h2 style="color:#1a1a2e;margin:0 0 8px;font-size:20px;">Halo, {{ $nama }} 👋</h2>
                            <p style="color:#64748b;margin:0 0 24px;font-size:14px;line-height:1.6;">
                                Kami menerima permintaan untuk mereset password akun Anda. Klik tombol di bawah untuk membuat password baru.
                            </p>

                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                                <tr>
                                    <td align="center">
                                        <a href="{{ $resetUrl }}"
                                           style="display:inline-block;background:linear-gradient(135deg,#0E6187 0%,#0a4a6a 100%);color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:14px 40px;border-radius:8px;">
                                            Reset Password Saya
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="color:#94a3b8;margin:0 0 8px;font-size:12px;line-height:1.6;">
                                Jika tombol tidak bisa diklik, salin tautan berikut ke browser Anda:
                            </p>
                            <p style="margin:0 0 24px;font-size:12px;word-break:break-all;">
                                <a href="{{ $resetUrl }}" style="color:#0E6187;">{{ $resetUrl }}</a>
                            </p>

                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fffbeb;border:1px solid #fde68a;border-radius:10px;margin-bottom:24px;">
                                <tr>
                                    <td style="padding:16px 20px;">
                                        <p style="color:#92400e;margin:0;font-size:13px;line-height:1.6;">
                                            ⏰ Tautan ini hanya berlaku selama <strong>{{ $expireMinutes }} menit</strong>. Setelah itu kamu perlu meminta tautan baru.
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <p style="color:#64748b;margin:0 0 8px;font-size:14px;line-height:1.6;">
                                Jika kamu <strong>tidak</strong> meminta reset password, abaikan email ini. Password akun kamu tidak akan berubah.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
                            <p style="color:#94a3b8;margin:0;font-size:12px;">
                                © {{ date('Y') }} {{ config('app.name') }} — Email ini dikirim otomatis, mohon tidak membalas.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
