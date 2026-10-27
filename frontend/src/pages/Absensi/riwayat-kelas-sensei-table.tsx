import { useState, useEffect } from "react";
import { rekapKehadiranSenseiApi, APP_URL } from "../../services/api";
import { RiwayatKelasSensei } from "../../types";

interface RiwayatKelasSenseiTableProps { userId?: number; kelasId?: number; senseiName?: string; }

function fmtDate(v: string): string { if (!v) return "-"; const [y,m,d] = v.slice(0,10).split("-"); const mi = Number(m)-1; const M = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"]; if (!y || Number.isNaN(mi) || !M[mi]) return v; return `${d} ${M[mi]} ${y}`; }

const SC: Record<string, string> = { selesai: "bg-green-100 text-green-700", berjalan: "bg-blue-100 text-blue-700", akan_datang: "bg-yellow-100 text-yellow-700", dibatalkan: "bg-red-100 text-red-700" };

export function RiwayatKelasSenseiTable({ userId, kelasId, senseiName }: RiwayatKelasSenseiTableProps = {}) {
  const [list, setList] = useState<RiwayatKelasSensei[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (userId) { setLoading(true); rekapKehadiranSenseiApi.riwayatKelas(userId).then((r) => { setList(r.data.data || []); setLoading(false); }).catch(() => { setErr("Gagal memuat riwayat"); setLoading(false); }); }
  }, [userId]);

  if (loading) return <div className="py-8 text-center">Memuat riwayat kelas...</div>;
  if (err) return <div className="py-8 text-center text-red-600"><p>{err}</p><button onClick={() => window.location.reload()} className="mt-2 text-blue-600 underline">Coba lagi</button></div>;

  const data = userId ? list : [
    { id: 1, nama_kelas: "Mochammad Rafli", batch_nama: "Batch 18 B", level: "3", tanggal_mulai: "28 Agu 2026", tanggal_selesai: "29 Sep 2026", total_pertemuan: 23, hadir: 1, terlambat: 3, alpa: 1, pulang_awal: 0, tidak_absen_pulang: 6, libur: 4, belum_absen: 8, status: "selesai" } as RiwayatKelasSensei,
    { id: 2, nama_kelas: "Nakama", batch_nama: "Batch 18 A", level: "2", tanggal_mulai: "23 Jul 2026", tanggal_selesai: "24 Agu 2026", total_pertemuan: 23, hadir: 2, terlambat: 4, alpa: 4, pulang_awal: 3, tidak_absen_pulang: 10, libur: 10, belum_absen: 0, status: "selesai" } as RiwayatKelasSensei,
  ];
  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center justify-between border-b border-[#dadce0] px-4 py-3"><h2 className="text-lg font-semibold text-[#202124]">Riwayat Kelas Sensei</h2><span className="text-xs text-[#5f6368]">{senseiName || ""}</span></div>
      <div className="overflow-x-auto border border-[#dadce0] rounded-lg bg-white">
        <table className="w-full text-sm text-left">
          <thead className="border-b border-[#dadce0] bg-[#f8f9fa]"><tr>
            <th className="px-4 py-3 font-medium text-[#5f6368] uppercase">No</th><th className="px-4 py-3 font-medium text-[#5f6368] uppercase">Nama Kelas</th><th className="px-4 py-3 font-medium text-[#5f6368] uppercase">Batch</th><th className="px-4 py-3 font-medium text-[#5f6368] uppercase">Level</th><th className="px-4 py-3 font-medium text-[#5f6368] uppercase">Tgl Mulai</th><th className="px-4 py-3 font-medium text-[#5f6368] uppercase">Tgl Selesai</th><th className="px-4 py-3 font-medium text-[#5f6368] uppercase">Total</th><th className="px-4 py-3 font-medium text-[#5f6368] uppercase">Hadir</th><th className="px-4 py-3 font-medium text-[#5f6368] uppercase">Telat</th><th className="px-4 py-3 font-medium text-[#5f6368] uppercase">Alpa</th><th className="px-4 py-3 font-medium text-[#5f6368] uppercase">P.Awal</th><th className="px-4 py-3 font-medium text-[#5f6368] uppercase">Tdk Absen Pulang</th><th className="px-4 py-3 font-medium text-[#5f6368] uppercase">Libur</th><th className="px-4 py-3 font-medium text-[#5f6368] uppercase">Blm Absen</th><th className="px-4 py-3 font-medium text-[#5f6368] uppercase">Status</th>
          </tr></thead>
          <tbody className="divide-y divide-[#dadce0]">
            {data.map((item, i) => (
              <tr key={item.id} className="hover:bg-[#f8f9fa] transition-colors">
                <td className="px-4 py-3 text-[#5f6368]">{i + 1}</td>
                <td className="px-4 py-3 font-medium text-[#202124]">{item.nama_kelas || "-"}</td>
                <td className="px-4 py-3 text-[#5f6368]">{item.batch_nama || "-"}</td>
                <td className="px-4 py-3 text-[#5f6368]">{item.level || "-"}</td>
                <td className="px-4 py-3 text-[#5f6368]">{fmtDate(item.tanggal_mulai)}</td>
                <td className="px-4 py-3 text-[#5f6368]">{fmtDate(item.tanggal_selesai)}</td>
                <td className="px-4 py-3 font-medium text-[#202124]">{item.total_pertemuan}</td>
                <td className="px-4 py-3 text-[#202124]">{item.hadir}</td>
                <td className="px-4 py-3 text-[#202124]">{item.terlambat}</td>
                <td className="px-4 py-3 text-[#202124]">{item.alpa}</td>
                <td className="px-4 py-3 text-[#202124]">{item.pulang_awal}</td>
                <td className="px-4 py-3 text-[#202124]">{item.tidak_absen_pulang}</td>
                <td className="px-4 py-3 text-[#5f6368]">{item.libur}</td>
                <td className="px-4 py-3 text-[#5f6368]">{item.belum_absen}</td>
                <td className="px-4 py-3"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${SC[item.status || ""] || "bg-gray-100 text-gray-600"}`}>{(item.status || "-").charAt(0).toUpperCase() + (item.status || "-").slice(1)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-[#dadce0] px-4 py-3 bg-[#f8f9fa]">
        <div className="text-xs text-[#5f6368]">Total Kelas: {data.length}</div>
        {userId && <button onClick={() => window.location.href = `${APP_URL}/rekap-kehadiran-sensei`} className="text-sm text-[#1a73e8] hover:underline font-medium">Lihat Semua Riwayat</button>}
      </div>
    </div>
  );
}