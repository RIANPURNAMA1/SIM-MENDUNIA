import { useState, useEffect, useCallback, useRef } from "react";
import { MapPin, Search, RotateCcw } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { monitoringLokasiApi } from "../../services/api";
import type { Absensi, Cabang } from "../../types";

// Fix Leaflet default marker icon
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// @ts-expect-error - Leaflet icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const greenIcon = new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: "hue-rotate-[90deg] brightness-[1.2] saturate-[2]",
});

const blueIcon = new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: "hue-rotate-[200deg] saturate-[2]",
});

export default function MonitoringLokasiPage() {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<Absensi[]>([]);
  const [listCabang, setListCabang] = useState<Cabang[]>([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const [tglMulai, setTglMulai] = useState(now.toISOString().split("T")[0]);
  const [tglSelesai, setTglSelesai] = useState(now.toISOString().split("T")[0]);
  const [filterCabang, setFilterCabang] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        tgl_mulai: tglMulai,
        tgl_selesai: tglSelesai,
      };
      if (filterCabang) params.cabang_id = filterCabang;
      const res = await monitoringLokasiApi.get(params);
      setData(res.data.data || []);
      setListCabang(res.data.list_cabang || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tglMulai, tglSelesai, filterCabang]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Init map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    mapRef.current = L.map(mapContainerRef.current, {
      center: [-2.5489, 118.0149],
      zoom: 5,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(mapRef.current);
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers when data changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (!data.length) return;

    const bounds: L.LatLngBoundsExpression[] = [];

    data.forEach((item) => {
      if (item.lat_masuk && item.long_masuk) {
        const popup = `
          <div style="font-size:12px;line-height:1.5">
            <b>${item.user?.name || "-"}</b><br/>
            <span style="color:#137333">&#9679; Masuk</span> ${item.jam_masuk || "-"}<br/>
            ${item.tanggal}<br/>
            ${item.cabang?.nama_cabang || "-"}
          </div>`;
        const marker = L.marker([item.lat_masuk, item.long_masuk], { icon: greenIcon })
          .addTo(map)
          .bindPopup(popup);
        markersRef.current.push(marker);
        bounds.push([item.lat_masuk, item.long_masuk]);
      }
      if (item.lat_pulang && item.long_pulang) {
        const popup = `
          <div style="font-size:12px;line-height:1.5">
            <b>${item.user?.name || "-"}</b><br/>
            <span style="color:#1a73e8">&#9679; Pulang</span> ${item.jam_keluar || "-"}<br/>
            ${item.tanggal}<br/>
            ${item.cabang?.nama_cabang || "-"}
          </div>`;
        const marker = L.marker([item.lat_pulang, item.long_pulang], { icon: blueIcon })
          .addTo(map)
          .bindPopup(popup);
        markersRef.current.push(marker);
        bounds.push([item.lat_pulang, item.long_pulang]);
      }
    });

    if (bounds.length) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [data]);

  const resetFilter = () => {
    const d = new Date();
    setTglMulai(d.toISOString().split("T")[0]);
    setTglSelesai(d.toISOString().split("T")[0]);
    setFilterCabang("");
  };

  const masukCount = data.filter((d) => d.lat_masuk).length;
  const pulangCount = data.filter((d) => d.lat_pulang).length;

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      <div className="mb-4 flex flex-col gap-4 border-b border-[#dadce0] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border border-[#dadce0] bg-[#f1f3f4] text-[#5f6368]">
            <MapPin size={20} />
          </div>
          <div>
            <h1 className="text-xl font-medium text-[#202124]">Monitoring Lokasi</h1>
            <p className="text-sm text-[#5f6368]">Pantau lokasi absensi karyawan</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-4 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#5f6368] shrink-0">Dari</span>
            <input
              type="date"
              value={tglMulai}
              onChange={(e) => setTglMulai(e.target.value)}
              className="border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8]"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#5f6368] shrink-0">Sampai</span>
            <input
              type="date"
              value={tglSelesai}
              onChange={(e) => setTglSelesai(e.target.value)}
              className="border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8]"
            />
          </div>
          <select
            value={filterCabang}
            onChange={(e) => setFilterCabang(e.target.value)}
            className="border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8]"
          >
            <option value="">Semua Cabang</option>
            {listCabang.map((c) => (
              <option key={c.id} value={c.id}>{c.nama_cabang}</option>
            ))}
          </select>
          <button
            onClick={fetchData}
            className="inline-flex items-center justify-center gap-2 bg-[#202124] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#3c4043]"
          >
            <Search size={16} />
            Filter
          </button>
          <button
            onClick={resetFilter}
            className="inline-flex items-center justify-center gap-2 border border-[#dadce0] bg-white px-3 py-2 text-sm font-medium text-[#3c4043] transition hover:bg-[#f8f9fa]"
          >
            <RotateCcw size={16} />
            Reset
          </button>
        </div>
      </div>

      {/* Summary */}
      {!loading && (
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <div className="border border-[#dadce0] bg-white px-3 py-2 text-center">
            <span className="block text-lg font-bold text-[#137333]">{masukCount}</span>
            <p className="text-[10px] font-semibold tracking-wider text-[#5f6368] uppercase">Check In</p>
          </div>
          <div className="border border-[#dadce0] bg-white px-3 py-2 text-center">
            <span className="block text-lg font-bold text-[#1a73e8]">{pulangCount}</span>
            <p className="text-[10px] font-semibold tracking-wider text-[#5f6368] uppercase">Check Out</p>
          </div>
          <div className="border border-[#dadce0] bg-[#f8f9fa] px-3 py-2 text-center">
            <span className="block text-lg font-bold text-[#202124]">{data.length}</span>
            <p className="text-[10px] font-bold tracking-wider text-[#5f6368] uppercase">Total</p>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="mb-4 overflow-hidden border border-[#dadce0]">
        <div ref={mapContainerRef} className="h-[400px] w-full sm:h-[500px]" />
      </div>

      {/* Table */}
      <div className="relative overflow-x-auto border border-[#dadce0]">
        <table className="w-full min-w-full border-collapse text-left text-xs text-[#3c4043]">
          <thead className="text-[10px] text-[#5f6368]">
            <tr>
              <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5">Karyawan</th>
              <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5">Cabang</th>
              <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5">Tanggal</th>
              <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5">Jam Masuk</th>
              <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5">Jam Pulang</th>
              <th className="text-xs font-medium text-[#5f6368] px-3 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="h-3 w-full bg-[#e8eaed]" />
                  </td>
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center bg-[#f1f3f4] text-[#80868b]">
                    <MapPin size={24} />
                  </div>
                  <p className="mt-3 text-sm font-medium text-[#5f6368]">Tidak ada data lokasi</p>
                  <p className="text-xs text-[#80868b]">Coba ubah rentang tanggal atau filter</p>
                </td>
              </tr>
            ) : (
              data.map((item, idx) => (
                <tr key={idx} className="bg-white transition hover:bg-[#f8f9fa]">
                  <td className="border-b border-[#e8eaed] px-3 py-2.5">
                    <div className="font-semibold text-[#202124]">{item.user?.name || "-"}</div>
                    <div className="text-[9px] text-[#80868b]">{item.user?.nip || ""}</div>
                  </td>
                  <td className="border-b border-[#e8eaed] px-3 py-2.5 text-[#5f6368]">
                    {item.cabang?.nama_cabang || "-"}
                  </td>
                  <td className="border-b border-[#e8eaed] px-3 py-2.5 text-[#5f6368]">{item.tanggal}</td>
                  <td className="border-b border-[#e8eaed] px-3 py-2.5">
                    {item.lat_masuk ? (
                      <span className="inline-flex items-center gap-1">
                        <span className="h-1.5 w-1.5 bg-[#0E6187]" />
                        {item.jam_masuk || "-"}
                      </span>
                    ) : "-"}
                  </td>
                  <td className="border-b border-[#e8eaed] px-3 py-2.5">
                    {item.lat_pulang ? (
                      <span className="inline-flex items-center gap-1">
                        <span className="h-1.5 w-1.5 bg-[#0E6187]" />
                        {item.jam_keluar || "-"}
                      </span>
                    ) : "-"}
                  </td>
                  <td className="border-b border-[#e8eaed] px-3 py-2.5">
                    <span className={`inline-flex px-2 py-0.5 text-[9px] font-semibold ${ item.status === "HADIR" ? "bg-[#0E6187] text-white" : item.status === "TERLAMBAT" ? "bg-[#fef7e0] text-[#b06000]" : item.status === "IZIN" ? "bg-[#e8f0fe] text-[#1967d2]" : item.status === "ALPA" ? "bg-[#f6d7d5] text-[#a50e0e]" : "bg-[#f1f3f4] text-[#5f6368]" }`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
