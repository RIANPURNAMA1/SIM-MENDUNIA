<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
    @page { margin: 1cm; }
    body { font-family: Arial, sans-serif; font-size: 11px; }
    table { border-collapse: collapse; width: 100%; }
    th { background-color: #4472C4; color: #fff; font-weight: bold; font-size: 10px; padding: 6px 5px; border: 1px solid #000; text-align: center; }
    td { border: 1px solid #000; padding: 5px; }
    .title { font-size: 16px; font-weight: bold; margin-bottom: 4px; }
    .subtitle { font-size: 11px; color: #555; margin-bottom: 16px; }
    @media print { .no-print { display: none; } }
</style>
</head>
<body>
    <div class="title">Rekapitulasi Absensi Siswa</div>
    <div class="subtitle">Periode: {{ \Carbon\Carbon::parse($start_date)->format('d/m/Y') }} s/d {{ \Carbon\Carbon::parse($end_date)->format('d/m/Y') }}</div>
    <table>
        <thead>
            <tr>
                <th style="width:35px">No</th>
                <th style="text-align:left">Nama</th>
                <th>Kelas</th>
                <th>HADIR</th>
                <th>TERLAMBAT</th>
                <th>IZIN</th>
                <th>SAKIT</th>
                <th>ALPA</th>
                <th>Total Hadir</th>
                <th>%</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            {!! $rows !!}
        </tbody>
    </table>
    <div class="no-print" style="margin-top:20px;text-align:center;">
        <button onclick="window.print()" style="padding:8px 24px;font-size:14px;">Cetak / Simpan PDF</button>
    </div>
    <script>window.print();</script>
</body>
</html>
