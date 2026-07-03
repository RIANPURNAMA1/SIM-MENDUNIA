import { useState, useMemo } from 'react';
import { Search, CheckCircle, XCircle, FileText, Eye, Edit3, Trash2 } from 'lucide-react';

interface Pendaftar {
  id: string;
  nama: string;
  email: string;
  telepon: string;
  program: string;
  durasi: string;
  hargaProgram: number;
  tanggalDaftar: string;
  statusPendaftaran: 'Aktif' | 'Ditinjau' | 'Disetujui' | 'Ditolak';
  statusPembayaran: 'Belum Bayar' | 'Proses' | 'Terverifikasi';
  jumlahPembayaran: number;
  buktiPembayaran: string;
}

const dummyPendaftar: Pendaftar[] = [
  {
    id: 'P001',
    nama: 'Ahmad Rizkianto',
    email: 'ahmad.rizki@email.com',
    telepon: '081234567891',
    program: 'Program Software Developer Advanced',
    durasi: '6 Bulan',
    hargaProgram: 5000000,
    tanggalDaftar: '01 Feb 2026',
    statusPendaftaran: 'Ditinjau',
    statusPembayaran: 'Terverifikasi',
    jumlahPembayaran: 5000000,
    buktiPembayaran: 'P001_bukti.pdf'
  },
  {
    id: 'P002',
    nama: 'Siti Nurhaliza',
    email: 'siti.nur@email.com',
    telepon: '082345678912',
    program: 'Program Frontend Development',
    durasi: '4 Bulan',
    hargaProgram: 3500000,
    tanggalDaftar: '02 Feb 2026',
    statusPendaftaran: 'Aktif',
    statusPembayaran: 'Terverifikasi',
    jumlahPembayaran: 3500000,
    buktiPembayaran: 'P002_bukti.pdf'
  },
  {
    id: 'P003',
    nama: 'Budi Prasetyo',
    email: 'budi.pras@email.com',
    telepon: '083456789123',
    program: 'Program Backend Development Pro',
    durasi: '6 Bulan',
    hargaProgram: 5500000,
    tanggalDaftar: '03 Feb 2026',
    statusPendaftaran: 'Ditinjau',
    statusPembayaran: 'Proses',
    jumlahPembayaran: 5500000,
    buktiPembayaran: 'P003_bukti.pdf'
  },
  {
    id: 'P004',
    nama: 'Rina Wijaya',
    email: 'rina.wijaya@email.com',
    telepon: '084567890234',
    program: 'Program Full Stack JavaScript',
    durasi: '5 Bulan',
    hargaProgram: 4500000,
    tanggalDaftar: '04 Feb 2026',
    statusPendaftaran: 'Aktif',
    statusPembayaran: 'Belum Bayar',
    jumlahPembayaran: 0,
    buktiPembayaran: ''
  },
  {
    id: 'P005',
    nama: 'Doni Santoso',
    email: 'doni.sant@email.com',
    telepon: '085678901345',
    program: 'Program Frontend Development',
    durasi: '4 Bulan',
    hargaProgram: 3500000,
    tanggalDaftar: '05 Feb 2026',
    statusPendaftaran: 'Ditinjau',
    statusPembayaran: 'Terverifikasi',
    jumlahPembayaran: 3500000,
    buktiPembayaran: 'P005_bukti.pdf'
  },
  {
    id: 'P006',
    nama: 'Lina Kusuma',
    email: 'lina.kus@email.com',
    telepon: '086789012456',
    program: 'Program DevOps & Cloud Engineering',
    durasi: '6 Bulan',
    hargaProgram: 6000000,
    tanggalDaftar: '06 Feb 2026',
    statusPendaftaran: 'Disetujui',
    statusPembayaran: 'Terverifikasi',
    jumlahPembayaran: 6000000,
    buktiPembayaran: 'P006_bukti.pdf'
  },
  {
    id: 'P007',
    nama: 'Rendra Maulana',
    email: 'rendra.maul@email.com',
    telepon: '087890123567',
    program: 'Program QA Automation Testing',
    durasi: '3 Bulan',
    hargaProgram: 2500000,
    tanggalDaftar: '07 Feb 2026',
    statusPendaftaran: 'Aktif',
    statusPembayaran: 'Proses',
    jumlahPembayaran: 2500000,
    buktiPembayaran: 'P007_bukti.pdf'
  },
  {
    id: 'P008',
    nama: 'Maya Handoko',
    email: 'maya.hand@email.com',
    telepon: '088901234678',
    program: 'Program Software Developer Advanced',
    durasi: '6 Bulan',
    hargaProgram: 5000000,
    tanggalDaftar: '08 Feb 2026',
    statusPendaftaran: 'Ditolak',
    statusPembayaran: 'Terverifikasi',
    jumlahPembayaran: 5000000,
    buktiPembayaran: 'P008_bukti.pdf'
  },
  {
    id: 'P009',
    nama: 'Feri Gunawan',
    email: 'feri.gun@email.com',
    telepon: '089012345789',
    program: 'Program Digital Marketing Professional',
    durasi: '4 Bulan',
    hargaProgram: 3000000,
    tanggalDaftar: '09 Feb 2026',
    statusPendaftaran: 'Aktif',
    statusPembayaran: 'Belum Bayar',
    jumlahPembayaran: 0,
    buktiPembayaran: ''
  },
  {
    id: 'P010',
    nama: 'Eka Putri',
    email: 'eka.putr@email.com',
    telepon: '081122334455',
    program: 'Program Sales & Business Development',
    durasi: '3 Bulan',
    hargaProgram: 2800000,
    tanggalDaftar: '10 Feb 2026',
    statusPendaftaran: 'Disetujui',
    statusPembayaran: 'Terverifikasi',
    jumlahPembayaran: 2800000,
    buktiPembayaran: 'P010_bukti.pdf'
  }
];

