import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Presentation, Plus, Trash2, X, Check, AlertTriangle } from "lucide-react";
import { guruApi, adminCabangApi, APP_URL } from "../../services/api";
import type { Guru } from "../../types";

export default function GuruPage() {
  const location = useLocation();
  const isAdminCabang = location.pathname.startsWith('/admin-cabang');
  const [gurus, setGurus] = useState<Guru[]>([]);
  const [availableUsers, setAvailableUsers] = useState<{ id: number; name: string; email: string; role: string; foto_profil: string | null; already_guru: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = isAdminCabang ? await adminCabangApi.guru() : await guruApi.list();
      setGurus(res.data.data || []);
      setAvailableUsers(res.data.available_users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = async () => {
    if (!selectedUserIds.length) return;
    setSubmitting(true);
    try {
      await guruApi.store({ user_ids: selectedUserIds });
      setShowModal(false);
      setSelectedUserIds([]);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, nama: string) => {
    if (!confirm(`Yakin ingin menghapus ${nama} dari data sensei?`)) return;
    try {
      await guruApi.delete(id);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleUser = (userId: number) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const fotoUrl = (guru: Guru) => {
    const foto = guru.user?.foto_profil;
    if (foto) return `${APP_URL}/uploads/foto_profil/${foto}`;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(guru.nama)}&background=e5e7eb&color=6b7280&size=32`;
  };

  const userFotoUrl = (u: { name: string; foto_profil: string | null }) => {
    if (u.foto_profil) return `${APP_URL}/uploads/foto_profil/${u.foto_profil}`;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=e5e7eb&color=6b7280&size=24`;
  };

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      <div className="mb-4 flex flex-col gap-4 border-b border-[#dadce0] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border border-[#dadce0] bg-[#f1f3f4] text-[#5f6368]">
            <Presentation size={20} />
          </div>
          <div>
            <h1 className="text-xl font-medium text-[#202124]">Sensei / Guru</h1>
            <p className="text-sm text-[#5f6368]">Kelola data sensei dari pengguna yang terdaftar</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-[#202124] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#3c4043]"
        >
          <Plus size={16} />
          Tambah Sensei
        </button>
      </div>

      {/* Table */}
      <div className="relative overflow-x-auto border border-[#dadce0]">
        <table className="w-full min-w-full border-collapse text-left text-xs text-[#3c4043]">
          <thead className="text-[10px] text-[#5f6368]">
            <tr>
              <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5">Nama</th>
              <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5">NIP</th>

              <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5">No. HP</th>
              <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5">Status</th>
              <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="h-3 w-full #e8eaed-\[#e8eaed\]" />
                  </td>
                </tr>
              ))
            ) : gurus.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center bg-[#f1f3f4] text-[#80868b]">
                    <Presentation size={24} />
                  </div>
                  <p className="mt-3 text-sm font-medium text-[#5f6368]">Belum ada data sensei</p>
                </td>
              </tr>
            ) : (
              gurus.map((g) => (
                <tr key={g.id} className="bg-white transition hover:bg-[#f8f9fa]">
                  <td className="border-b border-[#e8eaed] px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <img
                        src={fotoUrl(g)}
                        alt={g.nama}
                        className="h-7 w-7 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(g.nama)}&background=e5e7eb&color=6b7280&size=32`;
                        }}
                      />
                      <span className="font-semibold text-[#202124]">{g.nama}</span>
                    </div>
                  </td>
                  <td className="border-b border-[#e8eaed] px-3 py-2.5 text-[#5f6368]">{g.nip || "-"}</td>

                  <td className="border-b border-[#e8eaed] px-3 py-2.5 text-[#5f6368]">{g.no_hp || "-"}</td>
                  <td className="border-b border-[#e8eaed] px-3 py-2.5">
                    <span className={`inline-flex px-2 py-0.5 text-[9px] font-semibold ${ g.status === "AKTIF" ? "bg-[#0E6187] text-white" : "bg-[#f6d7d5] text-[#a50e0e]" }`}>
                      {g.status}
                    </span>
                  </td>
                  <td className="border-b border-[#e8eaed] px-3 py-2.5 text-center">
                    <button
                      onClick={() => handleDelete(g.id, g.nama)}
                      className="p-1.5 text-[#80868b] transition hover:bg-[#fce8e6] hover:text-[#d93025]"
                      title="Hapus"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Tambah Sensei */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center #202124-\[#202124\] px-3">
          <div className="border border-[#dadce0] w-full max-w-lg bg-white shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)]">
            <div className="flex items-center justify-between border-b border-[#dadce0] px-4 py-3">
              <h3 className="text-sm font-semibold text-[#202124]">Tambah Sensei dari Pengguna</h3>
              <button
                onClick={() => { setShowModal(false); setSelectedUserIds([]); }}
                className="p-1 text-[#80868b] transition hover:bg-[#f1f3f4] hover:text-[#5f6368]"
              >
                <X size={16} />
              </button>
            </div>
            <div className="max-h-[400px] overflow-y-auto px-4 py-3">
              <p className="mb-3 text-xs text-[#80868b]">Centang pengguna yang ingin dijadikan sensei:</p>
              <table className="w-full text-left text-xs text-[#3c4043]">
                <thead>
                  <tr className="border-b border-[#e8eaed] text-[10px] text-[#5f6368] uppercase">
                    <th className="text-xs font-medium text-[#5f6368] w-10 px-2 py-1.5">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUserIds(availableUsers.filter((u) => !u.already_guru).map((u) => u.id));
                          } else {
                            setSelectedUserIds([]);
                          }
                        }}
                        checked={availableUsers.filter((u) => !u.already_guru).length > 0 && selectedUserIds.length === availableUsers.filter((u) => !u.already_guru).length}
                        className="border-[#dadce0] text-[#202124] focus:ring-[#9aa0a6]"
                      />
                    </th>
                    <th className="text-xs font-medium text-[#5f6368] px-2 py-1.5">Nama</th>
                    <th className="text-xs font-medium text-[#5f6368] px-2 py-1.5">Email</th>
                    <th className="text-xs font-medium text-[#5f6368] px-2 py-1.5">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {availableUsers.map((u) => (
                    <tr key={u.id} className="border-b border-[#f8f9fa] transition hover:bg-[#f8f9fa]">
                      <td className="px-2 py-1.5">
                        {u.already_guru ? (
                          <span className="text-[#9aa0a6]"><X size={12} /></span>
                        ) : (
                          <input
                            type="checkbox"
                            checked={selectedUserIds.includes(u.id)}
                            onChange={() => toggleUser(u.id)}
                            className="border-[#dadce0] text-[#202124] focus:ring-[#9aa0a6]"
                          />
                        )}
                      </td>
                      <td className="px-2 py-1.5">
                        <div className="flex items-center gap-2">
                          <img
                            src={userFotoUrl(u)}
                            alt={u.name}
                            className="h-5 w-5 object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=e5e7eb&color=6b7280&size=24`;
                            }}
                          />
                          <span className="font-medium text-[#3c4043]">{u.name}</span>
                          {u.already_guru && (
                            <span className="inline-flex items-center gap-0.5 bg-[#f1f3f4] px-1.5 py-0.5 text-[9px] font-medium text-[#5f6368]">
                              <Check size={10} /> Sudah jadi sensei
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-1.5 text-[#80868b]">{u.email}</td>
                      <td className="px-2 py-1.5">
                        <span className="bg-[#e8f0fe] px-1.5 py-0.5 text-[9px] font-medium text-[#1967d2]">{u.role}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {availableUsers.filter((u) => !u.already_guru).length === 0 && (
                <div className="flex flex-col items-center py-8 text-[#80868b]">
                  <AlertTriangle size={24} className="mb-2" />
                  <p className="text-xs">Tidak ada pengguna yang bisa ditambahkan</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t border-[#dadce0] px-4 py-3">
              <button
                onClick={() => { setShowModal(false); setSelectedUserIds([]); }}
                className="border border-[#dadce0] bg-white px-4 py-2 text-xs font-medium text-[#3c4043] transition hover:bg-[#f8f9fa]"
              >
                Batal
              </button>
              <button
                onClick={handleAdd}
                disabled={!selectedUserIds.length || submitting}
                className="bg-[#202124] px-4 py-2 text-xs font-medium text-white transition hover:bg-[#3c4043] disabled:opacity-50"
              >
                {submitting ? "Menyimpan..." : "Simpan Sensei"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
