import { Users, Search, Filter, Plus, Trash2, Edit2 } from 'lucide-react'
import { useState } from 'react'

interface Kandidat {
  id: number
  nama: string
  email: string
  telepon: string
  posisi: string
  status: 'Pending' | 'Disetujui' | 'Ditolak' | 'Interview'
  tanggalDaftar: string
}

interface Batch {
  id: number
  nama: string
  jumlahKandidat: number
  kandidat: Kandidat[]
}

const batchData: Batch[] = [
  {
    id: 1,
    nama: 'Batch 2026-01 (Software Developer)',
    jumlahKandidat: 8,
    kandidat: [
      {
        id: 1,
        nama: 'Ahmad Rizkianto',
        email: 'ahmad.rizki@email.com',
        telepon: '08123456789',
        posisi: 'Senior Developer',
        status: 'Interview',
        tanggalDaftar: '15 Juni 2026',
      },
      {
        id: 2,
        nama: 'Siti Nurhaliza',
        email: 'siti.nur@email.com',
        telepon: '08234567890',
        posisi: 'Frontend Developer',
        status: 'Disetujui',
        tanggalDaftar: '16 Juni 2026',
      },
      {
        id: 3,
        nama: 'Budi Prasetyo',
        email: 'budi.pras@email.com',
        telepon: '08345678901',
        posisi: 'Backend Developer',
        status: 'Pending',
        tanggalDaftar: '17 Juni 2026',
      },
      {
        id: 4,
        nama: 'Rina Wijaya',
        email: 'rina.wijaya@email.com',
        telepon: '08456789012',
        posisi: 'Full Stack Developer',
        status: 'Interview',
        tanggalDaftar: '18 Juni 2026',
      },
      {
        id: 5,
        nama: 'Doni Santoso',
        email: 'doni.santo@email.com',
        telepon: '08567890123',
        posisi: 'Frontend Developer',
        status: 'Ditolak',
        tanggalDaftar: '19 Juni 2026',
      },
      {
        id: 6,
        nama: 'Lina Kusuma',
        email: 'lina.kusuma@email.com',
        telepon: '08678901234',
        posisi: 'DevOps Engineer',
        status: 'Disetujui',
        tanggalDaftar: '20 Juni 2026',
      },
      {
        id: 7,
        nama: 'Rendra Maulana',
        email: 'rendra.maul@email.com',
        telepon: '08789012345',
        posisi: 'QA Engineer',
        status: 'Pending',
        tanggalDaftar: '21 Juni 2026',
      },
      {
        id: 8,
        nama: 'Maya Handoko',
        email: 'maya.hando@email.com',
        telepon: '08890123456',
        posisi: 'Senior Developer',
        status: 'Interview',
        tanggalDaftar: '22 Juni 2026',
      },
    ],
  },
  {
    id: 2,
    nama: 'Batch 2026-02 (Marketing & Sales)',
    jumlahKandidat: 6,
    kandidat: [
      {
        id: 9,
        nama: 'Feri Gunawan',
        email: 'feri.gunaw@email.com',
        telepon: '08901234567',
        posisi: 'Marketing Manager',
        status: 'Interview',
        tanggalDaftar: '23 Juni 2026',
      },
      {
        id: 10,
        nama: 'Eka Putri',
        email: 'eka.putri@email.com',
        telepon: '08012345678',
        posisi: 'Sales Executive',
        status: 'Disetujui',
        tanggalDaftar: '24 Juni 2026',
      },
      {
        id: 11,
        nama: 'Hendra Wijaya',
        email: 'hendra.wija@email.com',
        telepon: '08123456780',
        posisi: 'Digital Marketing',
        status: 'Pending',
        tanggalDaftar: '25 Juni 2026',
      },
      {
        id: 12,
        nama: 'Iva Santoso',
        email: 'iva.santo@email.com',
        telepon: '08234567891',
        posisi: 'Sales Manager',
        status: 'Interview',
        tanggalDaftar: '26 Juni 2026',
      },
      {
        id: 13,
        nama: 'Joko Supriyanto',
        email: 'joko.supri@email.com',
        telepon: '08345678902',
        posisi: 'Marketing Executive',
        status: 'Disetujui',
        tanggalDaftar: '27 Juni 2026',
      },
      {
        id: 14,
        nama: 'Kania Rahmawati',
        email: 'kania.rahm@email.com',
        telepon: '08456789013',
        posisi: 'Content Creator',
        status: 'Ditolak',
        tanggalDaftar: '28 Juni 2026',
      },
    ],
  },
  {
    id: 3,
    nama: 'Batch 2026-03 (HR & Finance)',
    jumlahKandidat: 5,
    kandidat: [
      {
        id: 15,
        nama: 'Luthfi Rahman',
        email: 'luthfi.rahm@email.com',
        telepon: '08567890124',
        posisi: 'HR Manager',
        status: 'Disetujui',
        tanggalDaftar: '29 Juni 2026',
      },
      {
        id: 16,
        nama: 'Mei Suryani',
        email: 'mei.surya@email.com',
        telepon: '08678901245',
        posisi: 'Finance Officer',
        status: 'Interview',
        tanggalDaftar: '30 Juni 2026',
      },
      {
        id: 17,
        nama: 'Nandi Pratama',
        email: 'nandi.prat@email.com',
        telepon: '08789012356',
        posisi: 'Accountant',
        status: 'Pending',
        tanggalDaftar: '1 Juli 2026',
      },
      {
        id: 18,
        nama: 'Oka Wijaya',
        email: 'oka.wijay@email.com',
        telepon: '08890123467',
        posisi: 'HR Specialist',
        status: 'Disetujui',
        tanggalDaftar: '2 Juli 2026',
      },
      {
        id: 19,
        nama: 'Pita Kusuma',
        email: 'pita.kusum@email.com',
        telepon: '08901234578',
        posisi: 'Finance Manager',
        status: 'Interview',
        tanggalDaftar: '3 Juli 2026',
      },
    ],
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Disetujui':
      return 'bg-emerald-100 text-emerald-700'
    case 'Ditolak':
      return 'bg-red-100 text-red-700'
    case 'Interview':
      return 'bg-blue-100 text-blue-700'
    default:
      return 'bg-amber-100 text-amber-700'
  }
}

