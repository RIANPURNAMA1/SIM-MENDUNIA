import { useState, useEffect } from "react";
import { Presentation, Plus, Trash2, X, Check, AlertTriangle } from "lucide-react";
import { guruApi, APP_URL } from "../../services/api";
import type { Guru } from "../../types";

export default function GuruPage() {
  const [gurus, setGurus] = useState<Guru[]>([]);
  const [availableUsers, setAvailableUsers] = useState<{ id: number; name: string; email: string; role: string; foto_profil: string | null; already_guru: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await guruApi.list();
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
    if (foto) return `${APP_URL}/uploads/profil/${foto}`;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(guru.nama)}&background=e5e7eb&color=6b7280&size=32`;
  };

  const userFotoUrl = (u: { name: string; foto_profil: string | null }) => {
    if (u.foto_profil) return `${APP_URL}/uploads/profil/${u.foto_profil}`;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=e5e7eb&color=6b7280&size=24`;
  };

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      <div className="mb-4 flex flex-col gap-4 rounded-lg p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0D1F3C] border border-blue-100">
            <Presentation size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Sensei / Guru</h1>
            <p className="text-sm text-slate-500">Kelola data sensei dari pengguna yang terdaftar</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-md bg-slate-800 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-700"
        >
          <Plus size={16} />
          Tambah Sensei
        </button>
      </div>

      {/* Table */}
      <div className="relative overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-full border-collapse text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-[10px] text-slate-600 uppercase tracking-wide">
            <tr>
              <th className="border border-slate-200 px-3 py-2.5 font-semibold">Nama</th>
              <th className="border border-slate-200 px-3 py-2.5 font-semibold">NIP</th>

              <th className="border border-slate-200 px-3 py-2.5 font-semibold">No. HP</th>
              <th className="border border-slate-200 px-3 py-2.5 font-semibold">Status</th>
              <th className="border border-slate-200 px-3 py-2.5 font-semibold text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={6} className="border border-slate-200 px-3 py-3">
                    <div className="h-3 w-full rounded bg-slate-200/70" />
                  </td>
                </tr>
              ))
            ) : gurus.length === 0 ? (
              <tr>
                <td colSpan={6} className="border border-slate-200 px-4 py-10 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <Presentation size={24} />
                  </div>
                  <p className="mt-3 text-sm font-medium text-slate-600">Belum ada data sensei</p>
                </td>
              </tr>
            ) : (
              gurus.map((g) => (
                <tr key={g.id} className="bg-white transition hover:bg-slate-50">
                  <td className="border border-slate-200 px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <img
                        src={fotoUrl(g)}
                        alt={g.nama}
                        className="h-7 w-7 rounded-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(g.nama)}&background=e5e7eb&color=6b7280&size=32`;
                        }}
                      />
                      <span className="font-semibold text-slate-800">{g.nama}</span>
                    </div>
                  </td>
                  <td className="border border-slate-200 px-3 py-2.5 text-slate-500">{g.nip || "-"}</td>

                  <td className="border border-slate-200 px-3 py-2.5 text-slate-500">{g.no_hp || "-"}</td>
                  <td className="border border-slate-200 px-3 py-2.5">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                      g.status === "AKTIF" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                    }`}>
                      {g.status}
                    </span>
                  </td>
                  <td className="border border-slate-200 px-3 py-2.5 text-center">
                    <button
                      onClick={() => handleDelete(g.id, g.nama)}
                      className="rounded-md p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3">
          <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-800">Tambah Sensei dari Pengguna</h3>
              <button
                onClick={() => { setShowModal(false); setSelectedUserIds([]); }}
                className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>
            <div className="max-h-[400px] overflow-y-auto px-4 py-3">
              <p className="mb-3 text-xs text-slate-400">Centang pengguna yang ingin dijadikan sensei:</p>
              <table className="w-full text-left text-xs text-slate-700">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] text-slate-500 uppercase">
                    <th className="w-10 px-2 py-1.5 font-semibold">
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
                        className="rounded border-slate-300 text-slate-800 focus:ring-slate-500"
                      />
                    </th>
                    <th className="px-2 py-1.5 font-semibold">Nama</th>
                    <th className="px-2 py-1.5 font-semibold">Email</th>
                    <th className="px-2 py-1.5 font-semibold">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {availableUsers.map((u) => (
                    <tr key={u.id} className="border-b border-slate-50 transition hover:bg-slate-50">
                      <td className="px-2 py-1.5">
                        {u.already_guru ? (
                          <span className="text-slate-300"><X size={12} /></span>
                        ) : (
                          <input
                            type="checkbox"
                            checked={selectedUserIds.includes(u.id)}
                            onChange={() => toggleUser(u.id)}
                            className="rounded border-slate-300 text-slate-800 focus:ring-slate-500"
                          />
                        )}
                      </td>
                      <td className="px-2 py-1.5">
                        <div className="flex items-center gap-2">
                          <img
                            src={userFotoUrl(u)}
                            alt={u.name}
                            className="h-5 w-5 rounded-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=e5e7eb&color=6b7280&size=24`;
                            }}
                          />
                          <span className="font-medium text-slate-700">{u.name}</span>
                          {u.already_guru && (
                            <span className="inline-flex items-center gap-0.5 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-500">
                              <Check size={10} /> Sudah jadi sensei
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-1.5 text-slate-400">{u.email}</td>
                      <td className="px-2 py-1.5">
                        <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[9px] font-medium text-sky-700">{u.role}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {availableUsers.filter((u) => !u.already_guru).length === 0 && (
                <div className="flex flex-col items-center py-8 text-slate-400">
                  <AlertTriangle size={24} className="mb-2" />
                  <p className="text-xs">Tidak ada pengguna yang bisa ditambahkan</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3">
              <button
                onClick={() => { setShowModal(false); setSelectedUserIds([]); }}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={handleAdd}
                disabled={!selectedUserIds.length || submitting}
                className="rounded-md bg-slate-800 px-4 py-2 text-xs font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
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
