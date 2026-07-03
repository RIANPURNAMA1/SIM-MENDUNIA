@extends('app')

@section('content')
<div class="container-fluid px-4 py-4">
    @if (session('success'))
        <div class="alert alert-success alert-dismissible fade show py-2" role="alert">
            {{ session('success') }}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    @endif

    <div class="d-flex align-items-center justify-content-between mb-4">
        <div>
            <h5 class="mb-0" style="font-weight: 700; font-size: 16px;">Data Cabang</h5>
            <small class="text-muted">Master data seluruh cabang dan lokasi kantor</small>
        </div>
        <div>
            <button class="btn btn-success btn-sm" data-bs-toggle="modal" data-bs-target="#modalTambahCabang">
                <i class="ph ph-plus-circle me-1"></i> Tambah Cabang
            </button>
        </div>
    </div>

    <div class="rounded-3">
        <div class="p-3 border-bottom" style="border-bottom-color: #f0f0f0 !important;">
            <div class="d-flex align-items-center justify-content-between">
                <span class="fw-semibold" style="font-size: 13px;"></span>
                <span class="text-muted" style="font-size: 11px;">{{ $cabangs->count() }} data</span>
            </div>
        </div>
        <div class="table-responsive">
            <table class="table table-hover text-nowrap mb-0">
                <thead>
                    <tr>
                        <th scope="col" width="5%">No</th>
                        <th scope="col" width="10%">Kode</th>
                        <th scope="col">Nama</th>
                        <th scope="col">Pusat/Cabang</th>
                        <th scope="col">Lokasi (Lat, Long)</th>
                        <th scope="col" class="text-center">Barcode</th>
                        <th scope="col">Radius</th>
                        <th scope="col" width="15%" class="text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($cabangs as $c)
                        <tr>
                            <td>{{ $loop->iteration }}</td>
                            <td><span class="badge bg-light-primary text-primary fw-normal px-2 py-1">{{ $c->kode_cabang }}</span></td>
                            <td>
                                <span class="fw-medium" style="font-size: 13px;">{{ $c->nama_cabang }}</span><br>
                                <small class="text-muted">{{ Str::limit($c->alamat, 40) }}</small>
                            </td>
                            <td>
                                @if($c->status_pusat == 'PUSAT')
                                    <span class="badge bg-dark fw-normal px-2 py-1">PUSAT</span>
                                @else
                                    <span class="badge bg-light-secondary text-dark fw-normal px-2 py-1">CABANG</span>
                                @endif
                            </td>
                            <td><code class="text-muted" style="font-size: 11px;">{{ $c->latitude }}, {{ $c->longitude }}</code></td>
                            <td class="text-center">
                                @if($c->barcode)
                                <button class="btn btn-sm btn-outline-dark border-0" title="Lihat QR Code"
                                    onclick="lihatQR('{{ $c->barcode }}', '{{ $c->nama_cabang }}')">
                                    <i class="ph ph-qr-code fs-5"></i>
                                </button>
                                @else
                                <span class="text-muted">-</span>
                                @endif
                            </td>
                            <td><span class="text-muted" style="font-size: 12px;"><i class="ph ph-arrows-out-line me-1"></i>{{ $c->radius }} Meter</span></td>
                            <td class="text-center">
                                <div class="d-flex gap-1 justify-content-center">
                                    <a href="javascript:void(0)" class="btn btn-sm btn-outline-secondary border-0" title="Edit"
                                        onclick="editCabang('{{ $c->id }}', '{{ $c->kode_cabang }}', '{{ $c->nama_cabang }}', '{{ $c->status_pusat }}', '{{ $c->latitude }}', '{{ $c->longitude }}', '{{ $c->radius }}', '{{ $c->alamat }}')">
                                        <i class="ph ph-note-pencil"></i>
                                    </a>
                                    <a href="javascript:void(0)" class="btn btn-sm btn-outline-secondary border-0" title="Hapus"
                                        onclick="deleteCabang({{ $c->id }})">
                                        <i class="ph ph-trash"></i>
                                    </a>
                                </div>
                            </td>
                        </tr>
                    @endforeach

                    @if ($cabangs->isEmpty())
                        <tr>
                            <td colspan="8" class="text-center text-muted py-4">
                                <i class="ph ph-map-pin-slash d-block fs-2 mb-2"></i>
                                Data cabang belum tersedia
                            </td>
                        </tr>
                    @endif
                </tbody>
            </table>
        </div>
    </div>
</div>

@include('cabang.modal')

<!-- Modal QR Code -->
<div class="modal fade" id="modalQR" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-sm">
        <div class="modal-content border-0 shadow-lg" style="border-radius: 20px; overflow: hidden;">
            <div class="text-center px-4 pt-4 pb-3" style="background: linear-gradient(135deg, #0D1F3C 0%, #1a2d4a 100%);">
                <button type="button" class="btn-close btn-close-white position-absolute top-0 end-0 mt-3 me-3" data-bs-dismiss="modal"></button>
                <div class="flex items-center justify-center gap-1 mb-1">
                    <img src="{{ asset('assets/images/logo/logo-sm.png') }}"
                        alt="Mendunia.id"
                        style="width: 14px; height: 14px; object-fit: contain;"
                        onerror="this.style.display='none'">
                    <span class="text-white fw-semibold" style="font-size: 9px; letter-spacing: 2px; opacity:0.7;">MENDUNIA.ID</span>
                </div>
                <h5 class="text-white fw-bold mb-0" style="font-size: 16px;">QR Code Cabang</h5>
                <p class="text-white text-xs mb-0 mt-1" style="opacity:0.6;">Scan QR ini untuk absensi masuk</p>
            </div>
            <div class="text-center px-4 py-3">
                <div class="d-flex align-items-center justify-content-center gap-1 mb-1">
                    <i class="ph ph-map-pin text-primary" style="font-size: 12px;"></i>
                    <h6 id="qrNamaCabang" class="fw-semibold mb-0 text-dark" style="font-size: 13px;"></h6>
                </div>
                <div id="qrContainer" class="d-flex justify-content-center mb-2"></div>
                <p class="text-muted mb-2" style="font-size: 10px;">Barcode: <span id="qrBarcodeText" class="font-monospace text-dark fw-semibold" style="font-size: 10px;"></span></p>
                <button id="btnCetakQR" class="btn btn-dark px-4 py-1.5 shadow-sm rounded-pill" style="font-size: 12px;">
                    <i class="ph ph-printer me-1"></i> Cetak QR
                </button>
            </div>
        </div>
    </div>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