export default function DataKandidat() {
  const [expandedBatch, setExpandedBatch] = useState<number | null>(1)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredBatches = batchData.map((batch) => ({
    ...batch,
    kandidat: batch.kandidat.filter((k) =>
      k.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.posisi.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  }))

  return (
    <div className="px-3 sm:px-6 py-3 sm:py-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white">
            <Users size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Data Kandidat</h1>
            <p className="text-sm text-gray-500">Kelola data kandidat per batch</p>
          </div>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama, email, atau posisi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
        <button className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium">
          <Plus size={16} />
          Tambah Kandidat
        </button>
      </div>

      {/* Batch Accordion */}
      <div className="space-y-4">
        {filteredBatches.map((batch) => (
          <div key={batch.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            {/* Batch Header */}
            <button
              onClick={() => setExpandedBatch(expandedBatch === batch.id ? null : batch.id)}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-sm">{batch.id}</span>
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">{batch.nama}</h3>
                  <p className="text-xs text-gray-500">{batch.jumlahKandidat} kandidat</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-semibold">
                  {batch.kandidat.length} / {batch.jumlahKandidat}
                </span>
                <span
                  className={`transform transition ${
                    expandedBatch === batch.id ? 'rotate-180' : ''
                  }`}
                >
                  ▼
                </span>
              </div>
            </button>

            {/* Batch Content */}
            {expandedBatch === batch.id && (
              <div className="border-t border-gray-200 px-5 py-4">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 font-semibold text-gray-700 text-xs uppercase">Nama</th>
                        <th className="text-left py-2 font-semibold text-gray-700 text-xs uppercase">Email</th>
                        <th className="text-left py-2 font-semibold text-gray-700 text-xs uppercase">Telepon</th>
                        <th className="text-left py-2 font-semibold text-gray-700 text-xs uppercase">Posisi</th>
                        <th className="text-left py-2 font-semibold text-gray-700 text-xs uppercase">Status</th>
                        <th className="text-left py-2 font-semibold text-gray-700 text-xs uppercase">Tanggal</th>
                        <th className="text-center py-2 font-semibold text-gray-700 text-xs uppercase">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batch.kandidat.length > 0 ? (
                        batch.kandidat.map((kandidat) => (
                          <tr key={kandidat.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                            <td className="py-3 font-medium text-gray-900">{kandidat.nama}</td>
                            <td className="py-3 text-gray-600 text-xs">{kandidat.email}</td>
                            <td className="py-3 text-gray-600">{kandidat.telepon}</td>
                            <td className="py-3 text-gray-700 font-medium">{kandidat.posisi}</td>
                            <td className="py-3">
                              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(kandidat.status)}`}>
                                {kandidat.status}
                              </span>
                            </td>
                            <td className="py-3 text-gray-600 text-xs">{kandidat.tanggalDaftar}</td>
                            <td className="py-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 transition">
                                  <Edit2 size={16} />
                                </button>
                                <button className="p-1.5 hover:bg-red-50 rounded-lg text-red-600 transition">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-gray-500">
                            Tidak ada kandidat yang sesuai dengan pencarian
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Total Batch</p>
          <p className="text-3xl font-bold text-gray-900">{batchData.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Total Kandidat</p>
          <p className="text-3xl font-bold text-gray-900">{batchData.reduce((sum, b) => sum + b.jumlahKandidat, 0)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Kandidat Aktif</p>
          <p className="text-3xl font-bold text-gray-900">{batchData.reduce((sum, b) => sum + b.kandidat.length, 0)}</p>
        </div>
      </div>
    </div>
  )
}
