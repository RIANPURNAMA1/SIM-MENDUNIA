<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice Pendaftaran</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f7fa;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fa;padding:30px 16px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.06);">
                    <!-- Header -->
                    <tr>
                        <td style="background:linear-gradient(135deg,#0E6187 0%,#0a4a6a 100%);padding:28px 32px;text-align:center;">
                            @if($company->logo_url)
                                <img src="{{ $company->logo_url }}" alt="{{ $company->company_name }}" style="max-height:44px;margin-bottom:6px;">
                            @endif
                            <h1 style="color:#ffffff;margin:0;font-size:20px;font-weight:800;letter-spacing:1px;">{{ $company->company_name ?? 'MENDUNIA.ID' }}</h1>
                            <p style="color:rgba(255,255,255,0.75);margin:4px 0 0;font-size:12px;">Invoice Pendaftaran</p>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding:28px 32px;">
                            {!! nl2br(e($bodyContent)) !!}
                        </td>
                    </tr>

                    <!-- CTA -->
                    <tr>
                        <td style="padding:0 32px 28px;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
                                <tr>
                                    <td align="center">
                                        <a href="{{ $konfirmasiUrl }}"
                                           style="display:inline-block;background:linear-gradient(135deg,#0E6187 0%,#0a4a6a 100%);color:#ffffff;text-decoration:none;padding:13px 36px;border-radius:8px;font-size:14px;font-weight:700;">
                                            Selesaikan Pembayaran
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center">
                                        <a href="{{ $invoiceUrl }}"
                                           style="color:#0E6187;text-decoration:underline;font-size:12px;">
                                            Lihat Invoice Detail &rarr;
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 32px;text-align:center;">
                            <p style="color:#94a3b8;margin:0 0 2px;font-size:10px;">
                                Email ini dikirim otomatis oleh {{ $company->company_name ?? 'MENDUNIA.ID' }}.
                            </p>
                            @if($company->address)
                            <p style="color:#94a3b8;margin:0;font-size:10px;">{{ $company->address }}</p>
                            @endif
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