function getStatusPendaftaranBadge(status: string) {
  const dotColor: Record<string, string> = {
    'Disetujui': 'bg-emerald-500',
    'Ditolak': 'bg-red-500',
    'Ditinjau': 'bg-blue-500',
    'Aktif': 'bg-amber-500',
  };

  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 shadow-sm">
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor[status] || 'bg-slate-300'}`} />
      {status}
    </span>
  );
}

function getStatusPembayaranBadge(status: string) {
  const dotColor: Record<string, string> = {
    'Terverifikasi': 'bg-emerald-500',
    'Proses': 'bg-blue-500',
    'Belum Bayar': 'bg-red-500',
  };

  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 shadow-sm">
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor[status] || 'bg-slate-300'}`} />
      {status}
    </span>
  );
}

export default function Pendaftar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('Semua');
  const [filterPembayaran, setFilterPembayaran] = useState<string>('Semua');
  const [pendaftarData, setPendaftarData] = useState<Pendaftar[]>(dummyPendaftar);

  const filteredPendaftar = useMemo(() => {
    return pendaftarData.filter((p) => {
      const matchSearch =
        p.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.program.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = filterStatus === 'Semua' || p.statusPendaftaran === filterStatus;
      const matchPembayaran = filterPembayaran === 'Semua' || p.statusPembayaran === filterPembayaran;
      return matchSearch && matchStatus && matchPembayaran;
    });
  }, [searchTerm, filterStatus, filterPembayaran, pendaftarData]);

  const handleApprove = (id: string) => {
    setPendaftarData(
      pendaftarData.map((p) =>
        p.id === id ? { ...p, statusPendaftaran: 'Disetujui' as const } : p
      )
    );
  };

  const handleReject = (id: string) => {
    setPendaftarData(
      pendaftarData.map((p) =>
        p.id === id ? { ...p, statusPendaftaran: 'Ditolak' as const } : p
      )
    );
  };

  const stats = {
    totalPendaftar: pendaftarData.length,
    aktif: pendaftarData.filter((p) => p.statusPendaftaran === 'Aktif').length,
    disetujui: pendaftarData.filter((p) => p.statusPendaftaran === 'Disetujui').length,
    ditolak: pendaftarData.filter((p) => p.statusPendaftaran === 'Ditolak').length,
    terverifikasi: pendaftarData.filter((p) => p.statusPembayaran === 'Terverifikasi').length,
  };

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 rounded-lg p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[0D1F3C] text-[0D1F3C] border border-blue-100">
            <CheckCircle size={20} className="text-slate-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">
              Data Pendaftar
            </h1>
            <p className="text-sm text-slate-500">
              Kelola data pendaftar, pembayaran, dan approval
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1">
            <CheckCircle size={16} />
            Tambah
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-4 rounded-lg p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Cari pendaftar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option>Semua</option>
            <option>Aktif</option>
            <option>Ditinjau</option>
            <option>Disetujui</option>
            <option>Ditolak</option>
          </select>

          <select
            value={filterPembayaran}
            onChange={(e) => setFilterPembayaran(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option>Semua</option>
            <option>Belum Bayar</option>
            <option>Proses</option>
            <option>Terverifikasi</option>
          </select>

          <button className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-800 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-1">
            <Search size={16} />
            Filter
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="relative overflow-x-auto">
        <div className="overflow-x-auto">
          <table className="w-full min-w-full border-collapse text-left text-sm text-slate-700">
            <thead className="text-sm text-slate-600">
              <tr>
                <th
                  scope="col"
                  className="border border-slate-200 px-4 py-3 font-medium"
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 bg-slate-100 focus:ring-2 focus:ring-blue-200"
                    />
                    <label className="sr-only">Table checkbox</label>
                  </div>
                </th>
                <th
                  scope="col"
                  className="border border-slate-200 px-4 py-3 font-medium"
                >
                  Pendaftar
                </th>
                <th
                  scope="col"
                  className="border border-slate-200 px-4 py-3 font-medium"
                >
                  Program
                </th>
                <th
                  scope="col"
                  className="border border-slate-200 px-4 py-3 font-medium"
                >
                  Durasi
                </th>
                <th
                  scope="col"
                  className="border border-slate-200 px-4 py-3 font-medium"
                >
                  Harga
                </th>
                <th
                  scope="col"
                  className="border border-slate-200 px-4 py-3 text-center font-medium"
                >
                  Status Pendaftaran
                </th>
                <th
                  scope="col"
                  className="border border-slate-200 px-4 py-3 text-center font-medium"
                >
                  Status Pembayaran
                </th>
                <th
                  scope="col"
                  className="border border-slate-200 px-4 py-3 text-center font-medium"
                >
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPendaftar.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="border border-slate-200 px-6 py-10 text-center"
                  >
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <CheckCircle size={24} />
                    </div>
                    <p className="mt-3 text-sm font-medium text-slate-600">
                      Tidak ada data pendaftar
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPendaftar.map((pendaftar) => (
                  <tr
                    key={pendaftar.id}
                    className="bg-white transition hover:bg-slate-50"
                  >
                    <td className="w-4 border border-slate-200 px-4 py-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 bg-slate-100 focus:ring-2 focus:ring-blue-200"
                        />
                        <label className="sr-only">Table checkbox</label>
                      </div>
                    </td>
                    <td className="border border-slate-200 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(pendaftar.nama)}&background=e5e7eb&color=6b7280&size=28`}
                          className="h-8 w-8 rounded-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <div>
                          <div className="text-sm font-semibold text-slate-800">
                            {pendaftar.nama}
                          </div>
                          <div className="text-xs text-slate-500">
                            {pendaftar.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-sm text-slate-600">
                      {pendaftar.program}
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-sm text-slate-600">
                      {pendaftar.durasi}
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
                      Rp {pendaftar.hargaProgram.toLocaleString('id-ID')}
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-center">
                      {getStatusPendaftaranBadge(pendaftar.statusPendaftaran)}
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-center">
                      {getStatusPembayaranBadge(pendaftar.statusPembayaran)}
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-center">
                      <div className="flex justify-center gap-1.5">
                        {pendaftar.statusPendaftaran !== 'Disetujui' && pendaftar.statusPendaftaran !== 'Ditolak' && (
                          <>
                            <button
                              onClick={() => handleApprove(pendaftar.id)}
                              className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600"
                              title="Setujui"
                            >
                              <CheckCircle size={15} />
                            </button>
                            <button
                              onClick={() => handleReject(pendaftar.id)}
                              className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                              title="Tolak"
                            >
                              <XCircle size={15} />
                            </button>
                          </>
                        )}
                        {pendaftar.buktiPembayaran && (
                          <button
                            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                            title="Bukti"
                          >
                            <FileText size={15} />
                          </button>
                        )}
                        <button
                          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
                          title="Detail"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600"
                          title="Edit"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                          title="Hapus"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results Info */}
      <div className="mt-4 text-sm text-slate-600">
        Menampilkan <span className="font-semibold">{filteredPendaftar.length}</span> dari{' '}
        <span className="font-semibold">{pendaftarData.length}</span> pendaftar
      </div>
    </div>
  );
}