<script>
let qrCodeInstance = null;

function editCabang(id, kode, nama, status, lat, long, radius, alamat) {
    $('#edit_id').val(id);
    $('#edit_kode_cabang').val(kode);
    $('#edit_nama_cabang').val(nama);
    $('#edit_status_pusat').val(status);
    $('#edit_latitude').val(lat);
    $('#edit_longitude').val(long);
    $('#edit_radius').val(radius);
    $('#edit_alamat').val(alamat);
    $('#formEditCabang').attr('action', '/cabang/' + id);
    $('#modalEditCabang').modal('show');
}

function deleteCabang(id) {
    Swal.fire({
        title: 'Hapus cabang?',
        text: 'Data cabang dan jangkauan lokasinya akan dihapus',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Ya, Hapus',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: '/cabang/' + id,
                type: 'POST',
                data: { _token: '{{ csrf_token() }}', _method: 'DELETE' },
                success: function() {
                    Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Cabang berhasil dihapus', timer: 1500, showConfirmButton: false });
                    setTimeout(() => location.reload(), 1500);
                },
                error: function() {
                    Swal.fire({ icon: 'error', title: 'Gagal', text: 'Cabang gagal dihapus' });
                }
            });
        }
    });
}

function lihatQR(barcode, nama) {
    $('#qrNamaCabang').text(nama);
    $('#qrBarcodeText').text(barcode);

    if (qrCodeInstance) {
        qrCodeInstance.clear();
        document.getElementById('qrContainer').innerHTML = '';
    }

    qrCodeInstance = new QRCode(document.getElementById('qrContainer'), {
        text: barcode,
        width: 200,
        height: 200,
        colorDark: '#1e3c72',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
    });

    // Sembunyikan canvas, tampilkan hanya img
    setTimeout(function() {
        var c = document.querySelector('#qrContainer canvas');
        var i = document.querySelector('#qrContainer img');
        if (c) c.style.display = 'none';
        if (!i) {
            i = document.createElement('img');
            i.src = c.toDataURL('image/png');
            i.style.width = '200px';
            i.style.height = '200px';
            document.getElementById('qrContainer').appendChild(i);
        }
    }, 100);

    $('#modalQR').modal('show');
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('btnCetakQR').addEventListener('click', function() {
        var qrImg = document.querySelector('#qrContainer img');
        var nama = document.getElementById('qrNamaCabang').textContent;
        if (!qrImg) {
            var canvas = document.querySelector('#qrContainer canvas');
            if (!canvas) return;
            qrImg = document.createElement('img');
            qrImg.src = canvas.toDataURL('image/png');
        }

        var barcodeText = document.getElementById('qrBarcodeText').textContent;
        var win = window.open('', '_blank');
        win.document.write('<!DOCTYPE html><html><head><title>Cetak QR - ' + nama + '</title><style>' +
            '*{margin:0;padding:0;box-sizing:border-box;}' +
            'body{display:flex;justify-content:center;align-items:center;height:100vh;margin:0;flex-direction:column;font-family:Arial,sans-serif;background:#fff;}' +
            '.brand{display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:4px;}' +
            '.brand img{width:20px;height:20px;}' +
            '.brand span{font-weight:700;font-size:12px;color:#1e3c72;letter-spacing:0.5px;}' +
            'h3{margin:2px 0 2px;font-size:16px;color:#333;font-weight:600;}' +
            '.sub{color:#888;font-size:10px;margin-bottom:8px;}' +
            '.qr-wrap{display:flex;justify-content:center;}' +
            '.qr-wrap img{width:320px;height:320px;}' +
            '.barcode{color:#aaa;font-size:9px;margin-top:4px;font-family:monospace;}' +
            'p{color:#666;margin-top:4px;font-size:10px;}' +
            '@media print{body{margin:0;padding:10px;}}' +
            '</style></head><body>' +
            '<div class="brand"><img src="{{ asset('assets/images/logo/logo-sm.png') }}" alt="Mendunia.id" /><span>Mendunia.id</span></div>' +
            '<h3>' + nama + '</h3>' +
            '<p class="sub">Scan QR ini untuk absensi masuk</p>' +
            '<div class="qr-wrap"><img src="' + qrImg.src + '" /></div>' +
            '<p class="barcode">' + barcodeText + '</p>' +
            '<p style="margin-top:2px;">Scan QR Code &mdash; Absensi Siswa Mendunia.id</p>' +
            '<script>window.onload=function(){setTimeout(function(){window.print();window.close();},300)};<\/script>' +
            '</body></html>');
        win.document.close();
    });
});
</script>
@endsection
