@extends('app')

@section('content')
<div class="container-fluid px-4 py-4">
    <div class="d-flex align-items-center justify-content-between mb-4">
        <div>
            <h5 class="mb-0" style="font-weight: 700; font-size: 16px;">Data User Karyawan</h5>
            <small class="text-muted">Daftar akun login seluruh karyawan</small>
        </div>
        <div>
            <button id="downloadPdf" class="btn btn-outline-secondary btn-sm">
                <i class="ph ph-file-pdf me-1"></i> Download PDF
            </button>
        </div>
    </div>

    <div class="rounded-3">
        <div class="p-3 border-bottom" style="border-bottom-color: #f0f0f0 !important;">
            <div class="d-flex align-items-center justify-content-between">
                <span class="fw-semibold" style="font-size: 13px;"></span>
                <span class="text-muted" style="font-size: 11px;">{{ $users->where('role', 'KARYAWAN')->count() }} data</span>
            </div>
        </div>
        <div class="table-responsive">
            <table class="table table-hover text-nowrap mb-0">
                <thead>
                    <tr>
                        <th scope="col">Nama Karyawan</th>
                        <th scope="col">Email Login</th>
                        <th scope="col">Password (Default)</th>
                        <th scope="col" class="text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($users as $user)
                        @if($user->role == 'KARYAWAN')
                        <tr id="row-{{ $user->id }}">
                            <td>
                                <span class="fw-medium" style="font-size: 13px;">{{ $user->name }}</span>
                            </td>
                            <td class="text-muted">{{ $user->email }}</td>
                            <td>
                                <span class="badge bg-light-primary text-primary fw-normal px-2 py-1">
                                    <code style="font-size: 12px;">12345678</code>
                                </span>
                            </td>
                            <td class="text-center">
                                <div class="d-flex gap-1 justify-content-center">
                                    <a href="javascript:void(0)" class="btn btn-sm btn-outline-secondary border-0 deleteUser"
                                        data-id="{{ $user->id }}" title="Hapus User">
                                        <i class="ph ph-trash"></i>
                                    </a>
                                </div>
                            </td>
                        </tr>
                        @endif
                    @endforeach

                    @if ($users->where('role', 'KARYAWAN')->isEmpty())
                        <tr>
                            <td colspan="4" class="text-center text-muted py-4">
                                <i class="ph ph-users d-block fs-2 mb-2"></i>
                                Data user karyawan belum tersedia
                            </td>
                        </tr>
                    @endif
                </tbody>
            </table>
        </div>
    </div>
</div>

<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.6.0/jspdf.plugin.autotable.min.js"></script>

<script>
$(document).ready(function() {
    $('#downloadPdf').click(function() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');

        doc.setFontSize(18);
        doc.setTextColor(40);
        doc.text("Laporan Akun Karyawan", 14, 20);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text("Daftar email login dan password default karyawan.", 14, 27);
        doc.text("Dicetak pada: " + new Date().toLocaleString('id-ID'), 14, 33);

        doc.autoTable({
            html: '#userTable',
            startY: 40,
            columns: [
                { header: 'Nama Karyawan', dataKey: 0 },
                { header: 'Email Login', dataKey: 1 },
                { header: 'Password Default', dataKey: 2 },
            ],
            headStyles: { fillColor: [46, 204, 113], textColor: 255, fontStyle: 'bold' },
            bodyStyles: { textColor: 50 },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            margin: { top: 40 },
        });

        doc.save('Data_Akun_Karyawan_' + new Date().getTime() + '.pdf');
    });

    $(document).on('click', '.deleteUser', function() {
        const id = $(this).data('id');
        const row = $(this).closest('tr');

        Swal.fire({
            title: 'Hapus Akses Karyawan?',
            text: 'User ini tidak akan bisa login ke sistem lagi!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, Hapus Akun',
            cancelButtonText: 'Batal'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: '/daftar-user/delete/' + id,
                    type: 'DELETE',
                    data: { _token: '{{ csrf_token() }}' },
                    success: function(res) {
                        row.fadeOut(400, function() { row.remove(); });
                        Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Akun karyawan telah dihapus.', timer: 2000, showConfirmButton: false });
                    },
                    error: function(xhr) {
                        Swal.fire('Gagal!', 'Terjadi kesalahan saat menghapus data.', 'error');
                    }
                });
            }
        });
    });
});
</script>
@endsection
