import { useEffect, useState, useRef, useCallback, useMemo, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { DollarSign, Users, Search, RotateCcw, Eye, Edit3, Power, PowerOff, CalendarOff, Calendar, Receipt, Check, X, Plus, Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronUp, ChevronDown, ChevronsUpDown, MoreHorizontal, FileText, Download, Upload, Trash2, ArrowRight, RefreshCw, KeyRound, ClipboardPaste, LayoutDashboard } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useReactTable, getCoreRowModel, getSortedRowModel, getPaginationRowModel, flexRender, type ColumnDef, type SortingState } from '@tanstack/react-table'
import api, { pendaftarApi, batchApi, productApi, adminCabangApi, APP_URL } from '../../services/api'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import Swal from 'sweetalert2'

interface Kandidat {
  id: number
  nama: string
  email: string
  telepon: string
  nik: string
  no_registrasi: string
  batch_id: number | null
  batch_nama: string
  batch_warna: string | null
  cabang_nama: string
  foto_url?: string | null
  real_batch: string
  jenis_kelamin: string
  tempat_lahir: string
  tanggal_lahir: string
  alamat: string
  desa: string
  kecamatan: string
  kabupaten: string
  provinsi: string
  pendidikan_terakhir: string
  tahun_lulus: string
  tinggi_badan: string
  berat_badan: string
  goldar: string
  ukuran_baju: string
  status_pernikahan: string
  no_hp: string
  nama_ortu: string
  no_hp_ortu: string
  status: string
  status_kandidat: string
  status_akademik: string
  is_cuti: boolean
  cuti_sejak: string | null
  level_status_keluar: boolean
  learning_level?: number | null
  tanggalDaftar: string
  user_id: number | null
  keterangan: string
  password_plain: string | null
  kontrak?: {
    id: number
    judul: string
    file_kontrak: string
    file_kontrak_ttd: string | null
    ttd_uploaded_at: string | null
  } | null
  matching_job?: {
    id: number
    status_formulir: string
    updated_at: string | null
    penempatan_kandidat_id: number | null
    data: Record<string, any>
  } | null
}

interface MergeKandidatItem {
  id: number
  nama_romaji: string
  nama_katakana: string | null
  nama_cabang: string | null
  jenis_kelamin: string | null
  umur: number | null
  bidang_ssw: string | null
  status_progres: string | null
  status_formulir: string | null
  foto_url?: string | null
}

interface BatchOption {
  id: number
  nama: string
  warna: string | null
}

interface Wilayah {
  id: string
  name: string
}

const API_WILAYAH_BASE = 'https://cdn.jsdelivr.net/gh/izzulabadi/api-wilayah-indonesia-2026@v1.0.4/api'

interface PembayaranItemData {
  kategori_id: number
  nama: string
  biaya: number
  dibayar: number
}

interface KategoriBayar {
  id: number
  nama: string
}

type EditableField = keyof Pick<Kandidat,
  'nik' | 'nama' | 'real_batch' | 'jenis_kelamin' | 'tempat_lahir' | 'tanggal_lahir' |
  'alamat' | 'desa' | 'kecamatan' | 'kabupaten' | 'provinsi' | 'pendidikan_terakhir' |
  'tahun_lulus' | 'tinggi_badan' | 'berat_badan' | 'goldar' | 'ukuran_baju' |
  'status_pernikahan' | 'email' | 'no_hp' | 'nama_ortu' | 'no_hp_ortu' | 'keterangan' |
  'status_kandidat'
>

const EDITABLE_FIELDS: EditableField[] = [
  'nik', 'nama', 'jenis_kelamin', 'tempat_lahir', 'tanggal_lahir',
  'alamat', 'desa', 'kecamatan', 'kabupaten', 'provinsi', 'pendidikan_terakhir',
  'tahun_lulus', 'tinggi_badan', 'berat_badan', 'goldar', 'ukuran_baju',
  'status_pernikahan', 'email', 'no_hp', 'nama_ortu', 'no_hp_ortu', 'keterangan',
  'status_kandidat',
]

// Warna SOLID (bukan soft) untuk badge status kandidat.
// Kelas ditulis penuh karena Tailwind JIT tidak bisa membaca kelas dinamis.
const STATUS_KANDIDAT_SOLID: Record<string, string> = {
  'Calon Kandidat': 'bg-[#0E6187]',
  'Kandidat Aktif': 'bg-[#188038]',
  'Proses Belajar': 'bg-[#8430ce]',
  'Mengundurkan Diri': 'bg-[#c5221f]',
  'Lulus Pendidikan': 'bg-[#137333]',
}

function StatusKandidatBadge({ status, className = '' }: { status?: string | null; className?: string }) {
  const label = status || 'Calon Kandidat'
  const bg = STATUS_KANDIDAT_SOLID[label] || STATUS_KANDIDAT_SOLID['Calon Kandidat']
  return (
    <span className={`inline-flex items-center gap-1.5 ${bg} px-2.5 py-1 text-[11px] font-semibold text-white ${className}`}>
      <span className="h-1.5 w-1.5 bg-white" />
      {label}
    </span>
  )
}

export default function DataKandidat({ variant = 'all' }: { variant?: 'all' | 'cabang' } = {}) {
  const isCabang = variant === 'cabang'
  const navigate = useNavigate()
  const batchColors = [
    { bg: 'bg-[#e8f0fe]', border: 'border-[#aecbfa]', text: 'text-[#1967d2]', badge: 'bg-[#d2e3fc] text-[#1967d2] border-[#aecbfa]' },
    { bg: 'bg-[#e6f4ea]', border: 'border-[#a8dab5]', text: 'text-[#137333]', badge: 'bg-[#ceead6] text-[#137333] border-[#a8dab5]' },
    { bg: 'bg-[#fef7e0]', border: 'border-[#fdd663]', text: 'text-[#b06000]', badge: 'bg-[#feefc3] text-[#b06000] border-[#fdd663]' },
    { bg: 'bg-[#f1f3f4]', border: 'border-[#dadce0]', text: 'text-[#3c4043]', badge: 'bg-[#e8eaed] text-[#3c4043] border-[#dadce0]' },
    { bg: 'bg-[#fce8e6]', border: 'border-[#f6aea9]', text: 'text-[#c5221f]', badge: 'bg-[#f6d7d5] text-[#c5221f] border-[#f6aea9]' },
  ]
  const [batchColorMap, setBatchColorMap] = useState<Record<string, number>>({})
  const getBatchColor = (batchNama: string) => {
    const idx = batchColorMap[batchNama] ?? 0
    return batchColors[idx % batchColors.length]
  }
  const hexToRgba = (hex: string, alpha: number) => {
    const h = hex.replace('#', '')
    const r = parseInt(h.substring(0, 2), 16)
    const g = parseInt(h.substring(2, 4), 16)
    const b = parseInt(h.substring(4, 6), 16)
    return `rgba(${r},${g},${b},${alpha})`
  }

  const [kandidatList, setKandidatList] = useState<Kandidat[]>([])
  const [batchOptions, setBatchOptions] = useState<BatchOption[]>([])
  const [totalBatch, setTotalBatch] = useState(0)
  const [totalKandidat, setTotalKandidat] = useState(0)
  const [kandidatAktif, setKandidatAktif] = useState(0)
  const [search, setSearch] = useState('')
  const [filterBatch, setFilterBatch] = useState('')
  const [filterCabang, setFilterCabang] = useState('')
  const [showBatchDropdown, setShowBatchDropdown] = useState(false)
  const [showTambahBatchDropdown, setShowTambahBatchDropdown] = useState(false)
  const [cabangOptions, setCabangOptions] = useState<{ id: number; nama: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [batchModalKandidat, setBatchModalKandidat] = useState<Kandidat | null>(null)
  const [editForm, setEditForm] = useState<Partial<Kandidat>>({})
  const [saving, setSaving] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [editError, setEditError] = useState('')
  const [provinsiList, setProvinsiList] = useState<Wilayah[]>([])
  const [kabupatenList, setKabupatenList] = useState<Wilayah[]>([])
  const [kecamatanList, setKecamatanList] = useState<Wilayah[]>([])
  const [desaList, setDesaList] = useState<Wilayah[]>([])
  const [wilayahLoading, setWilayahLoading] = useState({ provinsi: false, kabupaten: false, kecamatan: false, desa: false })
  const [detailKandidat, setDetailKandidat] = useState<Kandidat | null>(null)
  const [detailDokumen, setDetailDokumen] = useState<any[]>([])
  const [detailDokumenLoading, setDetailDokumenLoading] = useState(false)
  const [fotoMap, setFotoMap] = useState<Record<number, string>>({})
  const [mergeModal, setMergeModal] = useState<{ kandidat: Kandidat } | null>(null)
  const [mergeQuery, setMergeQuery] = useState('')
  const [mergePage, setMergePage] = useState(1)
  const [mergeList, setMergeList] = useState<MergeKandidatItem[]>([])
  const [mergeTotal, setMergeTotal] = useState(0)
  const [mergeLoading, setMergeLoading] = useState(false)
  const [mergeMerging, setMergeMerging] = useState<number | null>(null)
  const [showTambah, setShowTambah] = useState(false)
  const [tambahLoading, setTambahLoading] = useState(false)
  const [tambahSuccess, setTambahSuccess] = useState<{ noReg: string; password: string } | null>(null)
  const [tambahError, setTambahError] = useState('')
  const [tambahErrors, setTambahErrors] = useState<Record<string, string>>({})
  const [tambahForm, setTambahForm] = useState({
    nama: '', email: '', telepon: '', nik: '', batch_id: '', product_id: '',
    real_batch: '', jenis_kelamin: '', tempat_lahir: '', tanggal_lahir: '',
    alamat: '', desa: '', kecamatan: '', kabupaten: '', provinsi: '',
    pendidikan_terakhir: '', tahun_lulus: '', tinggi_badan: '', berat_badan: '',
    goldar: '', ukuran_baju: '', status_pernikahan: '', no_hp: '',
    nama_ortu: '', no_hp_ortu: '', keterangan: '',
  })
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)
  const [sorting, setSorting] = useState<SortingState>([])
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [togglingCutiId, setTogglingCutiId] = useState<number | null>(null)
  const [updatingStatusKandidat, setUpdatingStatusKandidat] = useState<number | null>(null)
  const [openActionId, setOpenActionId] = useState<number | null>(null)
  const actionRef = useRef<HTMLDivElement>(null)
  const actionDropdownRef = useRef<HTMLDivElement>(null)
  const [actionPos, setActionPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [bulkBatchId, setBulkBatchId] = useState('')
  const [bulkMoving, setBulkMoving] = useState(false)
  const [bulkProductId, setBulkProductId] = useState('')
  const [bulkChangingProduct, setBulkChangingProduct] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importTab, setImportTab] = useState<'file' | 'paste'>('file')
  const [importPasteText, setImportPasteText] = useState('')
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importData, setImportData] = useState<Record<string, unknown>[]>([])
  const [paymentModal, setPaymentModal] = useState<{ kandidat: Kandidat; items: PembayaranItemData[]; kategoris: KategoriBayar[] } | null>(null)
  const [paymentJumlah, setPaymentJumlah] = useState('')
  const [paymentSaving, setPaymentSaving] = useState(false)
  const [importHeaders, setImportHeaders] = useState<string[]>([])
  const [importBatchId, setImportBatchId] = useState('')
  const [importProductId, setImportProductId] = useState('')
  const [importLoading, setImportLoading] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number; failed: number; created: { nama: string; email: string; no_registrasi: string; password: string }[]; errors: { row: number; message: string }[] } | null>(null)
  const [importMapping, setImportMapping] = useState<Record<string, string>>({})
  const importFileRef = useRef<HTMLInputElement>(null)
  const batchDropdownRef = useRef<HTMLDivElement>(null)
  const bulkBatchDropdownRef = useRef<HTMLDivElement>(null)
  const bulkProductDropdownRef = useRef<HTMLDivElement>(null)
  const importBatchDropdownRef = useRef<HTMLDivElement>(null)
  const [showBulkBatchDropdown, setShowBulkBatchDropdown] = useState(false)
  const [showBulkProductDropdown, setShowBulkProductDropdown] = useState(false)
  const [showImportBatchDropdown, setShowImportBatchDropdown] = useState(false)
  const [productOptions, setProductOptions] = useState<{ id: number; nama: string }[]>([])
  const [showExportLogin, setShowExportLogin] = useState(false)
  const [exportBatchId, setExportBatchId] = useState('')
  const [exportCabangId, setExportCabangId] = useState('')
  const [exporting, setExporting] = useState(false)
  const [showExportBatchDropdown, setShowExportBatchDropdown] = useState(false)
  const exportBatchDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchData()
    const batchReq = isCabang ? adminCabangApi.batches() : batchApi.list()
    batchReq.then(res => {
      const raw = res.data.data || res.data.batches || res.data || []
      const all = raw.map((b: { id: number; nama_batch: string; warna?: string | null }) => ({ id: b.id, nama: b.nama_batch, warna: b.warna ?? null }))
      setBatchOptions(prev => {
        const merged = new Map<string, { id: number; nama: string; warna: string | null }>()
        for (const b of all) merged.set(b.nama, b)
        for (const b of prev) if (!merged.has(b.nama)) merged.set(b.nama, b)
        return [...merged.values()]
      })
    }).catch(() => { })
    productApi.list().then(res => {
      const raw = res.data.data || res.data.products || res.data || []
      setProductOptions(raw.map((p: { id: number; nama: string }) => ({ id: p.id, nama: p.nama })))
    }).catch(() => { })
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node
      if (actionRef.current?.contains(target)) return
      if (actionDropdownRef.current?.contains(target)) return
      if (batchDropdownRef.current?.contains(target)) return
      if (bulkBatchDropdownRef.current?.contains(target)) return
      if (bulkProductDropdownRef.current?.contains(target)) return
      if (importBatchDropdownRef.current?.contains(target)) return
      if (exportBatchDropdownRef.current?.contains(target)) return
      setOpenActionId(null)
      setShowBatchDropdown(false)
      setShowBulkBatchDropdown(false)
      setShowBulkProductDropdown(false)
      setShowImportBatchDropdown(false)
      setShowExportBatchDropdown(false)
    }
    function handleScroll() {
      setOpenActionId(null)
    }
    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('scroll', handleScroll, true)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [])

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value)
    setPage(1)
  }

  const loadWilayahProvinsi = useCallback(() => {
    setWilayahLoading(p => ({ ...p, provinsi: true }))
    fetch(`${API_WILAYAH_BASE}/provinces.json`)
      .then(r => r.json())
      .then((data: Wilayah[]) => setProvinsiList(data))
      .catch(() => setProvinsiList([]))
      .finally(() => setWilayahLoading(p => ({ ...p, provinsi: false })))
  }, [])

  const loadWilayahKabupaten = useCallback((provId: string) => {
    setKabupatenList([])
    setKecamatanList([])
    setDesaList([])
    if (!provId) return
    setWilayahLoading(p => ({ ...p, kabupaten: true }))
    fetch(`${API_WILAYAH_BASE}/regencies/${provId}.json`)
      .then(r => r.json())
      .then((data: Wilayah[]) => setKabupatenList(data))
      .catch(() => setKabupatenList([]))
      .finally(() => setWilayahLoading(p => ({ ...p, kabupaten: false })))
  }, [])

  const loadWilayahKecamatan = useCallback((kabId: string) => {
    setKecamatanList([])
    setDesaList([])
    if (!kabId) return
    setWilayahLoading(p => ({ ...p, kecamatan: true }))
    fetch(`${API_WILAYAH_BASE}/districts/${kabId}.json`)
      .then(r => r.json())
      .then((data: Wilayah[]) => setKecamatanList(data))
      .catch(() => setKecamatanList([]))
      .finally(() => setWilayahLoading(p => ({ ...p, kecamatan: false })))
  }, [])

  const loadWilayahDesa = useCallback((kecId: string) => {
    setDesaList([])
    if (!kecId) return
    setWilayahLoading(p => ({ ...p, desa: true }))
    fetch(`${API_WILAYAH_BASE}/villages/${kecId}.json`)
      .then(r => r.json())
      .then((data: Wilayah[]) => setDesaList(data))
      .catch(() => setDesaList([]))
      .finally(() => setWilayahLoading(p => ({ ...p, desa: false })))
  }, [])

  const findWilayahIdByName = (list: Wilayah[], name: string | null): string => {
    if (!name || name === '-') return ''
    const found = list.find(i => i.name.toLowerCase() === name.toLowerCase())
    return found ? found.id : ''
  }

  useEffect(() => {
    if (!showEdit) return
    setProvinsiList([])
    setKabupatenList([])
    setKecamatanList([])
    setDesaList([])
    loadWilayahProvinsi()
  }, [showEdit, loadWilayahProvinsi])

  useEffect(() => {
    if (!showEdit) return
    const provId = findWilayahIdByName(provinsiList, editForm.provinsi ?? null)
    if (provId) loadWilayahKabupaten(provId)
  }, [editForm.provinsi, provinsiList, showEdit, loadWilayahKabupaten])

  useEffect(() => {
    if (!showEdit) return
    const kabId = findWilayahIdByName(kabupatenList, editForm.kabupaten ?? null)
    if (kabId) loadWilayahKecamatan(kabId)
  }, [editForm.kabupaten, kabupatenList, showEdit, loadWilayahKecamatan])

  useEffect(() => {
    if (!showEdit) return
    const kecId = findWilayahIdByName(kecamatanList, editForm.kecamatan ?? null)
    if (kecId) loadWilayahDesa(kecId)
  }, [editForm.kecamatan, kecamatanList, showEdit, loadWilayahDesa])

  const loadDokumen = useCallback(async (k: Kandidat) => {
    const pid = k.matching_job?.penempatan_kandidat_id
    setDetailDokumen([])
    if (!pid) return
    setDetailDokumenLoading(true)
    try {
      const res = await api.get(`/penempatan/kandidat/${pid}`)
      setDetailDokumen(Array.isArray(res.data?.data?.dokumen) ? res.data.data.dokumen : [])
    } catch (e) {
      setDetailDokumen([])
    } finally {
      setDetailDokumenLoading(false)
    }
  }, [])

  const loadFotos = useCallback(async (list: Kandidat[]) => {
    const targets = list.filter(k => k.matching_job?.penempatan_kandidat_id)
    if (targets.length === 0) return
    const results = await Promise.all(
      targets.map(k => api.get(`/penempatan/kandidat/${k.matching_job!.penempatan_kandidat_id}`)
        .then(res => {
          const docs: any[] = res.data?.data?.dokumen || []
          const foto = docs.find((d: any) => (d.jenis_dokumen || '').toLowerCase() === 'pas_foto')
          return foto?.file_url ? { [k.matching_job!.penempatan_kandidat_id!]: foto.file_url } : null
        })
        .catch(() => null)
      )
    )
    const merged: Record<number, string> = {}
    results.forEach(r => { if (r) Object.assign(merged, r) })
    if (Object.keys(merged).length) setFotoMap(prev => ({ ...prev, ...merged }))
  }, [])

  const doFetch = useCallback(function (params: Record<string, string>) {
    setLoading(true)
    const req = isCabang ? adminCabangApi.kandidat(params) : pendaftarApi.kandidat(params)
    req.then(res => {
        const allKandidat: Kandidat[] = []
        const seen = new Set<number>()
        const batches: BatchOption[] = []
        for (const b of res.data.batches) {
          batches.push({ id: b.id, nama: b.nama, warna: b.warna ?? null })
          for (const k of b.kandidat) {
            if (!seen.has(k.id)) { seen.add(k.id); allKandidat.push(k) }
          }
        }
        setKandidatList(allKandidat)
        loadFotos(allKandidat)
        if (res.data.allBatches) {
          setBatchOptions(res.data.allBatches)
          const colorMap: Record<string, number> = {}
          res.data.allBatches.forEach((b: any, i: number) => { colorMap[b.nama] = i })
          setBatchColorMap(colorMap)
        } else {
          setBatchOptions(prev => {
            const merged = new Map<string, { id: number; nama: string; warna: string | null }>()
            for (const b of batches) merged.set(b.nama, b)
            for (const b of prev) if (!merged.has(b.nama)) merged.set(b.nama, b)
            return [...merged.values()]
          })
          const colorMap: Record<string, number> = {}
          batches.forEach((b, i) => { colorMap[b.nama] = i })
          setBatchColorMap(colorMap)
        }
        setTotalBatch(res.data.totalBatch)
        setTotalKandidat(res.data.totalKandidat)
        setKandidatAktif(res.data.kandidatAktif)
        if (res.data.cabangs) setCabangOptions(res.data.cabangs)
      })
      .catch(() => { })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      doFetch(buildParams({ search }))
    }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [search])

  function buildParams(overrides?: { search?: string; batch_id?: string; cabang_id?: string }) {
    const s = overrides?.search !== undefined ? overrides.search : search
    const b = overrides?.batch_id !== undefined ? overrides.batch_id : filterBatch
    const c = overrides?.cabang_id !== undefined ? overrides.cabang_id : filterCabang
    const params: Record<string, string> = {}
    if (s) params.search = s
    if (b) params.batch_id = b
    if (c && !isCabang) params.cabang_id = c
    return params
  }

  function fetchData(s?: string) {
    doFetch(buildParams(s !== undefined ? { search: s } : undefined))
  }

  const fetchMergeList = useCallback(async () => {
    if (!mergeModal) return
    setMergeLoading(true)
    try {
      const res = await api.get('/penempatan/kandidat', {
        params: {
          page: mergePage,
          limit: 25,
          search: mergeQuery || undefined,
        },
      })
      const items: MergeKandidatItem[] = Array.isArray(res.data?.data) ? res.data.data : []
      setMergeList(items)
      setMergeTotal(res.data?.pagination?.total ?? 0)
    } catch {
      setMergeList([])
      setMergeTotal(0)
    } finally {
      setMergeLoading(false)
    }
  }, [mergeModal, mergePage, mergeQuery])

  useEffect(() => {
    const t = setTimeout(() => { fetchMergeList() }, 300)
    return () => clearTimeout(t)
  }, [mergeQuery, mergePage, mergeModal, fetchMergeList])

  const handleMerge = async (item: MergeKandidatItem) => {
    if (!mergeModal) return
    setMergeMerging(item.id)
    try {
      await api.post(`/kandidat/${mergeModal.kandidat.id}/merge-job`, {
        penempatan_kandidat_id: item.id,
      })
      Swal.fire({ icon: 'success', title: 'Berhasil', text: `Data job matching "${mergeModal.kandidat.nama}" berhasil digabungkan dengan kandidat ${item.nama_romaji || item.nama_katakana || item.id}.`, confirmButtonColor: '#0E6187' })
      setMergeModal(null)
      setMergeQuery('')
      setMergePage(1)
      fetchData()
    } catch (e: any) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: e?.response?.data?.message || 'Gagal menggabungkan data job matching.', confirmButtonColor: '#0E6187' })
    } finally {
      setMergeMerging(null)
    }
  }

  function handleFilterBatch(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value
    setFilterBatch(val)
    setPage(1)
    doFetch(buildParams({ batch_id: val }))
  }

  function handleFilterCabang(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value
    setFilterCabang(val)
    setFilterBatch('')
    setPage(1)
    doFetch(buildParams({ cabang_id: val, batch_id: '' }))
  }

  function resetFilter() {
    setSearch('')
    setFilterBatch('')
    setFilterCabang('')
    setPage(1)
    doFetch({})
  }

  async function handleToggleStatus(id: number) {
    setTogglingId(id)
    try {
      await pendaftarApi.toggleKandidatStatus(id)
      fetchData(search)
    } catch {
      alert('Gagal mengubah status kandidat')
    } finally {
      setTogglingId(null)
    }
  }

  async function handleToggleCuti(id: number) {
    setTogglingCutiId(id)
    try {
      await pendaftarApi.toggleKandidatCuti(id)
      fetchData(search)
    } catch {
      alert('Gagal mengubah status cuti')
    } finally {
      setTogglingCutiId(null)
    }
  }

  async function handleUpdateStatusKandidat(id: number, status: string) {
    setUpdatingStatusKandidat(id)
    try {
      const payload: Record<string, unknown> = { status_kandidat: status }
      if (status === 'Mengundurkan Diri') {
        payload.status_akademik = 'NONAKTIF'
      }
      await (isCabang ? adminCabangApi.updateKandidat(id, payload) : pendaftarApi.updateKandidat(id, payload))
      fetchData(search)
    } catch {
      alert('Gagal mengubah status kandidat')
    } finally {
      setUpdatingStatusKandidat(null)
    }
  }

  function startEdit(k: Kandidat) {
    setEditingId(k.id)
    const f: Partial<Kandidat> = {}
    const months: Record<string, string> = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' }
    for (const key of EDITABLE_FIELDS) {
      let v = (k as unknown as Record<string, unknown>)[key]
      if (key === 'tanggal_lahir' && typeof v === 'string' && v && v !== '-') {
        const parts = v.split(' ')
        const m = parts.length === 3 ? months[parts[1]] : null
        if (m) v = `${parts[2]}-${m}-${parts[0].padStart(2, '0')}`
      }
      f[key] = (typeof v === 'string' ? v : v == null ? '' : String(v)) as never
    }
    setEditForm(f)
    setEditError('')
    setShowEdit(true)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditForm({})
    setShowEdit(false)
    setEditError('')
  }

  async function saveEdit() {
    if (!editingId) return
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {}
      for (const key of EDITABLE_FIELDS) {
        const v = (editForm as Record<string, unknown>)[key]
        if (v === '' || v === undefined || v === null) payload[key] = null
        else payload[key] = v
      }
      await (isCabang ? adminCabangApi.updateKandidat(editingId, payload) : pendaftarApi.updateKandidat(editingId, payload))
      setEditingId(null)
      setEditForm({})
      setShowEdit(false)
      setEditError('')
      fetchData(search)
      Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Data kandidat berhasil diperbarui.', confirmButtonColor: '#0E6187', timer: 2000, timerProgressBar: true, showConfirmButton: false })
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } }; message?: string }
      const validationErrors = axiosErr?.response?.data?.errors
      const detail = validationErrors
        ? Object.entries(validationErrors).map(([f, msgs]) => `${f}: ${msgs.join(', ')}`).join('\n')
        : (axiosErr?.response?.data?.message || axiosErr?.message || String(err))
      console.error('saveEdit error:', detail, err)
      setEditError(detail)
    } finally {
      setSaving(false)
    }
  }

  function updateField(field: EditableField, value: string) {
    setEditForm(prev => ({ ...prev, [field]: value }))
  }

  function updateTambahField(field: string, value: string) {
    setTambahForm(prev => ({ ...prev, [field]: value }))
    if (tambahErrors[field]) {
      setTambahErrors(prev => { const n = { ...prev }; delete n[field]; return n })
    }
  }

  function validateTambahForm(): Record<string, string> {
    const e: Record<string, string> = {}
    const f = tambahForm

    if (!f.nama.trim()) e.nama = 'Nama lengkap wajib diisi.'
    else if (f.nama.length > 255) e.nama = 'Nama maksimal 255 karakter.'

    if (!f.email.trim()) e.email = 'Email wajib diisi.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = 'Format email tidak valid.'

    if (f.nik.length > 50) e.nik = 'NIK maksimal 50 karakter.'
    if (f.telepon.length > 20) e.telepon = 'No. telepon maksimal 20 karakter.'
    if (f.no_hp.length > 20) e.no_hp = 'No. HP maksimal 20 karakter.'
    if (f.tempat_lahir.length > 255) e.tempat_lahir = 'Tempat lahir maksimal 255 karakter.'
    if (f.desa.length > 255) e.desa = 'Nama desa maksimal 255 karakter.'
    if (f.kecamatan.length > 255) e.kecamatan = 'Nama kecamatan maksimal 255 karakter.'
    if (f.kabupaten.length > 255) e.kabupaten = 'Nama kabupaten maksimal 255 karakter.'
    if (f.provinsi.length > 255) e.provinsi = 'Nama provinsi maksimal 255 karakter.'
    if (f.pendidikan_terakhir.length > 100) e.pendidikan_terakhir = 'Pendidikan terakhir maksimal 100 karakter.'
    if (f.tahun_lulus.length > 4) e.tahun_lulus = 'Tahun lulus maksimal 4 karakter.'
    else if (f.tahun_lulus !== '' && !/^\d{4}$/.test(f.tahun_lulus)) e.tahun_lulus = 'Tahun lulus harus 4 digit angka.'
    if (f.tinggi_badan !== '' && isNaN(Number(f.tinggi_badan))) e.tinggi_badan = 'Tinggi badan harus berupa angka.'
    if (f.berat_badan !== '' && isNaN(Number(f.berat_badan))) e.berat_badan = 'Berat badan harus berupa angka.'
    if (f.nama_ortu.length > 255) e.nama_ortu = 'Nama orang tua maksimal 255 karakter.'
    if (f.no_hp_ortu.length > 20) e.no_hp_ortu = 'No. tlp orang tua maksimal 20 karakter.'
    if (f.keterangan.length > 500) e.keterangan = 'Keterangan maksimal 500 karakter.'

    return e
  }

  async function handleTambahSubmit(e: React.FormEvent) {
    e.preventDefault()
    const clientErrors = validateTambahForm()
    if (Object.keys(clientErrors).length > 0) {
      setTambahErrors(clientErrors)
      setTambahError('Mohon lengkapi semua field yang ditandai.')
      return
    }
    setTambahErrors({})
    setTambahLoading(true)
    setTambahError('')
    try {
      const payload: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(tambahForm)) {
        if (v !== '' && v !== null && v !== undefined) payload[k] = v
      }
      if (payload.batch_id) payload.batch_id = Number(payload.batch_id)
      if (payload.product_id) payload.product_id = Number(payload.product_id)
      if (payload.tinggi_badan) payload.tinggi_badan = Number(payload.tinggi_badan)
      if (payload.berat_badan) payload.berat_badan = Number(payload.berat_badan)
      const res = await (isCabang ? adminCabangApi.createKandidat(payload) : pendaftarApi.createKandidat(payload))
      setTambahSuccess({ noReg: res.data.no_registrasi, password: res.data.password })
      setTambahError('')
      setTambahErrors({})
      setTambahForm({
        nama: '', email: '', telepon: '', nik: '', batch_id: '', product_id: '',
        real_batch: '', jenis_kelamin: '', tempat_lahir: '', tanggal_lahir: '',
        alamat: '', desa: '', kecamatan: '', kabupaten: '', provinsi: '',
        pendidikan_terakhir: '', tahun_lulus: '', tinggi_badan: '', berat_badan: '',
        goldar: '', ukuran_baju: '', status_pernikahan: '', no_hp: '',
        nama_ortu: '', no_hp_ortu: '', keterangan: '',
      })
      fetchData()
    } catch (err: unknown) {
      let detail = 'Terjadi kesalahan saat menyimpan data.'
      const fieldErrors: Record<string, string> = {}
      if (err && typeof err === 'object' && 'response' in err) {
        const axErr = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }
        if (axErr.response?.data?.errors) {
          const errs = axErr.response.data.errors
          for (const [field, msgs] of Object.entries(errs)) {
            const translated: Record<string, string> = {
              nama: 'Nama', email: 'Email', nik: 'NIK', telepon: 'No. telepon',
              no_hp: 'No. HP', batch_id: 'Batch', jenis_kelamin: 'Jenis kelamin',
              tempat_lahir: 'Tempat lahir', tanggal_lahir: 'Tanggal lahir',
              alamat: 'Alamat', desa: 'Desa', kecamatan: 'Kecamatan',
              kabupaten: 'Kab./Kota', provinsi: 'Provinsi',
              pendidikan_terakhir: 'Pendidikan terakhir', tahun_lulus: 'Tahun lulus',
              tinggi_badan: 'Tinggi badan', berat_badan: 'Berat badan',
              goldar: 'Golongan darah', ukuran_baju: 'Ukuran baju',
              status_pernikahan: 'Status nikah', nama_ortu: 'Nama orang tua',
              no_hp_ortu: 'No. tlp orang tua', keterangan: 'Keterangan',
              real_batch: 'Real batch', product_id: 'Program',
            }
            const label = translated[field] || field
            fieldErrors[field] = `${label}: ${msgs[0]}`
          }
          detail = Object.values(fieldErrors).join('\n')
        } else if (axErr.response?.data?.message) {
          detail = axErr.response.data.message
          if ((axErr.response.data as Record<string, unknown>).debug) {
            detail += '\n[' + (axErr.response.data as Record<string, unknown>).debug + ']'
          }
        }
      }
      setTambahErrors(fieldErrors)
      setTambahError(detail)
    } finally {
      setTambahLoading(false)
    }
  }

  async function handlePindahBatch(kandidatId: number, newBatchId: string) {
    const id = newBatchId ? Number(newBatchId) : null
    try {
      await (isCabang ? adminCabangApi.updateKandidat(kandidatId, { batch_id: id }) : pendaftarApi.updateKandidat(kandidatId, { batch_id: id }))
      setKandidatList(prev => prev.map(k =>
        k.id === kandidatId
          ? { ...k, batch_id: id, batch_nama: batchOptions.find(b => b.id === id)?.nama || '-', batch_warna: batchOptions.find(b => b.id === id)?.warna ?? null }
          : k
      ))
    } catch {
      alert('Gagal mengubah batch')
    }
  }

  function openBatchModal(k: Kandidat) {
    setBatchModalKandidat(k)
  }

  function toggleSelect(id: number) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    const pageIds = table.getRowModel().rows.map(r => (r.original as Kandidat).id)
    const allSelected = pageIds.length > 0 && pageIds.every(id => selectedIds.has(id))
    if (allSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev)
        pageIds.forEach(id => next.delete(id))
        return next
      })
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev)
        pageIds.forEach(id => next.add(id))
        return next
      })
    }
  }

  function handleBulkDelete() {
    if (selectedIds.size === 0) return
    Swal.fire({
      title: 'Hapus Kandidat?',
      text: `${selectedIds.size} kandidat akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
    }).then(async (result) => {
      if (result.isConfirmed) {
        setBulkDeleting(true)
        try {
          await pendaftarApi.bulkDeleteKandidat(Array.from(selectedIds))
          setSelectedIds(new Set())
          fetchData(search)
          Swal.fire({
            icon: 'success',
            title: 'Berhasil!',
            text: 'Kandidat yang dipilih telah dihapus.',
            confirmButtonColor: '#0E6187',
            timer: 2000,
            timerProgressBar: true,
            showConfirmButton: false,
          })
        } catch {
          Swal.fire({
            icon: 'error',
            title: 'Gagal',
            text: 'Terjadi kesalahan saat menghapus kandidat.',
            confirmButtonColor: '#0E6187',
          })
        } finally {
          setBulkDeleting(false)
        }
      }
    })
  }

  function handleBulkMoveBatch() {
    if (selectedIds.size === 0 || !bulkBatchId) return
    const batchName = batchOptions.find(b => String(b.id) === bulkBatchId)?.nama || ''
    Swal.fire({
      title: 'Pindah Batch?',
      text: `${selectedIds.size} kandidat akan dipindahkan ke batch "${batchName}".`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0E6187',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Pindahkan!',
      cancelButtonText: 'Batal',
    }).then(async (result) => {
      if (result.isConfirmed) {
        setBulkMoving(true)
        try {
          await pendaftarApi.bulkUpdateBatchKandidat(Array.from(selectedIds), Number(bulkBatchId))
          setSelectedIds(new Set())
          setBulkBatchId('')
          fetchData(search)
          Swal.fire({
            icon: 'success',
            title: 'Berhasil!',
            text: 'Kandidat telah dipindahkan ke batch baru.',
            confirmButtonColor: '#0E6187',
            timer: 2000,
            timerProgressBar: true,
            showConfirmButton: false,
          })
        } catch {
          Swal.fire({
            icon: 'error',
            title: 'Gagal',
            text: 'Terjadi kesalahan saat memindahkan kandidat.',
            confirmButtonColor: '#0E6187',
          })
        } finally {
          setBulkMoving(false)
        }
      }
    })
  }

  function handleBulkChangeProduct() {
    if (selectedIds.size === 0 || !bulkProductId) return
    const productName = productOptions.find(p => String(p.id) === bulkProductId)?.nama || ''
    Swal.fire({
      title: 'Ubah Program?',
      text: `${selectedIds.size} kandidat akan diubah programnya menjadi "${productName}".`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0E6187',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Ubah!',
      cancelButtonText: 'Batal',
    }).then(async (result) => {
      if (result.isConfirmed) {
        setBulkChangingProduct(true)
        try {
          await pendaftarApi.bulkUpdateProductKandidat(Array.from(selectedIds), Number(bulkProductId))
          setSelectedIds(new Set())
          setBulkProductId('')
          fetchData(search)
          Swal.fire({
            icon: 'success',
            title: 'Berhasil!',
            text: 'Program kandidat telah diubah.',
            confirmButtonColor: '#0E6187',
            timer: 2000,
            timerProgressBar: true,
            showConfirmButton: false,
          })
        } catch {
          Swal.fire({
            icon: 'error',
            title: 'Gagal',
            text: 'Terjadi kesalahan saat mengubah program kandidat.',
            confirmButtonColor: '#0E6187',
          })
        } finally {
          setBulkChangingProduct(false)
        }
      }
    })
  }

  async function handleSyncNoRegistrasi() {
    const result = await Swal.fire({
      title: 'Sync No. Registrasi?',
      text: 'Akan memperbarui nomor registrasi yang belum memiliki kode cabang. Lanjutkan?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0E6187',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Sync!',
      cancelButtonText: 'Batal',
    })
    if (!result.isConfirmed) return
    try {
      const res = await pendaftarApi.syncNoRegistrasi()
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: res.data?.message || 'No. Registrasi tersinkronisasi.',
        confirmButtonColor: '#0E6187',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      })
      fetchData(search)
    } catch {
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: 'Terjadi kesalahan saat sinkronisasi.',
        confirmButtonColor: '#0E6187',
      })
    }
  }

  const filteredList = kandidatList

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      'Calon Kandidat': 0,
      'Kandidat Aktif': 0,
      'Proses Belajar': 0,
      'Mengundurkan Diri': 0,
      'Lulus Pendidikan': 0,
    }
    let nonaktif = 0
    let cuti = 0
    for (const k of kandidatList) {
      const sk = k.status_kandidat || 'Calon Kandidat'
      if (counts[sk] !== undefined) counts[sk]++
      if (k.status_akademik === 'NONAKTIF') nonaktif++
      if (k.is_cuti) cuti++
    }
    const kandidatActive = kandidatList.filter(k =>
      !k.is_cuti &&
      k.status_kandidat !== 'Mengundurkan Diri' &&
      k.status_kandidat !== 'Lulus Pendidikan' &&
      k.status_akademik !== 'NONAKTIF'
    ).length
    return { ...counts, KandidatActive: kandidatActive, Nonaktif: nonaktif, Cuti: cuti } as Record<string, number>
  }, [kandidatList])

  const totalPages = Math.max(1, Math.ceil(filteredList.length / perPage))
  const safePage = Math.min(page, totalPages)

  const thBase = 'border-b border-[#e8eaed] px-4 py-3 text-xs font-medium text-[#5f6368] '
  const columns: ColumnDef<Kandidat, any>[] = [
    { id: 'no', header: 'No', enableSorting: false, meta: { thClass: `${thBase}text-center w-[36px] min-w-[36px]` } },
    ...(isCabang
      ? []
      : [{
          id: 'checkbox',
          header: ({ table: t }: any) => (
            <input
              type="checkbox"
              checked={t.getRowModel().rows.length > 0 && t.getRowModel().rows.every((r: any) => selectedIds.has((r.original as Kandidat).id))}
              onChange={toggleSelectAll}
              className="h-4 w-4 border-[#bdc1c6] text-[#1a73e8] focus:ring-[#1a73e8] cursor-pointer"
            />
          ),
          enableSorting: false,
          meta: { thClass: `${thBase}text-center w-[40px] min-w-[40px]` },
        }]),
    { id: 'nik', accessorKey: 'nik', header: 'NIK', meta: { thClass: `${thBase}w-[150px] min-w-[150px]` } },
    { id: 'no_registrasi', accessorKey: 'no_registrasi', header: 'No. Registrasi', meta: { thClass: `${thBase}w-[150px] min-w-[150px]` } },
    { id: 'nama', accessorKey: 'nama', header: 'Nama Kandidat', meta: { thClass: `${thBase}w-[180px] min-w-[180px]` } },
    { id: 'batch', accessorFn: k => k.batch_nama, header: 'Batch', meta: { thClass: `${thBase}w-[110px] min-w-[110px]` } },
    { id: 'cabang', accessorFn: k => k.cabang_nama, header: 'Cabang', meta: { thClass: `${thBase}w-[110px] min-w-[110px]` } },
    { id: 'jk', accessorFn: k => k.jenis_kelamin, header: 'JK', meta: { thClass: `${thBase}text-center w-[36px] min-w-[36px]` } },
    { id: 'ttl', accessorFn: k => `${k.tempat_lahir} ${k.tanggal_lahir}`, header: 'Tempat, Tanggal Lahir', meta: { thClass: `${thBase}w-[170px] min-w-[170px]` } },
    { id: 'alamat', accessorKey: 'alamat', header: 'Alamat', meta: { thClass: `${thBase}w-[200px] min-w-[200px]` } },
    { id: 'desa', accessorKey: 'desa', header: 'Desa', meta: { thClass: `${thBase}w-[110px] min-w-[110px]` } },
    { id: 'kecamatan', accessorKey: 'kecamatan', header: 'Kecamatan', meta: { thClass: `${thBase}w-[110px] min-w-[110px]` } },
    { id: 'kabupaten', accessorKey: 'kabupaten', header: 'Kab./Kota', meta: { thClass: `${thBase}w-[120px] min-w-[120px]` } },
    { id: 'provinsi', accessorKey: 'provinsi', header: 'Provinsi', meta: { thClass: `${thBase}w-[110px] min-w-[110px]` } },
    { id: 'pendidikan_terakhir', accessorKey: 'pendidikan_terakhir', header: 'Pend. Terakhir', meta: { thClass: `${thBase}w-[110px] min-w-[110px]` } },
    { id: 'tahun_lulus', accessorKey: 'tahun_lulus', header: 'Tahun Lulus', meta: { thClass: `${thBase}text-center w-[60px] min-w-[60px]` } },
    { id: 'tinggi_badan', accessorKey: 'tinggi_badan', header: 'TB', meta: { thClass: `${thBase}text-center w-[40px] min-w-[40px]` } },
    { id: 'berat_badan', accessorKey: 'berat_badan', header: 'BB', meta: { thClass: `${thBase}text-center w-[40px] min-w-[40px]` } },
    { id: 'goldar', accessorKey: 'goldar', header: 'Goldar', meta: { thClass: `${thBase}text-center w-[50px] min-w-[50px]` } },
    { id: 'ukuran_baju', accessorKey: 'ukuran_baju', header: 'Uk. Baju', meta: { thClass: `${thBase}text-center w-[55px] min-w-[55px]` } },
    { id: 'status_pernikahan', accessorKey: 'status_pernikahan', header: 'Status Nikah', meta: { thClass: `${thBase}w-[90px] min-w-[90px]` } },
    { id: 'email', accessorKey: 'email', header: 'E-mail', meta: { thClass: `${thBase}w-[200px] min-w-[200px]` } },
    { id: 'no_hp', accessorKey: 'no_hp', header: 'No. Tlp', meta: { thClass: `${thBase}w-[110px] min-w-[110px]` } },
    { id: 'nama_ortu', accessorKey: 'nama_ortu', header: 'Nama Orang Tua/Wali', meta: { thClass: `${thBase}w-[140px] min-w-[140px]` } },
    { id: 'no_hp_ortu', accessorKey: 'no_hp_ortu', header: 'No. Tlp Orang Tua', meta: { thClass: `${thBase}w-[110px] min-w-[110px]` } },
    { id: 'kontrak', header: 'Kontrak', enableSorting: false, meta: { thClass: `${thBase}text-center w-[150px] min-w-[150px]` } },
    { id: 'status_kandidat', accessorKey: 'status_kandidat', header: 'Status Kandidat', meta: { thClass: `${thBase}text-center w-[150px] min-w-[150px]` } },
    { id: 'keterangan', accessorKey: 'keterangan', header: 'Ket.', meta: { thClass: `${thBase}w-[140px] min-w-[140px]` } },
    { id: 'aksi', header: 'Aksi', enableSorting: false, meta: { thClass: `${thBase}sticky right-0 z-30 border-l border-[#dadce0] bg-white text-center w-[60px] min-w-[60px]` } },
  ]

  const table = useReactTable({
    data: filteredList,
    columns,
    state: { sorting, pagination: { pageIndex: safePage - 1, pageSize: perPage } },
    onSortingChange: updater => { setSorting(updater); setPage(1) },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: false,
  })

  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      Disetujui: { bg: 'bg-[#e6f4ea] border-[#a8dab5]', text: 'text-[#137333]', label: 'Disetujui' },
      Ditolak: { bg: 'bg-[#fce8e6] border-[#f6aea9]', text: 'text-[#a50e0e]', label: 'Ditolak' },
      Pending: { bg: 'bg-[#fef7e0] border-[#fdd663]', text: 'text-[#b06000]', label: 'Pending' },
    }
    const s = map[status] || { bg: 'bg-[#f8f9fa] border-[#dadce0]', text: 'text-[#5f6368]', label: status }
    return (
      <span className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-[11px] font-semibold ${s.bg} ${s.text}`}>
        <span className={`h-1.5 w-1.5 ${status === 'Disetujui' ? 'bg-[#0E6187]' : status === 'Ditolak' ? 'bg-[#d93025]' : 'bg-[#e37400]'}`} />
        {s.label}
      </span>
    )
  }

  function exportCSV() {
    const headers = [
      'No', 'NIK', 'No. Registrasi', 'Nama Kandidat', 'Batch', 'Cabang',
      'Jenis Kelamin', 'Tempat Lahir', 'Tanggal Lahir', 'Alamat', 'Desa',
      'Kecamatan', 'Kab./Kota', 'Provinsi', 'Pendidikan Terakhir', 'Tahun Lulus',
      'Tinggi Badan', 'Berat Badan', 'Golongan Darah', 'Ukuran Baju',
      'Status Nikah', 'E-mail', 'No. Tlp', 'Nama Orang Tua', 'No. Tlp Orang Tua',
      'Status', 'Status Kandidat', 'Keterangan'
    ]
    const rows = filteredList.map((k, i) => [
      i + 1, k.nik, k.no_registrasi, k.nama, k.batch_nama, k.cabang_nama,
      k.jenis_kelamin, k.tempat_lahir, k.tanggal_lahir, k.alamat, k.desa,
      k.kecamatan, k.kabupaten, k.provinsi, k.pendidikan_terakhir, k.tahun_lulus,
      k.tinggi_badan, k.berat_badan, k.goldar, k.ukuran_baju,
      k.status_pernikahan, k.email, k.no_hp, k.nama_ortu, k.no_hp_ortu,
      k.status, k.status_kandidat, k.keterangan
    ])
    const bom = '\uFEFF'
    const csvContent = bom + [headers, ...rows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `data-kandidat-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  function exportExcel() {
    const headers = [
      'No', 'NIK', 'No. Registrasi', 'Nama Kandidat', 'Batch', 'Cabang',
      'Jenis Kelamin', 'Tempat Lahir', 'Tanggal Lahir', 'Alamat', 'Desa',
      'Kecamatan', 'Kab./Kota', 'Provinsi', 'Pendidikan Terakhir', 'Tahun Lulus',
      'Tinggi Badan', 'Berat Badan', 'Golongan Darah', 'Ukuran Baju',
      'Status Nikah', 'E-mail', 'No. Tlp', 'Nama Orang Tua', 'No. Tlp Orang Tua',
      'Status', 'Status Kandidat', 'Keterangan'
    ]
    const rows = filteredList.map((k, i) => [
      i + 1, k.nik, k.no_registrasi, k.nama, k.batch_nama, k.cabang_nama,
      k.jenis_kelamin, k.tempat_lahir, k.tanggal_lahir, k.alamat, k.desa,
      k.kecamatan, k.kabupaten, k.provinsi, k.pendidikan_terakhir, k.tahun_lulus,
      k.tinggi_badan, k.berat_badan, k.goldar, k.ukuran_baju,
      k.status_pernikahan, k.email, k.no_hp, k.nama_ortu, k.no_hp_ortu,
      k.status, k.status_kandidat, k.keterangan
    ])
    const cellStyle = ' style="mso-number-format:\'@\'"'
    const tableRows = [
      `<tr>${headers.map(h => `<th style="background:#1a73e8;color:white;font-weight:bold;padding:6px 10px;border:1px solid #ccc">${h}</th>`).join('')}</tr>`,
      ...rows.map((r, i) => `<tr>${r.map(v => `<td${cellStyle} style="padding:4px 10px;border:1px solid #ccc;background:${i % 2 === 0 ? '#fff' : '#f9fafb'}">${String(v ?? '')}</td>`).join('')}</tr>`)
    ]
    const htmlTable = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Data Kandidat</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table>${tableRows.join('')}</table></body></html>`
    const blob = new Blob([htmlTable], { type: 'application/vnd.ms-excel;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `data-kandidat-${new Date().toISOString().slice(0, 10)}.xls`
    link.click()
    URL.revokeObjectURL(url)
  }

  async function handleExportLoginPdf() {
    if (!exportBatchId) {
      Swal.fire({ icon: 'error', title: 'Pilih Batch', text: 'Pilih batch terlebih dahulu sebelum export.', confirmButtonColor: '#0E6187' })
      return
    }
    setExporting(true)
    try {
      const params: Record<string, string> = { batch_id: exportBatchId }
      if (exportCabangId) params.cabang_id = exportCabangId
      const res = await (isCabang ? adminCabangApi.kandidat(params) : pendaftarApi.kandidat(params))
      const rows: { noReg: string; nama: string; email: string; password: string }[] = []
      for (const b of res.data.batches || []) {
        for (const k of b.kandidat || []) {
          rows.push({
            noReg: k.no_registrasi || '-',
            nama: k.nama || '-',
            email: k.email || '-',
            password: k.password_plain || '-',
          })
        }
      }
      if (rows.length === 0) {
        Swal.fire({ icon: 'warning', title: 'Data Kosong', text: 'Tidak ada kandidat untuk batch terpilih.', confirmButtonColor: '#0E6187' })
        return
      }
      const batchNama = batchOptions.find(b => String(b.id) === exportBatchId)?.nama || 'Batch terpilih'
      const cabangNama = cabangOptions.find(c => String(c.id) === exportCabangId)?.nama
        || (cabangOptions.length === 1 ? cabangOptions[0].nama : 'Semua Cabang')
      exportLoginPdf(rows, batchNama, cabangNama)
      setShowExportLogin(false)
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Terjadi kesalahan saat mengambil data kandidat.', confirmButtonColor: '#0E6187' })
    } finally {
      setExporting(false)
    }
  }

  function exportLoginPdf(rows: { noReg: string; nama: string; email: string; password: string }[], batchNama: string, cabangNama: string) {
    const pdf = new jsPDF('l', 'mm', 'a4')
    const pageW = pdf.internal.pageSize.getWidth()
    const pageH = pdf.internal.pageSize.getHeight()
    const brand: [number, number, number] = [14, 97, 135]
    const margin = 12
    const colWidths = [12, 44, 62, 74, 50]
    const startX = margin
    const tableW = colWidths.reduce((a, b) => a + b, 0)
    const rowH = 8
    const sanitize = (s: string) => s.replace(/[^\x00-\xFF]/g, '.')
    const truncate = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + '.' : s)
    let y = 0

    const drawHeader = () => {
      pdf.setFillColor(...brand)
      pdf.rect(0, 0, pageW, 16, 'F')
      pdf.setTextColor(255, 255, 255)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(13)
      pdf.text('DATA AKUN LOGIN KANDIDAT', margin, 10.5)
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(8)
      pdf.text('mendunia.id', pageW - margin, 10.5, { align: 'right' })

      y = 23
      pdf.setTextColor(30, 41, 59)
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'bold')
      pdf.text(`Batch  : ${sanitize(batchNama)}`, margin, y)
      pdf.text(`Cabang : ${sanitize(cabangNama)}`, margin + 100, y)
      pdf.text(`Cetak  : ${new Date().toLocaleString('id-ID')}`, pageW - margin, y, { align: 'right' })
      y += 5
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(8)
      pdf.setTextColor(100, 116, 139)
      pdf.text(`Total ${rows.length} kandidat. Login di aplikasi menggunakan E-mail dan Password.`, margin, y)
      y += 7

      pdf.setFillColor(...brand)
      pdf.setTextColor(255, 255, 255)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(8)
      pdf.rect(startX, y, tableW, 8, 'F')
      const headers = ['No', 'No. Registrasi', 'Nama Kandidat', 'E-mail', 'Password']
      let hx = startX
      headers.forEach((h, i) => {
        pdf.text(h, hx + 2, y + 5.5)
        hx += colWidths[i]
      })
      y += 8
    }

    drawHeader()

    rows.forEach((r, i) => {
      if (y + rowH > pageH - 14) {
        pdf.setFillColor(226, 232, 240)
        pdf.rect(0, pageH - 14, pageW, 14, 'F')
        pdf.setTextColor(71, 85, 105)
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(7)
        pdf.text(`Halaman ${pdf.getNumberOfPages()}`, pageW - margin, pageH - 8, { align: 'right' })
        pdf.addPage()
        drawHeader()
      }
      if (i % 2 === 1) {
        pdf.setFillColor(248, 250, 252)
        pdf.rect(startX, y, tableW, rowH, 'F')
      }
      pdf.setTextColor(30, 41, 59)
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(8)
      const cells = [String(i + 1), r.noReg, r.nama, r.email, r.password]
      const limits = [11, 40, 60, 70, 46]
      let x = startX
      cells.forEach((t, c) => {
        pdf.text(truncate(sanitize(t), limits[c]), x + 2, y + 5.5)
        x += colWidths[c]
      })
      y += rowH
    })

    pdf.setFillColor(226, 232, 240)
    pdf.rect(0, pageH - 14, pageW, 14, 'F')
    pdf.setTextColor(71, 85, 105)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(7)
    pdf.text(`Halaman ${pdf.getNumberOfPages()}`, pageW - margin, pageH - 8, { align: 'right' })

    const safeName = batchNama.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    pdf.save(`akun-login-${safeName}-${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  const fieldOptions: { value: string; label: string }[] = [
    { value: '', label: '— Lewati —' },
    { value: 'nik', label: 'NIK' },
    { value: 'nama', label: 'Nama Kandidat' },
    { value: 'email', label: 'E-mail' },
    { value: 'telepon', label: 'No. Telepon' },
    { value: 'jenis_kelamin', label: 'Jenis Kelamin (L/P)' },
    { value: 'tempat_lahir', label: 'Tempat Lahir' },
    { value: 'tanggal_lahir', label: 'Tanggal Lahir' },
    { value: 'alamat', label: 'Alamat' },
    { value: 'desa', label: 'Desa' },
    { value: 'kecamatan', label: 'Kecamatan' },
    { value: 'kabupaten', label: 'Kab./Kota' },
    { value: 'provinsi', label: 'Provinsi' },
    { value: 'pendidikan_terakhir', label: 'Pendidikan Terakhir' },
    { value: 'tahun_lulus', label: 'Tahun Lulus' },
    { value: 'tinggi_badan', label: 'Tinggi Badan' },
    { value: 'berat_badan', label: 'Berat Badan' },
    { value: 'goldar', label: 'Golongan Darah' },
    { value: 'ukuran_baju', label: 'Ukuran Baju' },
    { value: 'status_pernikahan', label: 'Status Nikah' },
    { value: 'no_hp', label: 'No. HP' },
    { value: 'nama_ortu', label: 'Nama Orang Tua' },
    { value: 'no_hp_ortu', label: 'No. HP Orang Tua' },
    { value: 'keterangan', label: 'Keterangan' },
  ]

  const autoMapHeaders = (headers: string[]): Record<string, string> => {
    const mapping: Record<string, string> = {}
    const normalizedFields: Record<string, string> = {
      'nik': 'nik', 'no_ktp': 'nik', 'no. ktp': 'nik',
      'nama': 'nama', 'nama lengkap': 'nama', 'nama kandidat': 'nama',
      'email': 'email', 'e-mail': 'email', 'alamat email': 'email',
      'no. handphone': 'no_hp', 'no hp': 'no_hp', 'no. hp': 'no_hp', 'handphone': 'no_hp', 'phone': 'no_hp', 'telepon': 'telepon', 'no. telepon': 'telepon', 'no telp': 'telepon', 'telp': 'telepon',
      'jk': 'jenis_kelamin', 'jenis kelamin': 'jenis_kelamin', 'jenis_kelamin': 'jenis_kelamin', 'kelamin': 'jenis_kelamin', 'sex': 'jenis_kelamin',
      'tempat tanggal lahir': 'tempat_lahir', 'tempat lahir': 'tempat_lahir', 'tempat_lahir': 'tempat_lahir', 'tempat': 'tempat_lahir',
      'tanggal lahir': 'tanggal_lahir', 'tanggal_lahir': 'tanggal_lahir', 'tgl lahir': 'tanggal_lahir', 'tgl_lahir': 'tanggal_lahir', 'date of birth': 'tanggal_lahir', 'dob': 'tanggal_lahir',
      'alamat': 'alamat', 'address': 'alamat', 'street': 'alamat',
      'desa': 'desa', 'kelurahan': 'desa', 'village': 'desa',
      'kecamatan': 'kecamatan', 'district': 'kecamatan',
      'kabupaten / kota': 'kabupaten', 'kab./kota': 'kabupaten', 'kabupaten': 'kabupaten', 'kota': 'kabupaten', 'kab/kota': 'kabupaten', 'kab. / kota': 'kabupaten',
      'provinsi': 'provinsi', 'province': 'provinsi',
      'pend. terakhir': 'pendidikan_terakhir', 'pendidikan terakhir': 'pendidikan_terakhir', 'pendidikan_terakhir': 'pendidikan_terakhir', 'pendidikan': 'pendidikan_terakhir', 'education': 'pendidikan_terakhir',
      'tahun lulus': 'tahun_lulus', 'tahun_lulus': 'tahun_lulus', 'year': 'tahun_lulus',
      'tb': 'tinggi_badan', 'tinggi badan': 'tinggi_badan', 'tinggi_badan': 'tinggi_badan', 'height': 'tinggi_badan', 'tinggi': 'tinggi_badan',
      'bb': 'berat_badan', 'berat badan': 'berat_badan', 'berat_badan': 'berat_badan', 'weight': 'berat_badan', 'berat': 'berat_badan',
      'goldar': 'goldar', 'golongan darah': 'goldar', 'golongan_darah': 'goldar', 'blood': 'goldar', 'gol darah': 'goldar',
      'uk. baju': 'ukuran_baju', 'ukuran baju': 'ukuran_baju', 'ukuran_baju': 'ukuran_baju', 'baju': 'ukuran_baju', 'size': 'ukuran_baju',
      'status nikah': 'status_pernikahan', 'status pernikahan': 'status_pernikahan', 'status_pernikahan': 'status_pernikahan', 'marital': 'status_pernikahan', 'status menikah': 'status_pernikahan',
      'no. tlp orang tua/wali': 'no_hp_ortu', 'no. tlp orang tua': 'no_hp_ortu', 'no tlp ortu': 'no_hp_ortu', 'no. tlp ortu': 'no_hp_ortu', 'no hp ortu': 'no_hp_ortu', 'no. hp ortu': 'no_hp_ortu', 'no_hp_ortu': 'no_hp_ortu', 'no hp orang tua': 'no_hp_ortu', 'telepon orang tua': 'no_hp_ortu',
      'nama ortu': 'nama_ortu', 'nama orang tua / wali': 'nama_ortu', 'nama orang tua': 'nama_ortu', 'nama_ortu': 'nama_ortu', 'nama orangtua': 'nama_ortu', 'orang tua': 'nama_ortu',
      'ket.': 'keterangan', 'keterangan': 'keterangan', 'catatan': 'keterangan', 'note': 'keterangan', 'remarks': 'keterangan',
    }
    headers.forEach(h => {
      const normalized = h.toLowerCase().trim()
      if (normalizedFields[normalized]) {
        mapping[h] = normalizedFields[normalized]
      } else {
        mapping[h] = ''
      }
    })
    return mapping
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportFile(file)
    setImportResult(null)
    const reader = new FileReader()
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target?.result, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })
      if (raw.length === 0) return
      const hdrs = Object.keys(raw[0])
      setImportHeaders(hdrs)
      setImportData(raw)
      setImportMapping(autoMapHeaders(hdrs))
    }
    reader.readAsArrayBuffer(file)
  }

  function handlePasteParse() {
    const text = importPasteText.replace(/\r\n?/g, '\n')
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    if (lines.length === 0) return
    const cells = lines.map(l => l.split('\t'))
    const maxCols = Math.max(...cells.map(c => c.length))

    const normKnown: Record<string, string> = {
      'nik': 'nik', 'no ktp': 'nik',
      'no. registrasi': 'no_registrasi', 'no registrasi': 'no_registrasi',
      'nama': 'nama', 'nama kandidat': 'nama', 'nama lengkap': 'nama',
      'batch': 'batch', 'nama batch': 'batch',
      'jk': 'jenis_kelamin', 'jenis kelamin': 'jenis_kelamin',
      'tempat, tanggal lahir': 'tempat_lahir', 'tempat tanggal lahir': 'tempat_lahir',
      'tempat lahir': 'tempat_lahir', 'tempat': 'tempat_lahir', 'ttl': 'tempat_lahir',
      'tanggal lahir': 'tanggal_lahir',
      'alamat': 'alamat', 'desa': 'desa', 'kecamatan': 'kecamatan',
      'kab./kota': 'kabupaten', 'kabupaten': 'kabupaten', 'kota': 'kabupaten',
      'provinsi': 'provinsi',
      'no. tlp': 'no_hp', 'no tlp': 'no_hp', 'no. handphone': 'no_hp', 'no hp': 'no_hp', 'telepon': 'telepon',
      'pend. terakhir': 'pendidikan_terakhir', 'pendidikan terakhir': 'pendidikan_terakhir',
      'tahun lulus': 'tahun_lulus', 'tb': 'tinggi_badan', 'bb': 'berat_badan',
      'goldar': 'goldar', 'golongan darah': 'goldar',
      'uk. baju': 'ukuran_baju', 'ukuran baju': 'ukuran_baju',
      'status nikah': 'status_pernikahan', 'status pernikahan': 'status_pernikahan',
      'e-mail': 'email', 'email': 'email',
      'nama orang tua/wali': 'nama_ortu', 'nama orang tua': 'nama_ortu', 'nama ortu': 'nama_ortu',
      'no. tlp orang tua': 'no_hp_ortu', 'no. tlp ortu': 'no_hp_ortu', 'no tlp ortu': 'no_hp_ortu',
      'ket.': 'keterangan', 'keterangan': 'keterangan',
    }
    const defaultTemplate = ['nik', 'no_registrasi', 'nama', 'batch', 'jenis_kelamin', 'tempat_lahir', 'alamat', 'desa', 'kecamatan', 'kabupaten', 'provinsi', 'no_hp', 'pendidikan_terakhir', 'tahun_lulus', 'tinggi_badan', 'berat_badan', 'goldar', 'ukuran_baju', 'status_pernikahan', 'email', 'nama_ortu', 'no_hp_ortu']

    let headers: string[] = []
    for (let i = 0; i < maxCols; i++) headers.push(`Kolom ${i + 1}`)

    let startIdx = 0
    const firstRowNorm = cells[0].map(c => c.toLowerCase().trim())
    const headerHits = firstRowNorm.filter(c => normKnown[c]).length

    const mapping: Record<string, string> = {}
    if (headerHits >= 2) {
      headers = cells[0].map((c, i) => c.trim() || `Kolom ${i + 1}`)
      headers.forEach(h => {
        mapping[h] = normKnown[h.toLowerCase().trim()] || ''
      })
      startIdx = 1
    } else {
      headers.forEach((h, i) => {
        mapping[h] = defaultTemplate[i] || ''
      })
    }

    const rows: Record<string, unknown>[] = []
    for (let i = startIdx; i < cells.length; i++) {
      const row: Record<string, unknown> = {}
      headers.forEach((h, j) => { row[h] = cells[i][j] ?? '' })
      rows.push(row)
    }

    setImportHeaders(headers)
    setImportData(rows)
    setImportMapping(mapping)
    setImportResult(null)

    const batchField = Object.keys(mapping).find(k => mapping[k] === 'batch')
    if (batchField && rows[0]) {
      const namaBatch = String(rows[0][batchField] ?? '').trim()
      if (namaBatch) {
        const found = batchOptions.find(b => b.nama.toLowerCase() === namaBatch.toLowerCase())
          || batchOptions.find(b => namaBatch.toLowerCase().includes(b.nama.toLowerCase()) || b.nama.toLowerCase().includes(namaBatch.toLowerCase()))
        if (found) setImportBatchId(String(found.id))
      }
    }
  }

  function parseTanggalLahir(val: string): { tempat: string; tanggal: string } {
    const v = (val || '').trim()
    if (!v) return { tempat: '', tanggal: '' }
    const bulanMap: Record<string, string> = {
      januari: '01', februari: '02', maret: '03', april: '04', mei: '05', juni: '06',
      juli: '07', agustus: '08', september: '09', oktober: '10', november: '11', desember: '12',
      jan: '01', feb: '02', mar: '03', apr: '04', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
    }
    const re = /(\d{1,2})\s+(\w+)\s+(\d{4})/i
    const m = v.match(re)
    if (m) {
      const day = m[1].padStart(2, '0')
      const mon = bulanMap[m[2].toLowerCase()] || '01'
      const year = m[3]
      const tempat = v.slice(0, v.indexOf(m[0])).replace(/[,]+\s*$/, '').trim()
      return { tempat, tanggal: `${year}-${mon}-${day}` }
    }
    return { tempat: v, tanggal: '' }
  }

  async function handleImportSubmit() {
    if (!importBatchId || importData.length === 0) return
    setImportLoading(true)
    try {
      const mappedData = importData.map(row => {
        const out: Record<string, unknown> = {}
        importHeaders.forEach(h => {
          const field = importMapping[h]
          if (field) out[field] = row[h] ?? ''
        })
        if (out.tempat_lahir && !out.tanggal_lahir) {
          const parsed = parseTanggalLahir(String(out.tempat_lahir))
          out.tempat_lahir = parsed.tempat
          out.tanggal_lahir = parsed.tanggal
        }
        return out
      }).filter(r => r.nama && r.email)

      const headerLabels = new Set([
        'no', 'nik', 'no. registrasi', 'nama kandidat', 'batch', 'jk', 'jenis kelamin',
        'tempat tanggal lahir', 'tempat lahir', 'alamat', 'desa', 'kecamatan',
        'kabupaten / kota', 'kab./kota', 'provinsi', 'no. handphone', 'no. hp',
        'pend. terakhir', 'pendidikan terakhir', 'tahun lulus', 'tb', 'bb',
        'goldar', 'golongan darah', 'ukuran baju', 'uk. baju', 'status pernikahan',
        'status nikah', 'e-mail', 'email', 'nama orang tua / wali', 'nama orang tua',
        'no. tlp orang tua/wali', 'no. tlp ortu', 'pre-mcu', 'ket.', 'keterangan',
      ])
      const validJK = new Set(['L', 'P', 'Laki-laki', 'Perempuan', 'laki-laki', 'perempuan'])
      const validGoldar = new Set(['A', 'B', 'AB', 'O', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
      const validUkuran = new Set(['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL'])
      const validNikah = new Set(['Belum Nikah', 'Belum Menikah', 'Nikah', 'Cerai', 'Cerai Hidup', 'Cerai Mati'])

      const cleanData = mappedData.filter((r, idx) => {
        const nama = String(r.nama || '').trim().toLowerCase()
        if (headerLabels.has(nama)) return false
        if (r.jenis_kelamin && !validJK.has(String(r.jenis_kelamin).trim())) {
          r.jenis_kelamin = ''
        }
        if (r.goldar) {
          const g = String(r.goldar).trim().toUpperCase()
          r.goldar = validGoldar.has(g) ? g.replace('+', '').replace('-', '') : ''
        }
        if (r.ukuran_baju) {
          const u = String(r.ukuran_baju).trim().toUpperCase()
          r.ukuran_baju = validUkuran.has(u) ? u : ''
        }
        if (r.status_pernikahan) {
          const s = String(r.status_pernikahan).trim()
          const found = [...validNikah].find(v => v.toLowerCase() === s.toLowerCase())
          r.status_pernikahan = found || ''
        }
        if (r.nik) {
          const nik = String(r.nik).replace(/\D/g, '')
          r.nik = nik.slice(0, 50)
        }
        if (r.no_hp) r.no_hp = String(r.no_hp).replace(/[^0-9+\-\s]/g, '').trim().slice(0, 20)
        if (r.no_hp_ortu) r.no_hp_ortu = String(r.no_hp_ortu).replace(/[^0-9+\-\s;]/g, '').replace(/;'/g, '').trim().slice(0, 20)
        if (r.tahun_lulus) r.tahun_lulus = String(r.tahun_lulus).replace(/\D/g, '').slice(0, 4)
        if (r.tinggi_badan) {
          const tb = String(r.tinggi_badan).replace(/[^\d]/g, '')
          r.tinggi_badan = tb.length > 0 && Number(tb) > 0 && Number(tb) <= 250 ? tb.slice(0, 3) : ''
        }
        if (r.berat_badan) {
          const bb = String(r.berat_badan).replace(/[^\d]/g, '')
          r.berat_badan = bb.length > 0 && Number(bb) > 0 && Number(bb) <= 250 ? bb.slice(0, 3) : ''
        }
        return true
      })
      const skippedCount = mappedData.length - cleanData.length
      if (cleanData.length === 0) {
        setImportResult({ success: 0, failed: importData.length, created: [], errors: [{ row: 0, message: 'Tidak ada data valid (nama dan email wajib ada)' }] })
        return
      }
      const res = await pendaftarApi.importKandidat({ batch_id: Number(importBatchId), product_id: importProductId ? Number(importProductId) : null, data: cleanData })
      const result = res.data
      if (skippedCount > 0) {
        result.errors = [{ row: 0, message: `${skippedCount} baris dilewati (header/korup)` }, ...(result.errors || [])]
      }
      setImportResult(result)
      fetchData()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string; errors?: { row: number; message: string }[] } } }
      setImportResult({
        success: 0,
        failed: importData.length,
        created: [],
        errors: axiosErr.response?.data?.errors || [{ row: 0, message: axiosErr.response?.data?.message || 'Gagal mengimport data' }],
      })
    } finally {
      setImportLoading(false)
    }
  }

  function resetImport() {
    setShowImport(false)
    setImportTab('file')
    setImportPasteText('')
    setImportFile(null)
    setImportData([])
    setImportHeaders([])
    setImportBatchId('')
    setImportProductId('')
    setImportLoading(false)
    setImportResult(null)
    setImportMapping({})
    if (importFileRef.current) importFileRef.current.value = ''
  }

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1.5 text-xs text-[#5f6368]" aria-label="Breadcrumb">
        <Link to="/" className="flex items-center gap-1 transition-colors hover:text-[#1a73e8]">
          <LayoutDashboard size={13} />
          <span>Beranda</span>
        </Link>
        <ChevronRight size={12} className="text-[#9aa0a6]" />
        <Link to={isCabang ? '/admin-cabang/pendaftar' : '/pendaftar'} className="transition-colors hover:text-[#1a73e8]">
          Pendaftaran
        </Link>
        <ChevronRight size={12} className="text-[#9aa0a6]" />
        <span className="font-medium text-[#3c4043]">Data Kandidat</span>
      </nav>

      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 border-b border-[#dadce0] pb-4 sm:flex-row sm:items-center sm:justify-between ">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border border-[#dadce0] bg-[#f1f3f4] text-[#5f6368]"> <Users size={20} /> </div> <div> <h1 className="text-xl font-medium text-[#202124]">Data Kandidat</h1>
            <p className="text-sm text-[#5f6368]">Kelola data kandidat per batch</p>
          </div>
        </div>
        <button
          onClick={() => { setShowTambah(true); setTambahSuccess(null); setTambahError(''); setTambahErrors({}) }}
          className="inline-flex items-center justify-center gap-2 bg-[#0E6187] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#084c63]"
        >
          <Plus size={16} />
          Tambah Data
        </button>
      </div>

      {/* Summary */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {[
          { label: 'Total Batch', value: totalBatch },
          { label: 'Total Kandidat', value: totalKandidat },
          { label: 'Kandidat Active', value: statusCounts.KandidatActive },
          { label: 'Calon Kandidat', value: statusCounts['Calon Kandidat'] },
          { label: 'Proses Belajar', value: statusCounts['Proses Belajar'] },
          { label: 'Mengundurkan Diri', value: statusCounts['Mengundurkan Diri'] },
          { label: 'Lulus Pendidikan', value: statusCounts['Lulus Pendidikan'] },
          { label: 'Cuti', value: statusCounts.Cuti },
        ].map(s => (
          <div key={s.label} className="border border-[#dadce0] bg-white p-3 ">
            <p className="text-[10px] font-semibold text-[#5f6368]">{s.label}</p>
            <p className="mt-0.5 text-xl font-bold text-[#202124]">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="mb-4 py-4 ">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative w-full md:flex-1 md:w-auto">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#80868b]" />
            <input
              type="text"
              placeholder="Cari nama, email, atau NIK..."
              value={search}
              onChange={handleSearch}
              className="w-full border border-[#dadce0] bg-[#f8f9fa] py-2.5 pl-9 pr-3 text-sm text-[#3c4043] outline-none transition placeholder:text-[#80868b] focus:border-[#1a73e8] focus:bg-white focus:border-[#1a73e8]/20"
            />
          </div>
          {!isCabang && (
            <div className="relative">
              <select
                value={filterCabang}
                onChange={handleFilterCabang}
                className="appearance-none border border-[#dadce0] bg-[#f8f9fa] px-8 py-2.5 pr-8 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8] focus:bg-white focus:border-[#1a73e8]/20"
              >
                <option value="">Semua Cabang</option>
                {cabangOptions.map(c => (
                  <option key={c.id} value={c.id}>{c.nama}</option>
                ))}
              </select>
              <svg className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#80868b]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          )}
          <div className="relative shrink-0" ref={batchDropdownRef}>
            <button type="button" onClick={() => setShowBatchDropdown(!showBatchDropdown)}
              className="flex items-center gap-2 border border-[#dadce0] bg-white px-3 py-2.5 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8] focus:border-[#1a73e8]/20 w-full min-w-[180px] hover:shadow">
              {filterBatch ? (
                <span className="flex items-center gap-2 truncate">
                  <span className="inline-block h-3 w-3 shrink-0 ring-1 ring-black/10" style={{ backgroundColor: batchOptions.find(b => String(b.id) === filterBatch)?.warna || '#3b82f6' }} />
                  <span className="truncate">{batchOptions.find(b => String(b.id) === filterBatch)?.nama || 'Semua Batch'}</span>
                </span>
              ) : (
                <span className="text-[#80868b]">Semua Batch</span>
              )}
              <svg className={`ml-auto h-4 w-4 text-[#80868b] transition-transform ${showBatchDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {showBatchDropdown && (
              <div className="absolute left-0 top-full z-50 mt-1 w-full min-w-[220px] border border-[#dadce0] bg-white shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)] py-1 max-h-60 overflow-y-auto">
                <button type="button" onClick={() => { setFilterBatch(''); setShowBatchDropdown(false); setPage(1); doFetch(buildParams({ batch_id: '' })) }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#5f6368] hover:bg-[#e8f0fe] hover:text-[#1967d2] transition">
                  Semua Batch
                </button>
                {batchOptions.map(b => (
                  <button key={b.id} type="button" onClick={() => { setFilterBatch(String(b.id)); setShowBatchDropdown(false); setPage(1); doFetch(buildParams({ batch_id: String(b.id) })) }}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition ${String(b.id) === filterBatch ? 'bg-[#e8f0fe] text-[#1967d2] font-medium' : 'text-[#3c4043] hover:bg-[#f8f9fa]'}`}>
                    <span className="inline-block h-3 w-3 shrink-0 ring-1 ring-black/10" style={{ backgroundColor: b.warna || '#3b82f6' }} />
                    <span className="truncate">{b.nama}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => fetchData(search)}
            className="inline-flex items-center justify-center gap-2 bg-[#0E6187] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1a3a5c]"
          >
            <Search size={16} />
            Filter
          </button>
          <button
            onClick={resetFilter}
            className="inline-flex items-center justify-center gap-2 border border-[#dadce0] bg-white px-4 py-2.5 text-sm font-medium text-[#5f6368] transition hover:bg-[#f8f9fa] hover:text-[#202124]"
          >
            <RotateCcw size={16} />
            Reset
          </button>
          <div className="relative group">
            <button
              className="inline-flex items-center justify-center gap-2 border border-[#dadce0] bg-white px-4 py-2.5 text-sm font-medium text-[#5f6368] transition hover:bg-[#f8f9fa] hover:text-[#202124]"
            >
              <Download size={16} />
              Export
            </button>
            <div className="absolute right-0 top-full z-30 mt-1 hidden w-48 border border-[#dadce0] bg-white py-1 shadow-[0_1px_3px_rgba(60,64,67,0.15)] group-hover:block">
              <button onClick={exportCSV} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#3c4043] hover:bg-[#f8f9fa] transition-colors">
                <Download size={14} className="text-[#80868b]" />
                Export CSV
              </button>
              <button onClick={exportExcel} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#3c4043] hover:bg-[#f8f9fa] transition-colors">
                <Download size={14} className="text-[#80868b]" />
                Export Excel
              </button>
              <div className="my-1 border-t border-[#e8eaed]" />
              <button onClick={() => { setShowExportLogin(true); setExportBatchId(''); setExportCabangId('') }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#3c4043] hover:bg-[#f8f9fa] transition-colors">
                <KeyRound size={14} className="text-[#81c995]" />
                Export PDF Akun Login
              </button>
            </div>
          </div>
          {!isCabang && (
            <button
              onClick={() => setShowImport(true)}
              className="inline-flex items-center justify-center gap-2 border border-[#dadce0] bg-white px-4 py-2.5 text-sm font-medium text-[#5f6368] transition hover:bg-[#f8f9fa] hover:text-[#202124]"
            >
              <Upload size={16} />
              Import
            </button>
          )}
          {!isCabang && (
            <button
              onClick={handleSyncNoRegistrasi}
              className="inline-flex items-center justify-center gap-2 border border-[#a8dab5] bg-white px-4 py-2.5 text-sm font-medium text-[#137333] transition hover:bg-[#e6f4ea] hover:text-[#0d652d]"
            >
              <RefreshCw size={16} />
              Sync No. Reg
            </button>
          )}
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && !isCabang && (
        <div className="mb-4 border border-[#aecbfa] bg-[#e8f0fe] px-4 py-3 ">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-[#1967d2]">
              <Users size={16} />
              <span className="font-semibold">{selectedIds.size} kandidat dipilih</span>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <div className="relative shrink-0" ref={bulkBatchDropdownRef}>
                  <button type="button" onClick={() => setShowBulkBatchDropdown(!showBulkBatchDropdown)}
                    className="flex items-center gap-2 border border-[#8ab4f8] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8] focus:border-[#1a73e8]/20 w-full min-w-[180px] hover:shadow">
                    {bulkBatchId ? (
                      <span className="flex items-center gap-2 truncate">
                        <span className="inline-block h-3 w-3 shrink-0 ring-1 ring-black/10" style={{ backgroundColor: batchOptions.find(b => String(b.id) === bulkBatchId)?.warna || '#3b82f6' }} />
                        <span className="truncate">{batchOptions.find(b => String(b.id) === bulkBatchId)?.nama || 'Pilih Batch Tujuan...'}</span>
                      </span>
                    ) : (
                      <span className="text-[#80868b]">Pilih Batch Tujuan...</span>
                    )}
                    <svg className={`ml-auto h-4 w-4 text-[#80868b] transition-transform ${showBulkBatchDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {showBulkBatchDropdown && (
                    <div className="absolute left-0 top-full z-50 mt-1 w-full min-w-[220px] border border-[#dadce0] bg-white shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)] py-1 max-h-60 overflow-y-auto">
                      <button type="button" onClick={() => { setBulkBatchId(''); setShowBulkBatchDropdown(false) }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#5f6368] hover:bg-[#e8f0fe] hover:text-[#1967d2] transition">
                        Pilih Batch Tujuan...
                      </button>
                      {batchOptions.map(b => (
                        <button key={b.id} type="button" onClick={() => { setBulkBatchId(String(b.id)); setShowBulkBatchDropdown(false) }}
                          className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition ${String(b.id) === bulkBatchId ? 'bg-[#e8f0fe] text-[#1967d2] font-medium' : 'text-[#3c4043] hover:bg-[#f8f9fa]'}`}>
                          <span className="inline-block h-3 w-3 shrink-0 ring-1 ring-black/10" style={{ backgroundColor: b.warna || '#3b82f6' }} />
                          <span className="truncate">{b.nama}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={handleBulkMoveBatch}
                  disabled={!bulkBatchId || bulkMoving}
                  className="inline-flex items-center gap-1.5 bg-[#0E6187] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1a3a5c] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bulkMoving ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                  {bulkMoving ? 'Memindahkan...' : 'Pindah Batch'}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative shrink-0" ref={bulkProductDropdownRef}>
                  <button type="button" onClick={() => setShowBulkProductDropdown(!showBulkProductDropdown)}
                    className="flex items-center gap-2 border border-[#8ab4f8] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8] focus:border-[#1a73e8]/20 w-full min-w-[180px] hover:shadow">
                    {bulkProductId ? (
                      <span className="flex items-center gap-2 truncate">
                        <span className="inline-block h-3 w-3 shrink-0 bg-[#0E6187]" />
                        <span className="truncate">{productOptions.find(p => String(p.id) === bulkProductId)?.nama || 'Pilih Program...'}</span>
                      </span>
                    ) : (
                      <span className="text-[#80868b]">Pilih Program...</span>
                    )}
                    <svg className={`ml-auto h-4 w-4 text-[#80868b] transition-transform ${showBulkProductDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {showBulkProductDropdown && (
                    <div className="absolute left-0 top-full z-50 mt-1 w-full min-w-[220px] border border-[#dadce0] bg-white shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)] py-1 max-h-60 overflow-y-auto">
                      <button type="button" onClick={() => { setBulkProductId(''); setShowBulkProductDropdown(false) }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#5f6368] hover:bg-[#e8f0fe] hover:text-[#1967d2] transition">
                        Pilih Program...
                      </button>
                      {productOptions.map(p => (
                        <button key={p.id} type="button" onClick={() => { setBulkProductId(String(p.id)); setShowBulkProductDropdown(false) }}
                          className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition ${String(p.id) === bulkProductId ? 'bg-[#e8f0fe] text-[#1967d2] font-medium' : 'text-[#3c4043] hover:bg-[#f8f9fa]'}`}>
                          <span className="inline-block h-3 w-3 shrink-0 bg-[#0E6187]" />
                          <span className="truncate">{p.nama}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={handleBulkChangeProduct}
                  disabled={!bulkProductId || bulkChangingProduct}
                  className="inline-flex items-center gap-1.5 bg-[#0E6187] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1a3a5c] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bulkChangingProduct ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                  {bulkChangingProduct ? 'Mengubah...' : 'Ubah Program'}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setSelectedIds(new Set()); setBulkBatchId(''); setBulkProductId('') }}
                  className="inline-flex items-center gap-1.5 border border-[#dadce0] bg-white px-3 py-2 text-sm font-medium text-[#5f6368] transition hover:bg-[#f8f9fa]"
                >
                  <X size={14} /> Batal
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkDeleting}
                  className="inline-flex items-center gap-1.5 bg-[#c5221f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#a50e0e] disabled:opacity-50"
                >
                  {bulkDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  {bulkDeleting ? 'Menghapus...' : 'Hapus'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border border-[#dadce0] bg-white">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="relative w-14 h-14 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-[#1a73e8]/10 border-t-[#1a73e8] animate-spin" />
              <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
            </div>
          </div>
        ) : (
          <>
            <div className="max-h-[calc(100vh-260px)] overflow-auto">
              <table className="w-full min-w-[3200px] border-collapse text-left text-sm text-black">
                <thead className="sticky top-0 z-20 bg-white">
                  <tr>
                    {table.getHeaderGroups()[0].headers.map(header => {
                      const canSort = header.column.getCanSort()
                      const sorted = header.column.getIsSorted()
                      const meta = header.column.columnDef.meta as { thClass?: string } | undefined
                      return (
                        <th
                          key={header.id}
                          scope="col"
                          onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                          title={canSort ? 'Klik untuk urutkan' : undefined}
                          className={`${meta?.thClass || 'border-b border-[#e8eaed] px-4 py-3 text-xs font-medium text-[#5f6368]'} ${canSort ? 'cursor-pointer select-none hover:bg-[#f1f3f4] transition-colors' : ''}`}
                        >
                          <span className="inline-flex items-center gap-1">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {canSort && (
                              sorted === 'asc' ? <ChevronUp size={13} className="flex-none" />
                              : sorted === 'desc' ? <ChevronDown size={13} className="flex-none" />
                              : <ChevronsUpDown size={13} className="opacity-40 flex-none" />
                            )}
                          </span>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {table.getRowModel().rows.length > 0 ? (
                    table.getRowModel().rows.map((row, idx) => {
                      const k = row.original
                      const isEditing = editingId === k.id
                      const rowNum = (safePage - 1) * perPage + idx + 1
                      const batchBadgeBg = k.batch_warna || '#3b82f6'
                      return (
                        <tr key={k.id} className={`${isEditing ? 'bg-[#e8f0fe]' : k.level_status_keluar ? 'bg-[#fce8e6]' : k.is_cuti ? 'bg-[#fef7e0]' : 'bg-white'} transition hover:bg-[#f8f9fa] group`}>
                          <td className="border-b border-[#e8eaed] px-3 py-3 text-center text-xs font-normal text-black">{rowNum}</td>
                          {!isCabang && (
                            <td className="border-b border-[#e8eaed] px-3 py-3 text-center">
                              <input
                                type="checkbox"
                                checked={selectedIds.has(k.id)}
                                onChange={() => toggleSelect(k.id)}
                                className="h-4 w-4 border-[#dadce0] text-[#1a73e8] focus:ring-[#1a73e8] cursor-pointer"
                              />
                            </td>
                          )}
                          <td className="border-b border-[#e8eaed] px-3 py-3 text-xs font-mono font-normal text-black whitespace-nowrap">
                            {k.nik || <span className="text-[#80868b]">-</span>}
                          </td>
                          <td className="border-b border-[#e8eaed] px-3 py-3 text-xs font-mono font-normal text-black whitespace-nowrap">
                            {k.no_registrasi || <span className="text-[#80868b]">-</span>}
                          </td>
                          <td className="border-b border-[#e8eaed] px-3 py-3 max-w-[200px] overflow-hidden">
                            <div className="flex items-center gap-2 min-w-0">
                              {(() => {
                                const pid = k.matching_job?.penempatan_kandidat_id
                                const foto = pid ? fotoMap[pid] : null
                                return foto ? (
                                  <img src={foto} alt={k.nama} className="h-8 w-8 object-cover flex-none"
                                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                                ) : (
                                  <img
                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(k.nama)}&background=e5e7eb&color=6b7280&size=32`}
                                    className="h-8 w-8 object-cover flex-none"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                  />
                                )
                              })()}
                              <div className="min-w-0">
                                <div className={`font-semibold truncate ${k.level_status_keluar ? 'text-[#c5221f]' : 'text-black'}`}>{k.nama}</div>
                              </div>
                            </div>
                          </td>
                          <td className="border-b border-[#e8eaed] px-3 py-3 whitespace-nowrap">
                            <button onClick={() => openBatchModal(k)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium whitespace-nowrap leading-none text-white transition hover:opacity-80"
                              style={{ backgroundColor: batchBadgeBg }}
                              title="Klik untuk ganti batch"
                            >
                              {k.batch_nama || '-'}
                            </button>
                          </td>
                          <td className="border-b border-[#e8eaed] px-3 py-3 text-xs font-normal text-black whitespace-nowrap">
                            {k.cabang_nama || <span className="text-[#80868b]">-</span>}
                          </td>
                          <td className="border-b border-[#e8eaed] px-3 py-3 text-xs font-normal text-black text-center">
                            {k.jenis_kelamin === 'L' ? 'L' : k.jenis_kelamin === 'P' ? 'P' : '-'}
                          </td>
                          <td className="border-b border-[#e8eaed] px-3 py-3 text-xs font-normal text-black whitespace-nowrap">
                            {k.tempat_lahir !== '-' && k.tanggal_lahir !== '-' ? `${k.tempat_lahir}, ${k.tanggal_lahir}` : '-'}
                          </td>
                          <td className="border-b border-[#e8eaed] px-3 py-3 text-xs font-normal text-black max-w-[250px]">
                            <span className="truncate block" title={k.alamat}>{k.alamat || '-'}</span>
                          </td>
                          <td className="border-b border-[#e8eaed] px-3 py-3 text-xs font-normal text-black whitespace-nowrap">
                            {k.desa || <span className="text-[#80868b]">-</span>}
                          </td>
                          <td className="border-b border-[#e8eaed] px-3 py-3 text-xs font-normal text-black whitespace-nowrap">
                            {k.kecamatan || <span className="text-[#80868b]">-</span>}
                          </td>
                          <td className="border-b border-[#e8eaed] px-3 py-3 text-xs font-normal text-black whitespace-nowrap">
                            {k.kabupaten || <span className="text-[#80868b]">-</span>}
                          </td>
                          <td className="border-b border-[#e8eaed] px-3 py-3 text-xs font-normal text-black whitespace-nowrap">
                            {k.provinsi || <span className="text-[#80868b]">-</span>}
                          </td>
                          <td className="border-b border-[#e8eaed] px-3 py-3 text-xs font-normal text-black whitespace-nowrap">
                            {k.pendidikan_terakhir || <span className="text-[#80868b]">-</span>}
                          </td>
                          <td className="border-b border-[#e8eaed] px-3 py-3 text-xs font-normal text-black text-center">
                            {k.tahun_lulus || <span className="text-[#80868b]">-</span>}
                          </td>
                          <td className="border-b border-[#e8eaed] px-3 py-3 text-xs font-normal text-black text-center">
                            {k.tinggi_badan || <span className="text-[#80868b]">-</span>}
                          </td>
                          <td className="border-b border-[#e8eaed] px-3 py-3 text-xs font-normal text-black text-center">
                            {k.berat_badan || <span className="text-[#80868b]">-</span>}
                          </td>
                          <td className="border-b border-[#e8eaed] px-3 py-3 text-xs font-normal text-black text-center">
                            {k.goldar || <span className="text-[#80868b]">-</span>}
                          </td>
                          <td className="border-b border-[#e8eaed] px-3 py-3 text-xs font-normal text-black text-center">
                            {k.ukuran_baju || <span className="text-[#80868b]">-</span>}
                          </td>
                          <td className="border-b border-[#e8eaed] px-3 py-3 text-xs font-normal text-black">
                            {k.status_pernikahan || <span className="text-[#80868b]">-</span>}
                          </td>
                          <td className="border-b border-[#e8eaed] px-3 py-3 text-xs font-mono font-normal text-black whitespace-nowrap">
                            {k.email}
                          </td>
                          <td className="border-b border-[#e8eaed] px-3 py-3 text-xs font-mono font-normal text-black whitespace-nowrap">
                            {k.no_hp || <span className="text-[#80868b]">-</span>}
                          </td>
                          <td className="border-b border-[#e8eaed] px-3 py-3 text-xs font-normal text-black">
                            {k.nama_ortu || <span className="text-[#80868b]">-</span>}
                          </td>
                          <td className="border-b border-[#e8eaed] px-3 py-3 text-xs font-mono font-normal text-black whitespace-nowrap">
                            {k.no_hp_ortu || <span className="text-[#80868b]">-</span>}
                          </td>
                          <td className="border-b border-[#e8eaed] px-3 py-3 text-center whitespace-nowrap">
                            {k.kontrak ? (
                              k.kontrak.file_kontrak_ttd ? (
                                <a
                                  href={`${APP_URL}/storage/${k.kontrak.file_kontrak_ttd}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  title={`Unduh kontrak ditandatangani${k.kontrak.ttd_uploaded_at ? ` (${new Date(k.kontrak.ttd_uploaded_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })})` : ''}`}
                                  className="inline-flex items-center gap-1.5 border border-[#a8dab5] bg-[#e6f4ea] px-2.5 py-1 text-[11px] font-semibold text-[#137333] transition hover:bg-[#084c63]"
                                >
                                  <Download size={11} /> Sudah TTD
                                </a>
                              ) : (
                                <a
                                  href={`${APP_URL}/storage/${k.kontrak.file_kontrak}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  title={`Lihat kontrak: ${k.kontrak.judul}`}
                                  className="inline-flex items-center gap-1.5 border border-[#fdd663] bg-[#fef7e0] px-2.5 py-1 text-[11px] font-semibold text-[#b06000] transition hover:bg-[#feefc3]"
                                >
                                  <FileText size={11} /> Belum TTD
                                </a>
                              )
                            ) : (
                              <span className="text-[#80868b]">-</span>
                            )}
                          </td>
                          <td className="border-b border-[#e8eaed] px-3 py-3 whitespace-nowrap">
                            <StatusKandidatBadge status={k.status_kandidat} />
                          </td>
                          <td className="border-b border-[#e8eaed] px-3 py-3 text-xs font-normal text-black max-w-[180px]">
                            <div className="flex flex-col gap-1">
                              {k.level_status_keluar ? <span className="inline-block w-fit bg-[#d93025] px-2 py-0.5 text-[10px] font-bold text-white">KELUAR</span> : null}
                              {k.is_cuti ? <span className="inline-block w-fit bg-[#f9ab00] px-2 py-0.5 text-[10px] font-bold text-black">CUTI</span> : null}
                              {k.keterangan && k.keterangan !== '-' && String(k.keterangan) !== '0' ? <span className="truncate block" title={k.keterangan}>{k.keterangan}</span> : <span className="text-[#80868b]">-</span>}
                            </div>
                           </td>
                           <td className={`sticky right-0 z-10 border-b border-l border-[#dadce0] px-3 py-3 text-center ${isEditing ? 'bg-[#e8f0fe]' : 'bg-white'}`}>
                            <div className="relative flex justify-center" ref={actionRef}>
                                  <button
                                    onMouseDown={e => e.stopPropagation()}
                                    onClick={(e) => {
                                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                                      const dropdownHeight = Math.min(600, window.innerHeight * 0.7)
                                      const spaceBelow = window.innerHeight - rect.bottom - 4
                                      const top = spaceBelow > dropdownHeight ? rect.bottom + 4 : Math.max(8, rect.top - dropdownHeight - 4)
                                      setActionPos({ top, left: Math.max(8, rect.right - 208) })
                                      setOpenActionId(openActionId === k.id ? null : k.id)
                                    }}
                                    className="border border-[#dadce0] bg-white p-1.5 text-[#5f6368] transition hover:border-[#dadce0] hover:bg-[#f8f9fa] hover:text-[#3c4043]"
                                    title="Aksi"
                                  >
                                    <MoreHorizontal size={16} />
                                  </button>
                                </div>
                                {openActionId === k.id && createPortal(
                                  <div
                                    ref={actionDropdownRef}
                                    onMouseDown={e => e.stopPropagation()}
                                    className="fixed z-[9999] max-h-[70vh] w-52 overflow-y-auto border border-[#dadce0] bg-white py-1 shadow-[0_1px_3px_rgba(60,64,67,0.15)]"
                                    style={{ top: actionPos.top, left: actionPos.left }}
                                  >
                                    <button onClick={() => { setDetailKandidat(k); setOpenActionId(null); loadDokumen(k) }}
                                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-[#3c4043] hover:bg-[#f8f9fa] transition-colors">
                                      <Eye size={14} className="text-[#80868b]" />
                                      <span>Detail Lengkap</span>
                                    </button>
                                    <button onClick={() => { startEdit(k); setOpenActionId(null) }}
                                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-[#3c4043] hover:bg-[#f8f9fa] transition-colors">
                                      <Edit3 size={14} className="text-[#80868b]" />
                                      <span>Edit Data</span>
                                    </button>
                                    {!isCabang && (
                                    <button onClick={() => { setMergeModal({ kandidat: k }); setMergeQuery(''); setMergePage(1); setOpenActionId(null) }}
                                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-[#3c4043] hover:bg-[#f8f9fa] transition-colors">
                                      <ClipboardPaste size={14} className="text-[#1a73e8]" />
                                      <span>Merge Job Matching</span>
                                    </button>
                                    )}
                                    <Link to={isCabang ? `/admin-cabang/pendaftar/${k.id}/invoice` : `/pendaftar/${k.id}/invoice`} onClick={() => setOpenActionId(null)}
                                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-[#3c4043] hover:bg-[#f8f9fa] transition-colors">
                                      <Receipt size={14} className="text-[#80868b]" />
                                      <span>Lihat Invoice</span>
                                    </Link>
                                    {!isCabang && (
                                    <button onClick={async () => {
                                      setOpenActionId(null)
                                      try {
                                        const [itemRes, katRes] = await Promise.all([
                                          isCabang ? adminCabangApi.pembayaranItem(k.id) : api.get(`/pembayaran-item/${k.id}`),
                                          isCabang ? adminCabangApi.biayaKategori() : api.get('/biaya-kategori-flat'),
                                        ])
                                        setPaymentModal({
                                          kandidat: k,
                                          items: itemRes.data.items || [],
                                          kategoris: katRes.data || [],
                                        })
                                        setPaymentJumlah('')
                                      } catch {
                                        Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal memuat data pembayaran.', confirmButtonColor: '#0E6187' })
                                      }
                                    }}
                                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-[#3c4043] hover:bg-[#f8f9fa] transition-colors">
                                      <DollarSign size={14} className="text-[#81c995]" />
                                      <span>Pembayaran Tagihan</span>
                                    </button>
                                    )}
                                    <div className="my-1 border-t border-[#e8eaed]" />
                                    <p className="px-3 py-1 text-[10px] font-semibold r text-[#80868b]">Status Kandidat</p>
                                    {['Calon Kandidat', 'Kandidat Aktif', 'Proses Belajar', 'Mengundurkan Diri', 'Lulus Pendidikan'].map((st) => (
                                      <button key={st} onClick={() => {
                                        setOpenActionId(null)
                                        Swal.fire({
                                          title: `Ubah Status ke "${st}"?`,
                                          text: `${k.nama} akan diubah statusnya menjadi ${st}.`,
                                          icon: 'question',
                                          showCancelButton: true,
                                          confirmButtonColor: '#0E6187',
                                          cancelButtonColor: '#64748b',
                                          confirmButtonText: 'Ya, Ubah!',
                                          cancelButtonText: 'Batal',
                                        }).then((result) => {
                                          if (result.isConfirmed) {
                                            handleUpdateStatusKandidat(k.id, st)
                                          }
                                        })
                                      }}
                                        disabled={updatingStatusKandidat === k.id || k.status_kandidat === st}
                                        className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-[#3c4043] hover:bg-[#f8f9fa] transition-colors disabled:opacity-40">
                                        <span className={`h-2 w-2 ${st === 'Calon Kandidat' ? 'bg-[#0E6187]' : st === 'Kandidat Aktif' ? 'bg-[#0E6187]' : st === 'Mengundurkan Diri' ? 'bg-[#d93025]' : 'bg-[#0E6187]'}`} />
                                        <span>{st}</span>
                                        {k.status_kandidat === st && <span className="ml-auto text-[10px] text-[#80868b]">sekarang</span>}
                                      </button>
                                    ))}
                                    <div className="my-1 border-t border-[#e8eaed]" />
                                    <p className="px-3 py-1 text-[10px] font-semibold r text-[#80868b]">Lainnya</p>
                                    {!isCabang && (
                                    <button onClick={() => {
                                      setOpenActionId(null)
                                      const isNonaktif = k.status_akademik === 'NONAKTIF'
                                      Swal.fire({
                                        title: isNonaktif ? 'Aktifkan Kandidat?' : 'Nonaktifkan Kandidat?',
                                        text: isNonaktif ? `${k.nama} akan diaktifkan kembali.` : `${k.nama} akan dinonaktifkan.`,
                                        icon: 'warning',
                                        showCancelButton: true,
                                        confirmButtonColor: isNonaktif ? '#0E6187' : '#dc2626',
                                        cancelButtonColor: '#64748b',
                                        confirmButtonText: isNonaktif ? 'Ya, Aktifkan!' : 'Ya, Nonaktifkan!',
                                        cancelButtonText: 'Batal',
                                      }).then((result) => {
                                        if (result.isConfirmed) {
                                          handleToggleStatus(k.id)
                                        }
                                      })
                                    }}
                                      disabled={togglingId === k.id}
                                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-[#3c4043] hover:bg-[#f8f9fa] transition-colors disabled:opacity-50">
                                      {k.status_akademik === 'NONAKTIF'
                                        ? <Power size={14} className="text-[#81c995]" />
                                        : <PowerOff size={14} className="text-[#f9ab00]" />}
                                      <span>{k.status_akademik === 'NONAKTIF' ? 'Aktifkan' : 'Nonaktifkan'}</span>
                                    </button>
                                    )}
                                    <button onClick={() => {
                                      setOpenActionId(null)
                                      Swal.fire({
                                        title: k.is_cuti ? 'Aktifkan dari Cuti?' : 'Cuti Kandidat?',
                                        text: k.is_cuti ? `${k.nama} akan diaktifkan dari cuti.` : `${k.nama} akan diatur cuti.`,
                                        icon: 'question',
                                        showCancelButton: true,
                                        confirmButtonColor: '#0E6187',
                                        cancelButtonColor: '#64748b',
                                        confirmButtonText: 'Ya!',
                                        cancelButtonText: 'Batal',
                                      }).then((result) => {
                                        if (result.isConfirmed) {
                                          handleToggleCuti(k.id)
                                        }
                                      })
                                    }}
                                      disabled={togglingCutiId === k.id}
                                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-[#3c4043] hover:bg-[#f8f9fa] transition-colors disabled:opacity-50">
                                      {k.is_cuti
                                        ? <Calendar size={14} className="text-[#f9ab00]" />
                                        : <CalendarOff size={14} className="text-[#80868b]" />}
                                      <span>{k.is_cuti ? 'Aktifkan dari Cuti' : 'Cuti'}</span>
                                    </button>
                                    <div className="my-1 border-t border-[#e8eaed]" />
                                    {!isCabang && (
                                    <button onClick={() => {
                                      setOpenActionId(null)
                                      Swal.fire({
                                        title: 'Hapus Kandidat?',
                                        text: `Semua data ${k.nama} akan dihapus permanen termasuk akun login. Tindakan ini tidak bisa dibatalkan!`,
                                        icon: 'warning',
                                        showCancelButton: true,
                                        confirmButtonColor: '#dc2626',
                                        cancelButtonColor: '#64748b',
                                        confirmButtonText: 'Ya, Hapus!',
                                        cancelButtonText: 'Batal',
                                      }).then(async (result) => {
                                        if (result.isConfirmed) {
                                          try {
                                            await pendaftarApi.deleteKandidat(k.id)
                                            fetchData(search)
                                            Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Kandidat berhasil dihapus.', confirmButtonColor: '#0E6187', timer: 2000, timerProgressBar: true, showConfirmButton: false })
                                          } catch {
                                            Swal.fire({ icon: 'error', title: 'Gagal', text: 'Terjadi kesalahan.', confirmButtonColor: '#0E6187' })
                                          }
                                        }
                                      })
                                    }}
                                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-[#c5221f] hover:bg-[#fce8e6] transition-colors">
                                      <Trash2 size={14} className="text-[#ee675c]" />
                                      <span>Hapus Kandidat</span>
                                    </button>
                                    )}
                                    {!isCabang && (
                                    <button onClick={() => {
                                      setOpenActionId(null)
                                      const isNonaktif = k.status_akademik === 'NONAKTIF' || k.status_kandidat === 'Mengundurkan Diri'
                                      Swal.fire({
                                        title: isNonaktif ? 'Nonaktifkan Kandidat?' : 'Mengundurkan Diri?',
                                        text: isNonaktif ? `${k.nama} akan dinonaktifkan.` : `${k.nama} akan diatur sebagai Mengundurkan Diri dan dinonaktifkan.`,
                                        icon: 'warning',
                                        showCancelButton: true,
                                        confirmButtonColor: '#dc2626',
                                        cancelButtonColor: '#64748b',
                                        confirmButtonText: 'Ya, Nonaktifkan!',
                                        cancelButtonText: 'Batal',
                                      }).then(async (result) => {
                                        if (result.isConfirmed) {
                                          try {
                                            await (isCabang ? adminCabangApi.updateKandidat(k.id, { status_kandidat: 'Mengundurkan Diri', status_akademik: 'NONAKTIF' }) : pendaftarApi.updateKandidat(k.id, { status_kandidat: 'Mengundurkan Diri', status_akademik: 'NONAKTIF' }))
                                            fetchData(search)
                                            Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Kandidat telah dinonaktifkan.', confirmButtonColor: '#0E6187', timer: 2000, timerProgressBar: true, showConfirmButton: false })
                                          } catch {
                                            Swal.fire({ icon: 'error', title: 'Gagal', text: 'Terjadi kesalahan.', confirmButtonColor: '#0E6187' })
                                          }
                                        }
                                      })
                                    }}
                                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-[#c5221f] hover:bg-[#fce8e6] transition-colors">
                                      <PowerOff size={14} className="text-[#ee675c]" />
                                      <span>Nonaktifkan</span>
                                    </button>
                                    )}
                                  </div>,
                                  document.body
                                )}
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={29} className="px-6 py-12 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center bg-[#f1f3f4] text-[#80868b]">
                          <Users size={24} />
                        </div>
                        <p className="mt-3 text-sm font-medium text-[#5f6368]">Tidak ada kandidat ditemukan</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="border-t border-[#dadce0] px-4 py-3 text-sm text-[#5f6368]">
              Menampilkan {table.getRowModel().rows.length} dari {filteredList.length} kandidat
              {selectedIds.size > 0 && <span className="ml-2 font-semibold text-[#c5221f]">({selectedIds.size} dipilih)</span>}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {!loading && filteredList.length > 0 && (
        <div className="mt-4 flex flex-col gap-3 border border-[#dadce0] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-sm text-[#5f6368]">
            <span className="text-xs font-medium">Per halaman</span>
            <div className="relative">
              <select
                value={perPage}
                onChange={e => { setPerPage(Number(e.target.value)); setPage(1) }}
                className="appearance-none border border-[#dadce0] bg-[#f8f9fa] px-7 py-1.5 text-sm font-medium text-[#3c4043] outline-none transition focus:border-[#1a73e8] focus:bg-white focus:border-[#1a73e8]/20"
              >
                {[10, 25, 50, 100].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <svg className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-[#80868b]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(1)}
              disabled={safePage <= 1}
              className="border border-[#dadce0] bg-white p-1.5 text-[#80868b] transition hover:bg-[#f8f9fa] hover:text-[#5f6368] disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronsLeft size={15} />
            </button>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="border border-[#dadce0] bg-white p-1.5 text-[#80868b] transition hover:bg-[#f8f9fa] hover:text-[#5f6368] disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft size={15} />
            </button>
            {(() => {
              const pages: (number | '...')[] = []
              if (totalPages <= 7) {
                for (let i = 1; i <= totalPages; i++) pages.push(i)
              } else {
                pages.push(1)
                if (safePage > 3) pages.push('...')
                const start = Math.max(2, safePage - 1)
                const end = Math.min(totalPages - 1, safePage + 1)
                for (let i = start; i <= end; i++) pages.push(i)
                if (safePage < totalPages - 2) pages.push('...')
                pages.push(totalPages)
              }
              return pages.map((p, i) =>
                p === '...' ? (
                  <span key={`dots-${i}`} className="px-1.5 text-sm text-[#9aa0a6]">...</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`min-w-[34px] border px-3 py-1.5 text-sm font-medium transition ${p === safePage ? 'border-[#1a73e8] bg-[#0E6187] text-white ' : 'border-[#dadce0] bg-white text-[#5f6368] hover:bg-[#f8f9fa] hover:text-[#202124]' }`}
                  >
                    {p}
                  </button>
                )
              )
            })()}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="border border-[#dadce0] bg-white p-1.5 text-[#80868b] transition hover:bg-[#f8f9fa] hover:text-[#5f6368] disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight size={15} />
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={safePage >= totalPages}
              className="border border-[#dadce0] bg-white p-1.5 text-[#80868b] transition hover:bg-[#f8f9fa] hover:text-[#5f6368] disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronsRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal — Simple & Wide */}
      {detailKandidat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#202124]/50 p-2 sm:p-4" onClick={() => setDetailKandidat(null)}>
          <div className="border border-[#dadce0] flex w-full max-w-5xl max-h-[calc(100vh-1rem)] flex-col bg-white shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)] overflow-hidden sm:max-h-[calc(100vh-2rem)]" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#dadce0] px-4 py-3 sm:items-center sm:px-6 sm:py-4">
              <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
                <div className="h-9 w-9 shrink-0 bg-[#0E6187] flex items-center justify-center sm:h-10 sm:w-10">
                  <span className="text-sm font-bold text-white">{detailKandidat.nama?.charAt(0)?.toUpperCase()}</span>
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-bold text-[#202124] sm:text-base">{detailKandidat.nama}</h2>
                  <p className="truncate text-xs text-[#5f6368]">{detailKandidat.email}</p>
                </div>
                <span className="sm:ml-2">
                  <StatusKandidatBadge status={detailKandidat.status_kandidat} />
                </span>
                {detailKandidat.status_akademik && (
                  <span className={`inline-flex items-center gap-1 border px-2 py-0.5 text-[10px] font-medium ${detailKandidat.status_akademik === 'AKTIF' ? 'border-[#a8dab5] bg-[#e6f4ea] text-[#137333]' : 'border-[#f6aea9] bg-[#fce8e6] text-[#d93025]'}`}>
                    {detailKandidat.status_akademik}
                  </span>
                )}
                {detailKandidat.is_cuti ? (
                  <span className="inline-flex items-center gap-1 border border-[#fdd663] bg-[#fef7e0] px-2 py-0.5 text-[10px] font-medium text-[#b06000]">
                    CUTI{detailKandidat.cuti_sejak ? ` ${detailKandidat.cuti_sejak}` : ''}
                  </span>
                ) : null}
              </div>
              <button onClick={() => setDetailKandidat(null)} className="shrink-0 p-1.5 hover:bg-[#f1f3f4] transition"><X size={18} className="text-[#80868b]" /></button>
            </div>

            {/* Body — 3 Column Grid */}
            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
              {/* Data Akun Kandidat */}
              {detailKandidat.password_plain ? (
                <div className="mb-5 border border-[#fdd663] bg-[#fef7e0] p-4">
                  <h3 className="text-xs font-bold text-[#b06000] mb-2">Data Akun Kandidat (Email + Password untuk login)</h3>
                  <div className="grid grid-cols-1 gap-y-1 text-sm sm:grid-cols-2 sm:gap-x-6 sm:gap-y-1">
                    <div className="flex gap-2">
                      <span className="font-semibold text-[#3c4043]">No. Reg</span>
                      <span className="text-[#5f6368]">:</span>
                      <span className="font-mono text-[#202124]">{detailKandidat.no_registrasi}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-semibold text-[#3c4043]">Password</span>
                      <span className="text-[#5f6368]">:</span>
                      <span className="font-mono font-bold text-[#c5221f]">{detailKandidat.password_plain}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-semibold text-[#3c4043]">Nama</span>
                      <span className="text-[#5f6368]">:</span>
                      <span className="text-[#202124]">{detailKandidat.nama}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-semibold text-[#3c4043]">Email</span>
                      <span className="text-[#5f6368]">:</span>
                      <span className="text-[#202124]">{detailKandidat.email}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-5 border border-[#dadce0] bg-[#f8f9fa] p-4">
                  <h3 className="text-xs font-bold text-[#5f6368] mb-1">Data Akun Kandidat</h3>
                  <p className="text-xs text-[#80868b]">Password tidak tersedia (akun dibuat sebelum fitur ini diaktifkan)</p>
                </div>
              )}
              <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-8">
                <InfoItem label="NIK" value={detailKandidat.nik} />
                <InfoItem label="No. Registrasi" value={detailKandidat.no_registrasi} mono />
                <InfoItem label="Batch" value={detailKandidat.batch_nama} />
                <InfoItem label="Cabang" value={detailKandidat.cabang_nama} />
                <InfoItem label="Status Kandidat" value={detailKandidat.status_kandidat} />
                <InfoItem label="Jenis Kelamin" value={detailKandidat.jenis_kelamin === 'L' ? 'Laki-laki' : detailKandidat.jenis_kelamin === 'P' ? 'Perempuan' : null} />
                <InfoItem label="Tempat, Tanggal Lahir" value={detailKandidat.tempat_lahir !== '-' && detailKandidat.tanggal_lahir !== '-' ? `${detailKandidat.tempat_lahir}, ${detailKandidat.tanggal_lahir}` : null} />
                <InfoItem label="No. HP" value={detailKandidat.no_hp} />
                <InfoItem label="Email" value={detailKandidat.email} />
                <InfoItem label="Pendidikan Terakhir" value={detailKandidat.pendidikan_terakhir} />
                <InfoItem label="Tahun Lulus" value={detailKandidat.tahun_lulus} />
                <InfoItem label="Tinggi Badan" value={detailKandidat.tinggi_badan ? `${detailKandidat.tinggi_badan} cm` : null} />
                <InfoItem label="Berat Badan" value={detailKandidat.berat_badan ? `${detailKandidat.berat_badan} kg` : null} />
                <InfoItem label="Golongan Darah" value={detailKandidat.goldar} />
                <InfoItem label="Ukuran Baju" value={detailKandidat.ukuran_baju} />
                <InfoItem label="Status Nikah" value={detailKandidat.status_pernikahan} />
                <InfoItem label="Alamat" value={detailKandidat.alamat} />
                <InfoItem label="Desa" value={detailKandidat.desa} />
                <InfoItem label="Kecamatan" value={detailKandidat.kecamatan} />
                <InfoItem label="Kab./Kota" value={detailKandidat.kabupaten} />
                <InfoItem label="Provinsi" value={detailKandidat.provinsi} />
                <InfoItem label="Nama Orang Tua" value={detailKandidat.nama_ortu} />
                <InfoItem label="No. HP Orang Tua" value={detailKandidat.no_hp_ortu} />
                {detailKandidat.keterangan && detailKandidat.keterangan !== '-' && (
                  <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                    <InfoItem label="Keterangan" value={detailKandidat.keterangan} />
                  </div>
                )}
              </div>

              {/* Data Diri & Matching Job (dari form siswa) */}
              {detailKandidat.matching_job && (
                <div className="mt-6 border border-[#dadce0] bg-[#f8f9fa] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-[#5f6368]">Data Diri &amp; Matching Job</h3>
                    <span className="inline-flex items-center gap-1 border px-2 py-0.5 text-[10px] font-semibold"
                      style={(() => {
                        const s = detailKandidat.matching_job!.status_formulir
                        const map: Record<string, { bg: string; border: string; text: string }> = {
                          submitted: { bg: 'bg-[#e6f4ea]', border: 'border-[#a8dab5]', text: 'text-[#137333]' },
                          approved: { bg: 'bg-[#e6f4ea]', border: 'border-[#a8dab5]', text: 'text-[#137333]' },
                          reviewed: { bg: 'bg-[#e8f0fe]', border: 'border-[#aecbfa]', text: 'text-[#1a73e8]' },
                          rejected: { bg: 'bg-[#fce8e6]', border: 'border-[#f6aea9]', text: 'text-[#d93025]' },
                          draft: { bg: 'bg-[#fef7e0]', border: 'border-[#fdd663]', text: 'text-[#b06000]' },
                        }
                        const m = map[s] || map.draft
                        return { backgroundColor: m.bg, borderColor: m.border, color: m.text }
                      })()}>
                      <span className="capitalize">{detailKandidat.matching_job.status_formulir}</span>
                    </span>
                  </div>

                  <MatchingJobSection data={detailKandidat.matching_job.data} learningLevel={detailKandidat.learning_level} statusFormulir={detailKandidat.matching_job.status_formulir} />

                  {(detailDokumen.length > 0 || detailDokumenLoading) && (
                    <div className="mt-5 border-t border-[#dadce0] pt-4">
                      <h4 className="mb-3 text-xs font-bold text-[#5f6368]">Dokumen Pendukung</h4>
                      {detailDokumenLoading ? (
                        <p className="flex items-center gap-2 text-xs text-[#80868b]"><Loader2 size={14} className="animate-spin" /> Memuat dokumen...</p>
                      ) : (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                          {detailDokumen.map((d, i) => (
                            <button key={i}
                              onClick={() => d.file_url && window.open(d.file_url, '_blank')}
                              className="group border border-[#dadce0] bg-white p-2 text-left transition hover:border-[#8ab4f8] hover:"
                              title={d.nama_file || ''}>
                              <div className="mb-1.5 flex h-24 items-center justify-center overflow-hidden bg-[#f1f3f4]">
                                {d.mime_type && String(d.mime_type).startsWith('image/') && d.file_url ? (
                                  <img src={d.file_url} alt={d.nama_file || 'dokumen'} className="h-full w-full object-cover"
                                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                                ) : (
                                  <FileText size={22} className="text-[#80868b]" />
                                )}
                              </div>
                              <p className="truncate text-[11px] font-medium text-[#3c4043]">{docLabel(d.jenis_dokumen)}</p>
                              <p className="truncate text-[10px] text-[#80868b]">{d.nama_file || '-'}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex flex-wrap items-center gap-2 border-t border-[#dadce0] px-4 py-3 sm:gap-3 sm:px-6">
              <button onClick={() => { setDetailKandidat(null); startEdit(detailKandidat); }}
                className="flex w-full items-center justify-center gap-2 bg-[#0E6187] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1a3a5c] sm:w-auto">
                <Edit3 size={14} /> Edit Data
              </button>
              {!isCabang && (
                <button onClick={() => navigate(`/data-kandidat/job-matching/${detailKandidat.id}`)}
                  className="flex w-full items-center justify-center gap-2 border border-[#1a73e8] bg-white px-4 py-2 text-sm font-semibold text-[#1a73e8] transition hover:bg-[#e8f2f7] sm:w-auto">
                  <ClipboardPaste size={14} /> Lengkapi Data Job Matching
                </button>
              )}
              <Link to={isCabang ? `/admin-cabang/pendaftar/${detailKandidat.id}/invoice` : `/pendaftar/${detailKandidat.id}/invoice`}
                className="flex w-full items-center justify-center gap-2 border border-[#dadce0] bg-white px-4 py-2 text-sm font-semibold text-[#3c4043] transition hover:bg-[#f8f9fa] sm:w-auto">
                <Receipt size={14} /> Lihat Invoice
              </Link>
              <button onClick={() => setDetailKandidat(null)}
                className="w-full border border-[#dadce0] bg-white px-4 py-2 text-sm font-semibold text-[#3c4043] transition hover:bg-[#f8f9fa] sm:ml-auto sm:w-auto">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pindah Batch Modal */}
      {batchModalKandidat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#202124]/50 p-4" onClick={() => setBatchModalKandidat(null)}>
          <div className="border border-[#dadce0] w-full max-w-sm bg-white shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#dadce0] px-5 py-4">
              <h3 className="text-sm font-bold text-[#202124]">Pindah Batch</h3>
              <button onClick={() => setBatchModalKandidat(null)} className="p-1 hover:bg-[#f1f3f4] transition"><X size={16} className="text-[#80868b]" /></button>
            </div>
            <div className="px-5 py-4">
              <p className="mb-4 text-xs text-[#5f6368]">
                Pilih batch baru untuk <span className="font-semibold text-[#3c4043]">{batchModalKandidat.nama}</span>
              </p>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                <button onClick={() => { handlePindahBatch(batchModalKandidat.id, ''); setBatchModalKandidat(null) }}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-[#5f6368] hover:bg-[#f8f9fa] transition-colors">
                  <span className="w-4 h-4 border-2 border-[#dadce0]" />
                  -
                </button>
                {batchOptions.map(b => (
                  <button key={b.id} onClick={() => { handlePindahBatch(batchModalKandidat.id, String(b.id)); setBatchModalKandidat(null) }}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-[#3c4043] hover:bg-[#f8f9fa] transition-colors"
                  >
                    <span className="w-4 h-4 shrink-0" style={{ backgroundColor: b.warna || '#3b82f6' }} />
                    {b.nama}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tambah Data Modal */}
      {/* Edit Modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#202124]/50 p-4 pt-10 pb-10" onClick={cancelEdit}>
          <div className="border border-[#dadce0] w-full max-w-4xl bg-white shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#dadce0] px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center border border-[#dadce0] bg-[#f1f3f4] text-[#5f6368]">
                  <Edit3 size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#202124]">Edit Data Kandidat</h2>
                  <p className="text-xs text-[#5f6368]">Perbarui data kandidat</p>
                </div>
              </div>
              <button onClick={cancelEdit} className="p-1.5 hover:bg-[#f1f3f4] transition">
                <X size={18} className="text-[#80868b]" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); saveEdit() }} autoComplete="off" className="px-6 py-5 max-h-[70vh] overflow-y-auto">
              {editError && (
                <div className="mb-4 border border-[#f6aea9] bg-[#fce8e6] px-4 py-3 text-sm text-[#a50e0e]">
                  <p className="font-semibold mb-1">Gagal menyimpan:</p>
                  <pre className="whitespace-pre-wrap text-xs">{editError}</pre>
                </div>
              )}

              <h3 className="mb-3 text-sm font-bold text-[#3c4043] ">Data Diri</h3>
              <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <FormField label="Nama Lengkap" value={String(editForm.nama ?? '')} onChange={v => updateField('nama', v)} placeholder="Nama lengkap" maxLength={255} />
                <FormField label="Email" value={String(editForm.email ?? '')} onChange={v => updateField('email', v)} type="email" placeholder="email@contoh.com" />
                <FormField label="NIK" value={String(editForm.nik ?? '')} onChange={v => updateField('nik', v)} placeholder="Nomor NIK (maks. 50)" maxLength={50} />
                <FormField label="No. HP" value={String(editForm.no_hp ?? '')} onChange={v => updateField('no_hp', v)} placeholder="No. HP (maks. 20)" maxLength={20} />
                <FormSelect label="Jenis Kelamin" value={String(editForm.jenis_kelamin ?? '')} onChange={v => updateField('jenis_kelamin', v)}
                  options={[{ value: 'L', label: 'Laki-laki' }, { value: 'P', label: 'Perempuan' }]} />
                <FormField label="Tempat Lahir" value={String(editForm.tempat_lahir ?? '')} onChange={v => updateField('tempat_lahir', v)} placeholder="Kota kelahiran (maks. 255)" maxLength={255} />
                <FormField label="Tanggal Lahir" value={String(editForm.tanggal_lahir ?? '')} onChange={v => updateField('tanggal_lahir', v)} type="date" />
                <FormSelect label="Status Nikah" value={String(editForm.status_pernikahan ?? '')} onChange={v => updateField('status_pernikahan', v)}
                  options={[{ value: 'Belum Nikah', label: 'Belum Nikah' }, { value: 'Nikah', label: 'Nikah' }, { value: 'Cerai', label: 'Cerai' }]} />
              </div>

              <h3 className="mb-3 text-sm font-bold text-[#3c4043] ">Alamat</h3>
              <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="sm:col-span-2 lg:col-span-3">
                  <FormField label="Alamat" value={String(editForm.alamat ?? '')} onChange={v => updateField('alamat', v)} placeholder="Alamat lengkap" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#5f6368]">Provinsi</label>
                  <select
                    value={findWilayahIdByName(provinsiList, editForm.provinsi ?? null)}
                    onChange={e => {
                      const id = e.target.value
                      const found = provinsiList.find(p => p.id === id)
                      updateField('provinsi', found?.name || '')
                      updateField('kabupaten', '')
                      updateField('kecamatan', '')
                      updateField('desa', '')
                      if (id) loadWilayahKabupaten(id)
                    }}
                    disabled={wilayahLoading.provinsi}
                    className={`w-full border bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition ${wilayahLoading.provinsi ? 'cursor-wait' : ''} border-[#dadce0] focus:border-[#1a73e8] focus:border-[#1a73e8]`}
                  >
                    <option value="">{wilayahLoading.provinsi ? 'Memuat...' : 'Pilih Provinsi'}</option>
                    {provinsiList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#5f6368]">Kab./Kota</label>
                  <select
                    value={findWilayahIdByName(kabupatenList, editForm.kabupaten ?? null)}
                    onChange={e => {
                      const id = e.target.value
                      const found = kabupatenList.find(k => k.id === id)
                      updateField('kabupaten', found?.name || '')
                      updateField('kecamatan', '')
                      updateField('desa', '')
                      if (id) loadWilayahKecamatan(id)
                    }}
                    disabled={!findWilayahIdByName(provinsiList, editForm.provinsi ?? null) || wilayahLoading.kabupaten}
                    className={`w-full border bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition ${wilayahLoading.kabupaten ? 'cursor-wait' : ''} border-[#dadce0] focus:border-[#1a73e8] focus:border-[#1a73e8] disabled:cursor-not-allowed disabled:bg-[#f8f9fa] disabled:text-[#80868b]`}
                  >
                    <option value="">{!findWilayahIdByName(provinsiList, editForm.provinsi ?? null) ? 'Pilih Provinsi dulu' : wilayahLoading.kabupaten ? 'Memuat...' : 'Pilih Kab./Kota'}</option>
                    {kabupatenList.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#5f6368]">Kecamatan</label>
                  <select
                    value={findWilayahIdByName(kecamatanList, editForm.kecamatan ?? null)}
                    onChange={e => {
                      const id = e.target.value
                      const found = kecamatanList.find(k => k.id === id)
                      updateField('kecamatan', found?.name || '')
                      updateField('desa', '')
                      if (id) loadWilayahDesa(id)
                    }}
                    disabled={!findWilayahIdByName(kabupatenList, editForm.kabupaten ?? null) || wilayahLoading.kecamatan}
                    className={`w-full border bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition ${wilayahLoading.kecamatan ? 'cursor-wait' : ''} border-[#dadce0] focus:border-[#1a73e8] focus:border-[#1a73e8] disabled:cursor-not-allowed disabled:bg-[#f8f9fa] disabled:text-[#80868b]`}
                  >
                    <option value="">{!findWilayahIdByName(kabupatenList, editForm.kabupaten ?? null) ? 'Pilih Kab./Kota dulu' : wilayahLoading.kecamatan ? 'Memuat...' : 'Pilih Kecamatan'}</option>
                    {kecamatanList.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#5f6368]">Desa</label>
                  <select
                    value={findWilayahIdByName(desaList, editForm.desa ?? null)}
                    onChange={e => {
                      const id = e.target.value
                      const found = desaList.find(d => d.id === id)
                      updateField('desa', found?.name || '')
                    }}
                    disabled={!findWilayahIdByName(kecamatanList, editForm.kecamatan ?? null) || wilayahLoading.desa}
                    className={`w-full border bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition ${wilayahLoading.desa ? 'cursor-wait' : ''} border-[#dadce0] focus:border-[#1a73e8] focus:border-[#1a73e8] disabled:cursor-not-allowed disabled:bg-[#f8f9fa] disabled:text-[#80868b]`}
                  >
                    <option value="">{!findWilayahIdByName(kecamatanList, editForm.kecamatan ?? null) ? 'Pilih Kecamatan dulu' : wilayahLoading.desa ? 'Memuat...' : 'Pilih Desa'}</option>
                    {desaList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>

              <h3 className="mb-3 text-sm font-bold text-[#3c4043] ">Pendidikan & Data Fisik</h3>
              <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <FormSelect label="Pendidikan Terakhir" value={String(editForm.pendidikan_terakhir ?? '')} onChange={v => updateField('pendidikan_terakhir', v)}
                  options={[{ value: 'SD/Sederajat', label: 'SD/Sederajat' }, { value: 'SMP/Sederajat', label: 'SMP/Sederajat' }, { value: 'SMA/Sederajat', label: 'SMA/Sederajat' }, { value: 'D1-D3', label: 'D1-D3' }, { value: 'S1', label: 'S1' }, { value: 'S2', label: 'S2' }]} />
                <FormField label="Tahun Lulus" value={String(editForm.tahun_lulus ?? '')} onChange={v => updateField('tahun_lulus', v)} placeholder="Contoh: 2023 (4 digit)" maxLength={4} />
                <FormField label="Tinggi Badan (cm)" value={String(editForm.tinggi_badan ?? '')} onChange={v => updateField('tinggi_badan', v)} type="number" placeholder="cm" />
                <FormField label="Berat Badan (kg)" value={String(editForm.berat_badan ?? '')} onChange={v => updateField('berat_badan', v)} type="number" placeholder="kg" />
                <FormSelect label="Golongan Darah" value={String(editForm.goldar ?? '')} onChange={v => updateField('goldar', v)}
                  options={[{ value: 'A', label: 'A' }, { value: 'B', label: 'B' }, { value: 'AB', label: 'AB' }, { value: 'O', label: 'O' }]} />
                <FormSelect label="Ukuran Baju" value={String(editForm.ukuran_baju ?? '')} onChange={v => updateField('ukuran_baju', v)}
                  options={[{ value: 'XS', label: 'XS' }, { value: 'S', label: 'S' }, { value: 'M', label: 'M' }, { value: 'L', label: 'L' }, { value: 'XL', label: 'XL' }, { value: 'XXL', label: 'XXL' }]} />
              </div>

              <h3 className="mb-3 text-sm font-bold text-[#3c4043] ">Keluarga & Lainnya</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <FormField label="Nama Orang Tua/Wali" value={String(editForm.nama_ortu ?? '')} onChange={v => updateField('nama_ortu', v)} placeholder="Nama orang tua (maks. 255)" maxLength={255} />
                <FormField label="No. Tlp Orang Tua" value={String(editForm.no_hp_ortu ?? '')} onChange={v => updateField('no_hp_ortu', v)} placeholder="No. tlp orang tua (maks. 20)" maxLength={20} />
                <FormSelect label="Status Kandidat" value={String(editForm.status_kandidat ?? '')} onChange={v => updateField('status_kandidat', v)}
                  options={[{ value: 'Calon Kandidat', label: 'Calon Kandidat' }, { value: 'Kandidat Aktif', label: 'Kandidat Aktif' }, { value: 'Proses Belajar', label: 'Proses Belajar' }, { value: 'Mengundurkan Diri', label: 'Mengundurkan Diri' }, { value: 'Lulus Pendidikan', label: 'Lulus Pendidikan' }]} />
                <div className="sm:col-span-2 lg:col-span-3">
                  <FormField label="Keterangan" value={String(editForm.keterangan ?? '')} onChange={v => updateField('keterangan', v)} placeholder="Keterangan tambahan (maks. 500)" maxLength={500} />
                </div>
              </div>
            </form>

            <div className="flex items-center justify-end gap-3 border-t border-[#dadce0] px-6 py-3.5">
              <button type="button" onClick={cancelEdit}
                className="border border-[#dadce0] bg-white px-4 py-2 text-sm font-semibold text-[#3c4043] transition hover:bg-[#f8f9fa]">
                Batal
              </button>
              <button type="button" onClick={saveEdit} disabled={saving}
                className="inline-flex items-center gap-2 bg-[#0E6187] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#084c63] disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showTambah && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#202124]/50 p-4 pt-10 pb-10" onClick={() => { setShowTambah(false); setTambahSuccess(null) }}>
          <div className="border border-[#dadce0] w-full max-w-4xl bg-white shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)]" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#dadce0] px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center border border-[#dadce0] bg-[#f1f3f4] text-[#5f6368]">
                  <Plus size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#202124]">Tambah Data Kandidat</h2>
                  <p className="text-xs text-[#5f6368]">Lengkapi data kandidat baru</p>
                </div>
              </div>
              <button onClick={() => { setShowTambah(false); setTambahSuccess(null) }} className="p-1.5 hover:bg-[#f1f3f4] transition">
                <X size={18} className="text-[#80868b]" />
              </button>
            </div>

            {tambahSuccess ? (
              <div className="px-6 py-10 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center bg-[#0E6187]">
                  <Check size={32} className="text-[#137333]" />
                </div>
                <h3 className="text-lg font-bold text-[#202124] mb-2">Kandidat Berhasil Ditambahkan!</h3>
                <p className="text-sm text-[#5f6368] mb-6">Data kandidat baru telah tersimpan di sistem.</p>
                <div className="mx-auto mb-6 max-w-sm border border-[#dadce0] bg-[#f8f9fa] p-4 text-left">
                  <div className="mb-3">
                    <p className="text-xs text-[#80868b]">No. Registrasi</p>
                    <p className="text-sm font-mono font-bold text-[#202124]">{tambahSuccess.noReg}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#80868b]">Password Akun</p>
                    <p className="text-sm font-mono font-bold text-[#c5221f]">{tambahSuccess.password}</p>
                  </div>
                </div>
                <p className="text-xs text-[#80868b] mb-4">Simpan informasi di atas, password hanya ditampilkan sekali.</p>
                <div className="flex justify-center gap-3">
                  <button onClick={() => { setShowTambah(false); setTambahSuccess(null) }}
                    className="bg-[#0E6187] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#1a3a5c]">
                    Tutup
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleTambahSubmit} autoComplete="off" className="px-6 py-5 max-h-[70vh] overflow-y-auto">
                {tambahError && (
                  <div className="mb-4 border border-[#f6aea9] bg-[#fce8e6] px-4 py-3 text-sm text-[#a50e0e]">
                    <p className="font-semibold mb-1">Gagal menyimpan:</p>
                    <pre className="whitespace-pre-wrap text-xs">{tambahError}</pre>
                  </div>
                )}
                {/* Data Diri */}
                <h3 className="mb-3 text-sm font-bold text-[#3c4043] ">Data Diri</h3>
                <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <FormField label="Nama Lengkap *" value={tambahForm.nama} onChange={v => updateTambahField('nama', v)} placeholder="Nama lengkap" maxLength={255} error={tambahErrors.nama} />
                  <FormField label="Email *" value={tambahForm.email} onChange={v => updateTambahField('email', v)} type="email" placeholder="email@contoh.com" error={tambahErrors.email} />
                  <FormField label="NIK" value={tambahForm.nik} onChange={v => updateTambahField('nik', v)} placeholder="Nomor NIK (maks. 50)" maxLength={50} error={tambahErrors.nik} />
                  <FormField label="No. Telepon" value={tambahForm.telepon} onChange={v => updateTambahField('telepon', v)} placeholder="No. telepon (maks. 20)" maxLength={20} error={tambahErrors.telepon} />
                  <FormField label="No. HP" value={tambahForm.no_hp} onChange={v => updateTambahField('no_hp', v)} placeholder="No. HP (maks. 20)" maxLength={20} error={tambahErrors.no_hp} />
                  <FormSelect label="Jenis Kelamin" value={tambahForm.jenis_kelamin} onChange={v => updateTambahField('jenis_kelamin', v)}
                    options={[{ value: 'L', label: 'Laki-laki' }, { value: 'P', label: 'Perempuan' }]} error={tambahErrors.jenis_kelamin} />
                  <FormField label="Tempat Lahir" value={tambahForm.tempat_lahir} onChange={v => updateTambahField('tempat_lahir', v)} placeholder="Kota kelahiran (maks. 255)" maxLength={255} error={tambahErrors.tempat_lahir} />
                  <FormField label="Tanggal Lahir" value={tambahForm.tanggal_lahir} onChange={v => updateTambahField('tanggal_lahir', v)} type="date" error={tambahErrors.tanggal_lahir} />
                  <FormSelect label="Status Nikah" value={tambahForm.status_pernikahan} onChange={v => updateTambahField('status_pernikahan', v)}
                    options={[{ value: 'Belum Nikah', label: 'Belum Nikah' }, { value: 'Nikah', label: 'Nikah' }, { value: 'Cerai', label: 'Cerai' }]} error={tambahErrors.status_pernikahan} />
                </div>

                {/* Alamat */}
                <h3 className="mb-3 text-sm font-bold text-[#3c4043] ">Alamat</h3>
                <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="sm:col-span-2 lg:col-span-3">
                    <FormField label="Alamat" value={tambahForm.alamat} onChange={v => updateTambahField('alamat', v)} placeholder="Alamat lengkap" error={tambahErrors.alamat} />
                  </div>
                  <FormField label="Desa" value={tambahForm.desa} onChange={v => updateTambahField('desa', v)} placeholder="Nama desa (maks. 255)" maxLength={255} error={tambahErrors.desa} />
                  <FormField label="Kecamatan" value={tambahForm.kecamatan} onChange={v => updateTambahField('kecamatan', v)} placeholder="Nama kecamatan (maks. 255)" maxLength={255} error={tambahErrors.kecamatan} />
                  <FormField label="Kab./Kota" value={tambahForm.kabupaten} onChange={v => updateTambahField('kabupaten', v)} placeholder="Nama kabupaten/kota (maks. 255)" maxLength={255} error={tambahErrors.kabupaten} />
                  <FormField label="Provinsi" value={tambahForm.provinsi} onChange={v => updateTambahField('provinsi', v)} placeholder="Nama provinsi (maks. 255)" maxLength={255} error={tambahErrors.provinsi} />
                </div>

                {/* Pendidikan & Fisik */}
                <h3 className="mb-3 text-sm font-bold text-[#3c4043] ">Pendidikan & Data Fisik</h3>
                <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <FormSelect label="Pendidikan Terakhir" value={tambahForm.pendidikan_terakhir} onChange={v => updateTambahField('pendidikan_terakhir', v)}
                    options={[{ value: 'SD/Sederajat', label: 'SD/Sederajat' }, { value: 'SMP/Sederajat', label: 'SMP/Sederajat' }, { value: 'SMA/Sederajat', label: 'SMA/Sederajat' }, { value: 'D1-D3', label: 'D1-D3' }, { value: 'S1', label: 'S1' }, { value: 'S2', label: 'S2' }]} error={tambahErrors.pendidikan_terakhir} />
                  <FormField label="Tahun Lulus" value={tambahForm.tahun_lulus} onChange={v => updateTambahField('tahun_lulus', v)} placeholder="Contoh: 2023 (4 digit)" maxLength={4} error={tambahErrors.tahun_lulus} />
                  <FormField label="Tinggi Badan (cm)" value={tambahForm.tinggi_badan} onChange={v => updateTambahField('tinggi_badan', v)} type="number" placeholder="cm" error={tambahErrors.tinggi_badan} />
                  <FormField label="Berat Badan (kg)" value={tambahForm.berat_badan} onChange={v => updateTambahField('berat_badan', v)} type="number" placeholder="kg" error={tambahErrors.berat_badan} />
                  <FormSelect label="Golongan Darah" value={tambahForm.goldar} onChange={v => updateTambahField('goldar', v)}
                    options={[{ value: 'A', label: 'A' }, { value: 'B', label: 'B' }, { value: 'AB', label: 'AB' }, { value: 'O', label: 'O' }]} error={tambahErrors.goldar} />
                  <FormSelect label="Ukuran Baju" value={tambahForm.ukuran_baju} onChange={v => updateTambahField('ukuran_baju', v)}
                    options={[{ value: 'XS', label: 'XS' }, { value: 'S', label: 'S' }, { value: 'M', label: 'M' }, { value: 'L', label: 'L' }, { value: 'XL', label: 'XL' }, { value: 'XXL', label: 'XXL' }]} error={tambahErrors.ukuran_baju} />
                </div>

                {/* Keluarga & Lainnya */}
                <h3 className="mb-3 text-sm font-bold text-[#3c4043] ">Keluarga & Lainnya</h3>
                <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <FormField label="Nama Orang Tua/Wali" value={tambahForm.nama_ortu} onChange={v => updateTambahField('nama_ortu', v)} placeholder="Nama orang tua (maks. 255)" maxLength={255} error={tambahErrors.nama_ortu} />
                  <FormField label="No. Tlp Orang Tua" value={tambahForm.no_hp_ortu} onChange={v => updateTambahField('no_hp_ortu', v)} placeholder="No. tlp orang tua (maks. 20)" maxLength={20} error={tambahErrors.no_hp_ortu} />
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#5f6368]">Batch</label>
                    <div className="relative">
                      <button type="button" onClick={() => setShowTambahBatchDropdown(!showTambahBatchDropdown)}
                        className={`flex w-full items-center gap-2 border bg-white px-3 py-2 text-sm text-left outline-none transition ${tambahErrors.batch_id ? 'border-[#ee675c] focus:border-[#d93025] focus:border-[#1a73e8] focus:ring-[#d93025]' : 'border-[#dadce0] focus:border-[#1a73e8] focus:border-[#1a73e8]' }`}>
                        {tambahForm.batch_id ? (
                          <span className="flex items-center gap-2 truncate">
                            <span className="inline-block h-3 w-3 shrink-0 ring-1 ring-black/10" style={{ backgroundColor: batchOptions.find(b => String(b.id) === tambahForm.batch_id)?.warna || '#3b82f6' }} />
                            <span className="truncate text-[#3c4043]">{batchOptions.find(b => String(b.id) === tambahForm.batch_id)?.nama || 'Pilih...'}</span>
                          </span>
                        ) : (
                          <span className="text-[#80868b]">Pilih...</span>
                        )}
                        <svg className={`ml-auto h-4 w-4 shrink-0 text-[#80868b] transition-transform ${showTambahBatchDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </button>
                      {showTambahBatchDropdown && (
                        <div className="absolute left-0 top-full z-50 mt-1 w-full min-w-[200px] border border-[#dadce0] bg-white py-1 shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)] max-h-60 overflow-y-auto">
                          {batchOptions.map(b => (
                            <button key={b.id} type="button" onClick={() => { updateTambahField('batch_id', String(b.id)); setShowTambahBatchDropdown(false) }}
                              className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition ${String(b.id) === tambahForm.batch_id ? 'bg-[#e8f0fe] text-[#1967d2] font-medium' : 'text-[#3c4043] hover:bg-[#f8f9fa]'}`}>
                              <span className="inline-block h-3 w-3 shrink-0 ring-1 ring-black/10" style={{ backgroundColor: b.warna || '#3b82f6' }} />
                              <span className="truncate">{b.nama}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {tambahErrors.batch_id && <p className="mt-1 text-[11px] text-[#d93025]">{tambahErrors.batch_id}</p>}
                  </div>
                  <FormSelect label="Program" value={tambahForm.product_id} onChange={v => updateTambahField('product_id', v)}
                    options={productOptions.map(p => ({ value: String(p.id), label: p.nama }))} error={tambahErrors.product_id} />
                  <div className="sm:col-span-2 lg:col-span-3">
                    <FormField label="Keterangan" value={tambahForm.keterangan} onChange={v => updateTambahField('keterangan', v)} placeholder="Keterangan tambahan (maks. 500)" maxLength={500} error={tambahErrors.keterangan} />
                  </div>
                </div>
              </form>
            )}

            {/* Footer */}
            {!tambahSuccess && (
              <div className="flex items-center justify-end gap-3 border-t border-[#dadce0] px-6 py-3.5">
                <button type="button" onClick={() => { setShowTambah(false); setTambahSuccess(null) }}
                  className="border border-[#dadce0] bg-white px-4 py-2 text-sm font-semibold text-[#3c4043] transition hover:bg-[#f8f9fa]">
                  Batal
                </button>
                <button type="submit" onClick={handleTambahSubmit} disabled={tambahLoading || !tambahForm.nama || !tambahForm.email}
                  className="inline-flex items-center gap-2 bg-[#0E6187] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#084c63] disabled:opacity-50 disabled:cursor-not-allowed">
                  {tambahLoading ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                  {tambahLoading ? 'Menyimpan...' : 'Simpan Kandidat'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#202124]/50 p-4 pt-10 pb-10" onClick={resetImport}>
          <div className="border border-[#dadce0] w-full max-w-5xl bg-white shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#dadce0] px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center border border-[#dadce0] bg-[#f1f3f4] text-[#5f6368]"> <Upload size={18} /> </div> <div> <h2 className="text-base font-bold text-[#202124]">Import Data Kandidat</h2>
                  <p className="text-xs text-[#5f6368]">Upload file CSV/Excel, atau tempel langsung data dari Excel (dipisah TAB)</p>
                </div>
              </div>
              <button onClick={resetImport} className="p-1.5 hover:bg-[#f1f3f4] transition">
                <X size={18} className="text-[#80868b]" />
              </button>
            </div>
            <div className="px-6 py-5">
              {!importResult ? (
                <>
                  <div className="mb-5 flex w-fit gap-1 border border-[#dadce0] bg-[#f1f3f4] p-1">
                    <button type="button" onClick={() => setImportTab('file')}
                      className={`px-4 py-1.5 text-xs font-semibold transition ${importTab === 'file' ? 'bg-white text-[#1a73e8] ' : 'text-[#5f6368] hover:text-[#3c4043]'}`}>
                      Upload File
                    </button>
                    <button type="button" onClick={() => setImportTab('paste')}
                      className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold transition ${importTab === 'paste' ? 'bg-white text-[#1a73e8] ' : 'text-[#5f6368] hover:text-[#3c4043]'}`}>
                      <ClipboardPaste size={13} /> Tempel Data
                    </button>
                  </div>
                  <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end">
                    {importTab === 'file' ? (
                      <div className="flex-1">
                        <label className="mb-1 block text-xs font-medium text-[#5f6368]">Pilih File</label>
                        <input
                          ref={importFileRef}
                          type="file"
                          accept=".csv,.xls,.xlsx"
                          onChange={handleImportFile}
                          className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] file:mr-3 file:border-0 file:bg-[#0E6187] file:px-3 file:py-1 file:text-xs file:font-medium file:text-white hover:file:bg-[#1a3a5c]"
                        />
                      </div>
                    ) : (
                      <div className="flex-1">
                        <label className="mb-1 block text-xs font-medium text-[#5f6368]">Tempel Data dari Excel (tiap kolom dipisahkan TAB, satu kandidat per baris)</label>
                        <textarea
                          value={importPasteText}
                          onChange={e => setImportPasteText(e.target.value)}
                          rows={6}
                          placeholder={'Contoh:\n3203065607070004\t2026-05-0335\tMila Citra Lestari\tBATCH 18 GEL2\tP\tCianjur, 16 Juli 2007\tAlamat\tDesa\tKecamatan\tKabupaten\tProvinsi\t087770241206\tSMA/SMK/Sederajat\t2026\t153\t48\t\tL\tBelum Menikah\temail@contoh.com\tRohanah\t087744141335'}
                          className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8] focus:border-[#1a73e8]/20 font-mono"
                        />
                        <button
                          type="button"
                          onClick={handlePasteParse}
                          disabled={!importPasteText.trim()}
                          className="mt-2 inline-flex items-center gap-2 border border-[#1a73e8] bg-[#0E6187]/5 px-4 py-2 text-xs font-semibold text-[#1a73e8] transition hover:bg-[#0a4d6b]/10 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ClipboardPaste size={14} /> Pindai & Parsing
                        </button>
                      </div>
                    )}
                    <div className="sm:w-60">
                      <label className="mb-1 block text-xs font-medium text-[#5f6368]">Batch Tujuan</label>
                      <div className="relative shrink-0" ref={importBatchDropdownRef}>
                        <button type="button" onClick={() => setShowImportBatchDropdown(!showImportBatchDropdown)}
                          className="flex items-center gap-2 border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8] focus:border-[#1a73e8]/20 w-full min-w-[180px] hover:shadow">
                          {importBatchId ? (
                            <span className="flex items-center gap-2 truncate">
                              <span className="inline-block h-3 w-3 shrink-0 ring-1 ring-black/10" style={{ backgroundColor: batchOptions.find(b => String(b.id) === importBatchId)?.warna || '#3b82f6' }} />
                              <span className="truncate">{batchOptions.find(b => String(b.id) === importBatchId)?.nama || 'Pilih Batch...'}</span>
                            </span>
                          ) : (
                            <span className="text-[#80868b]">Pilih Batch...</span>
                          )}
                          <svg className={`ml-auto h-4 w-4 text-[#80868b] transition-transform ${showImportBatchDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                        {showImportBatchDropdown && (
                          <div className="absolute left-0 top-full z-50 mt-1 w-full min-w-[220px] border border-[#dadce0] bg-white shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)] py-1 max-h-60 overflow-y-auto">
                            <button type="button" onClick={() => { setImportBatchId(''); setShowImportBatchDropdown(false) }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#5f6368] hover:bg-[#e8f0fe] hover:text-[#1967d2] transition">
                              Pilih Batch...
                            </button>
                            {batchOptions.map(b => (
                              <button key={b.id} type="button" onClick={() => { setImportBatchId(String(b.id)); setShowImportBatchDropdown(false) }}
                                className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition ${String(b.id) === importBatchId ? 'bg-[#e8f0fe] text-[#1967d2] font-medium' : 'text-[#3c4043] hover:bg-[#f8f9fa]'}`}>
                                <span className="inline-block h-3 w-3 shrink-0 ring-1 ring-black/10" style={{ backgroundColor: b.warna || '#3b82f6' }} />
                                <span className="truncate">{b.nama}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="sm:w-60">
                      <label className="mb-1 block text-xs font-medium text-[#5f6368]">Program / Product</label>
                      <select
                        value={importProductId}
                        onChange={e => setImportProductId(e.target.value)}
                        className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none focus:border-[#1a73e8] focus:border-[#1a73e8]/20"
                      >
                        <option value="">Pilih Program...</option>
                        {productOptions.map(p => (
                          <option key={p.id} value={p.id}>{p.nama}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={handleImportSubmit}
                      disabled={!importBatchId || importData.length === 0 || importLoading}
                      className="inline-flex items-center gap-2 bg-[#0E6187] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#1a3a5c] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {importLoading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                      {importLoading ? 'Mengimport...' : `Import ${importData.length} Data`}
                    </button>
                  </div>

                  {importData.length > 0 && (
                    <div className="mb-5">
                      <p className="mb-2 text-xs font-medium text-[#5f6368]">Pemetaan Kolom ({importData.length} baris terdeteksi)</p>
                      <p className="mb-3 text-[11px] text-[#80868b]">Kolom dengan nama yang cocok akan otomatis dipetakan. Sesuaikan jika perlu. Kolom yang dipilih "- Lewati -" tidak akan diimport.</p>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {importHeaders.map(h => (
                          <div key={h} className="flex items-center gap-2 border border-[#dadce0] bg-[#f8f9fa] px-2 py-1.5">
                            <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-[#3c4043]" title={h}>{h}</span>
                            <svg className="h-3 w-3 flex-shrink-0 text-[#9aa0a6]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            <select
                              value={importMapping[h] || ''}
                              onChange={e => setImportMapping(prev => ({ ...prev, [h]: e.target.value }))}
                              className="w-[130px] border border-[#dadce0] bg-white px-1.5 py-0.5 text-[11px] text-[#3c4043] outline-none focus:border-[#8ab4f8]"
                            >
                              {fieldOptions.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {importData.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-medium text-[#5f6368]">Preview Data (5 baris pertama)</p>
                      <div className="overflow-x-auto border border-[#dadce0]">
                        <table className="w-full min-w-[600px] border-collapse text-left text-xs text-[#3c4043]">
                          <thead>
                            <tr className="bg-[#f8f9fa]">
                              {importHeaders.filter(h => importMapping[h]).map(h => (
                                <th key={h} className="border border-[#dadce0] px-3 py-2 font-semibold text-[#5f6368]">{h}<br /><span className="font-normal text-[#80868b]">→ {fieldOptions.find(f => f.value === importMapping[h])?.label || importMapping[h]}</span></th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {importData.slice(0, 5).map((row, i) => (
                              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#f8f9fa]/50'}>
                                {importHeaders.filter(h => importMapping[h]).map(h => (
                                  <td key={h} className="border border-[#dadce0] px-3 py-2">{String(row[h] ?? '')}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-6 text-center">
                  {importResult.success > 0 && importResult.failed === 0 ? (
                    <>
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center bg-[#0E6187]">
                        <Check size={32} className="text-[#137333]" />
                      </div>
                      <h3 className="mb-2 text-lg font-bold text-[#202124]">Import Berhasil!</h3>
                      <p className="text-sm text-[#5f6368]">{importResult.success} data kandidat berhasil diimport.</p>
                    </>
                  ) : (
                    <>
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center bg-[#feefc3]">
                        <FileText size={32} className="text-[#b06000]" />
                      </div>
                      <h3 className="mb-2 text-lg font-bold text-[#202124]">Import Selesai</h3>
                      <p className="text-sm text-[#5f6368] mb-4">
                        <span className="font-semibold text-[#137333]">{importResult.success} berhasil</span> dan{' '}
                        <span className="font-semibold text-[#c5221f]">{importResult.failed} gagal</span>
                      </p>
                      {importResult.errors.length > 0 && (
                        <div className="mx-auto max-w-lg text-left">
                          <p className="mb-2 text-xs font-medium text-[#5f6368]">Detail Error:</p>
                          <div className="max-h-48 overflow-y-auto border border-[#f6aea9] bg-[#fce8e6] p-3">
                            {importResult.errors.map((err, i) => (
                              <p key={i} className="mb-1 text-xs text-[#c5221f]">
                                {err.row > 0 ? `Baris ${err.row}: ` : ''}{err.message}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {importResult.created.length > 0 && (
                    <div className="mx-auto mt-4 max-w-2xl text-left">
                      <p className="mb-2 text-xs font-medium text-[#5f6368]">Data Akun Kandidat (Email + Password untuk login):</p>
                      <div className="max-h-64 overflow-y-auto border border-[#a8dab5] bg-[#e6f4ea]">
                        <table className="w-full border-collapse text-left text-xs">
                          <thead className="sticky top-0">
                            <tr>
                              <th className="text-xs font-medium text-[#5f6368] px-3 py-2">No. Reg</th>
                              <th className="text-xs font-medium text-[#5f6368] px-3 py-2">Nama</th>
                              <th className="text-xs font-medium text-[#5f6368] px-3 py-2">Email</th>
                              <th className="text-xs font-medium text-[#5f6368] px-3 py-2">Password</th>
                            </tr>
                          </thead>
                          <tbody>
                            {importResult.created.map((c, i) => (
                              <tr key={i} className={i % 2 === 0 ? 'bg-[#e6f4ea]' : 'bg-white'}>
                                <td className="border-b border-[#e8eaed] px-3 py-1.5 font-mono text-[11px] text-[#3c4043]">{c.no_registrasi}</td>
                                <td className="border-b border-[#e8eaed] px-3 py-1.5 text-[#3c4043]">{c.nama}</td>
                                <td className="border-b border-[#e8eaed] px-3 py-1.5 text-[#3c4043]">{c.email}</td>
                                <td className="border-b border-[#e8eaed] px-3 py-1.5 font-mono font-bold text-[#202124]">{c.password}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <p className="mt-2 text-[11px] text-[#b06000]">Simpan data ini! Password hanya ditampilkan sekali ini saja.</p>
                    </div>
                  )}

                  <button onClick={resetImport} className="mt-6 inline-flex items-center gap-2 bg-[#202124] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#202124]">
                    Tutup
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Export Akun Login Modal */}
      {showExportLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#202124]/50 p-4" onClick={() => setShowExportLogin(false)}>
          <div className="border border-[#dadce0] w-full max-w-md bg-white shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#dadce0] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center border border-[#dadce0] bg-[#f1f3f4] text-[#5f6368]"> <KeyRound size={18} /> </div> <div> <h3 className="text-sm font-bold text-[#202124]">Export Akun Login Kandidat</h3>
                  <p className="text-xs text-[#5f6368]">Pilih batch & cabang, lalu export PDF</p>
                </div>
              </div>
              <button onClick={() => setShowExportLogin(false)} className="p-1.5 text-[#80868b] hover:bg-[#f1f3f4] transition">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4 px-5 py-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-[#5f6368]">Batch <span className="text-[#d93025]">*</span></label>
                <div className="relative" ref={exportBatchDropdownRef}>
                  <button type="button" onClick={() => setShowExportBatchDropdown(!showExportBatchDropdown)}
                    className="flex w-full items-center gap-2 border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8] focus:border-[#1a73e8]/20 hover:shadow">
                    {exportBatchId ? (
                      <span className="flex items-center gap-2 truncate">
                        <span className="inline-block h-3 w-3 shrink-0 ring-1 ring-black/10" style={{ backgroundColor: batchOptions.find(b => String(b.id) === exportBatchId)?.warna || '#3b82f6' }} />
                        <span className="truncate">{batchOptions.find(b => String(b.id) === exportBatchId)?.nama || 'Pilih Batch...'}</span>
                      </span>
                    ) : (
                      <span className="text-[#80868b]">Pilih Batch...</span>
                    )}
                    <svg className={`ml-auto h-4 w-4 text-[#80868b] transition-transform ${showExportBatchDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {showExportBatchDropdown && (
                    <div className="absolute left-0 top-full z-50 mt-1 w-full min-w-[220px] border border-[#dadce0] bg-white shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)] py-1 max-h-60 overflow-y-auto">
                      <button type="button" onClick={() => { setExportBatchId(''); setShowExportBatchDropdown(false) }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#5f6368] hover:bg-[#e8f0fe] hover:text-[#1967d2] transition">
                        Pilih Batch...
                      </button>
                      {batchOptions.map(b => (
                        <button key={b.id} type="button" onClick={() => { setExportBatchId(String(b.id)); setShowExportBatchDropdown(false) }}
                          className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition ${String(b.id) === exportBatchId ? 'bg-[#e8f0fe] text-[#1967d2] font-medium' : 'text-[#3c4043] hover:bg-[#f8f9fa]'}`}>
                          <span className="inline-block h-3 w-3 shrink-0 ring-1 ring-black/10" style={{ backgroundColor: b.warna || '#3b82f6' }} />
                          <span className="truncate">{b.nama}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {!isCabang && (
              <div>
                <label className="mb-1 block text-xs font-medium text-[#5f6368]">Cabang</label>
                <select
                  value={exportCabangId}
                  onChange={e => setExportCabangId(e.target.value)}
                  className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8] focus:border-[#1a73e8]/20"
                >
                  <option value="">Semua Cabang</option>
                  {cabangOptions.map(c => (
                    <option key={c.id} value={c.id}>{c.nama}</option>
                  ))}
                </select>
              </div>
              )}
              <div className="border border-[#a8dab5] bg-[#e6f4ea] px-3 py-2.5 text-xs text-[#137333]">
                PDF berisi <span className="font-semibold">No. Registrasi, Nama, E-mail, dan Password</span> login kandidat pada batch & cabang terpilih.
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-[#dadce0] px-5 py-3.5">
              <button onClick={() => setShowExportLogin(false)}
                className="border border-[#dadce0] bg-white px-4 py-2 text-sm font-semibold text-[#3c4043] transition hover:bg-[#f8f9fa]">
                Batal
              </button>
              <button onClick={handleExportLoginPdf} disabled={!exportBatchId || exporting}
                className="inline-flex items-center gap-2 bg-[#0E6187] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#1a3a5c] disabled:opacity-50 disabled:cursor-not-allowed">
                {exporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                {exporting ? 'Mengekspor...' : 'Export PDF'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {paymentModal && (() => {
        const { kandidat: k, items, kategoris } = paymentModal

        const distribusi = (() => {
          const jml = Number(paymentJumlah.replace(/\./g, ''))
          if (!jml || jml <= 0) return []
          const result: { nama: string; kategori_id: number; biaya: number; dibayar: number; bayar: number }[] = []
          let sisa = jml
          for (const kat of kategoris) {
            if (sisa <= 0) break
            const item = items.find(i => i.kategori_id === kat.id)
            if (!item || item.biaya <= 0) continue
            const kurang = item.biaya - item.dibayar
            if (kurang <= 0) continue
            const bayar = Math.min(sisa, kurang)
            sisa -= bayar
            result.push({ nama: kat.nama, kategori_id: kat.id, biaya: item.biaya, dibayar: item.dibayar, bayar })
          }
          return result
        })()

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#202124]/50 p-4" onClick={() => setPaymentModal(null)}>
            <div className="border border-[#dadce0] w-full max-w-lg bg-white shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)]" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-[#dadce0] px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center bg-[#e6f4ea]">
                    <DollarSign size={18} className="text-[#137333]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#202124]">Pembayaran Tagihan</h3>
                    <p className="text-xs text-[#5f6368]">{k.nama}</p>
                  </div>
                </div>
                <button onClick={() => setPaymentModal(null)} className="p-1 text-[#80868b] hover:bg-[#f1f3f4] hover:text-[#5f6368]">
                  <X size={17} />
                </button>
              </div>

              <div className="space-y-4 px-5 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#5f6368] mb-1">Tanggal</label>
                    <input type="date" value={new Date().toISOString().split('T')[0]} readOnly
                      className="w-full border border-[#dadce0] bg-[#f8f9fa] px-3 py-2 text-sm text-[#5f6368]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#5f6368] mb-1">Batch</label>
                    <input type="text" value={k.batch_nama || '-'} readOnly
                      className="w-full border border-[#dadce0] bg-[#f8f9fa] px-3 py-2 text-sm text-[#5f6368]" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#5f6368] mb-1">Nama Kandidat</label>
                  <input type="text" value={k.nama} readOnly
                    className="w-full border border-[#dadce0] bg-[#f8f9fa] px-3 py-2 text-sm text-[#5f6368]" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#5f6368] mb-1">Nominal Pembayaran <span className="text-[#d93025]">*</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-[#80868b]">Rp</span>
                    <input type="text" inputMode="numeric" required value={paymentJumlah}
                      onChange={e => {
                        const raw = e.target.value.replace(/[^\d]/g, '')
                        setPaymentJumlah(raw ? Number(raw).toLocaleString('id-ID') : '')
                      }}
                      placeholder="0"
                      className="w-full border border-[#dadce0] bg-white py-2 pl-10 pr-3 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8] focus:border-[#1a73e8]" />
                  </div>
                </div>

                {distribusi.length > 0 && (
                  <div className="border border-[#aecbfa] bg-[#e8f0fe] p-3 space-y-2">
                    <p className="text-[11px] font-semibold text-[#1967d2] ">Preview Distribusi Pembayaran</p>
                    {distribusi.map((d, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-[#3c4043] font-medium">{d.nama}</span>
                        <span className="font-semibold text-[#3c4043]">Rp {d.bayar.toLocaleString('id-ID')}</span>
                      </div>
                    ))}
                    {Number(paymentJumlah.replace(/\./g, '')) > distribusi.reduce((s, d) => s + d.bayar, 0) && (
                      <div className="border-t border-[#aecbfa] pt-2 mt-2 flex justify-between text-sm">
                        <span className="text-[#1a73e8]">Sisa kembali</span>
                        <span className="font-bold text-[#1967d2]">Rp {(Number(paymentJumlah.replace(/\./g, '')) - distribusi.reduce((s, d) => s + d.bayar, 0)).toLocaleString('id-ID')}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-[#dadce0] px-5 py-3">
                <p className="text-[11px] text-[#80868b]">Pembayaran akan langsung tercatat</p>
                <div className="flex gap-2">
                  <button onClick={() => setPaymentModal(null)}
                    className="border border-[#dadce0] bg-white px-4 py-2 text-xs font-medium text-[#3c4043] transition hover:bg-[#f8f9fa]">
                    Batal
                  </button>
                  <button
                    disabled={paymentSaving || !paymentJumlah || Number(paymentJumlah.replace(/\./g, '')) <= 0 || distribusi.length === 0}
                    onClick={async () => {
                      const jml = Number(paymentJumlah.replace(/\./g, ''))
                      if (!jml || jml <= 0) return
                      setPaymentSaving(true)
                      try {
                        for (const d of distribusi) {
                          if (d.bayar <= 0) continue
                          await (isCabang ? adminCabangApi.bayarManual(k.id, { jumlah: d.bayar, kategori_id: d.kategori_id }) : pendaftarApi.bayarManual(k.id, { jumlah: d.bayar, kategori_id: d.kategori_id }))
                        }
                        setPaymentModal(null)
                        fetchData(search)
                        Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Pembayaran berhasil dicatat.', confirmButtonColor: '#0E6187', timer: 2000, timerProgressBar: true, showConfirmButton: false })
                      } catch (err: any) {
                        const msg = err?.response?.data?.message || err?.message || 'Terjadi kesalahan'
                        Swal.fire({ icon: 'error', title: 'Gagal', text: msg, confirmButtonColor: '#0E6187' })
                      } finally {
                        setPaymentSaving(false)
                      }
                    }}
                    className="inline-flex items-center gap-1.5 bg-[#0E6187] px-5 py-2 text-xs font-medium text-white transition hover:bg-[#084c63] disabled:opacity-50"
                  >
                    {paymentSaving ? 'Menyimpan...' : 'Simpan Pembayaran'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {mergeModal && (() => {
        const mk = mergeModal.kandidat
        const totalPages = Math.max(1, Math.ceil(mergeTotal / 25))
        const badgeFor = (s: string | null) => {
          const map: Record<string, string> = {
            draft: 'border-[#dadce0] bg-[#f1f3f4] text-[#5f6368]',
            submitted: 'border-[#fdd663] bg-[#fef7e0] text-[#b06000]',
            reviewed: 'border-[#aecbfa] bg-[#e8f0fe] text-[#1967d2]',
            approved: 'border-[#a8dab5] bg-[#e6f4ea] text-[#137333]',
            rejected: 'border-[#f6aea9] bg-[#fce8e6] text-[#c5221f]',
          }
          return map[s || ''] || 'border-[#dadce0] bg-[#f1f3f4] text-[#5f6368]'
        }
        return (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#202124]/50 p-4" onClick={() => setMergeModal(null)}>
            <div className="border border-[#dadce0] w-full max-w-5xl overflow-hidden bg-white shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)]" onClick={e => e.stopPropagation()}>
              <div className="flex items-start justify-between border-b border-[#dadce0] px-5 py-4">
                <div>
                  <h2 className="text-base font-semibold text-[#202124]">Merge Job Matching</h2>
                  <p className="mt-0.5 text-xs text-[#5f6368]">
                    Pilih kandidat dari Sistem Penempatan untuk <span className="font-semibold text-[#3c4043]">{mk.nama}</span> ({mk.no_registrasi})
                  </p>
                </div>
                <button onClick={() => setMergeModal(null)} className="p-1.5 hover:bg-[#f1f3f4] transition"><X size={18} className="text-[#80868b]" /></button>
              </div>

              <div className="flex items-center gap-3 border-b border-[#dadce0] px-5 py-3">
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#80868b]" />
                  <input
                    value={mergeQuery}
                    onChange={e => { setMergeQuery(e.target.value); setMergePage(1) }}
                    placeholder="Cari nama kandidat Sistem Penempatan..."
                    className="w-full border border-[#dadce0] bg-white py-2 pl-9 pr-3 text-sm text-[#3c4043] outline-none transition placeholder:text-[#80868b] focus:border-[#1a73e8]"
                  />
                </div>
                <span className="shrink-0 text-xs text-[#5f6368]">Kandidat {mergeTotal} item</span>
              </div>

              <div className="max-h-[50vh] overflow-auto">
                {mergeLoading ? (
                  <div className="flex items-center justify-center gap-2 py-12 text-sm text-[#80868b]">
                    <Loader2 size={16} className="animate-spin" /> Memuat kandidat...
                  </div>
                ) : mergeList.length === 0 ? (
                  <p className="py-12 text-center text-sm text-[#80868b]">Tidak ada kandidat ditemukan.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10 text-left text-[11px] r text-[#5f6368]">
                      <tr>
                        <th className="text-xs font-medium text-[#5f6368] px-4 py-2.5">No</th>
                        <th className="text-xs font-medium text-[#5f6368] px-4 py-2.5">Kandidat</th>
                        <th className="text-xs font-medium text-[#5f6368] px-4 py-2.5">Cabang</th>
                        <th className="text-xs font-medium text-[#5f6368] px-4 py-2.5">JK</th>
                        <th className="text-xs font-medium text-[#5f6368] px-4 py-2.5">Umur</th>
                        <th className="text-xs font-medium text-[#5f6368] px-4 py-2.5">Bidang SSW</th>
                        <th className="text-xs font-medium text-[#5f6368] px-4 py-2.5">Progres</th>
                        <th className="text-xs font-medium text-[#5f6368] px-4 py-2.5">Status Formulir</th>
                        <th className="text-xs font-medium text-[#5f6368] px-4 py-2.5">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e8eaed]">
                      {mergeList.map((item, i) => (
                        <tr key={item.id} className="hover:bg-[#f8f9fa]/60">
                          <td className="px-4 py-2.5 text-[#5f6368]">{(mergePage - 1) * 25 + i + 1}</td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2.5">
                              {item.foto_url ? (
                                <img src={item.foto_url} alt={item.nama_romaji} className="h-9 w-9 object-cover flex-none" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                              ) : (
                                <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(item.nama_romaji || '-')}&background=e5e7eb&color=6b7280&size=36`} className="h-9 w-9 flex-none" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                              )}
                              <div>
                                <p className="font-medium text-[#202124]">{item.nama_romaji || '-'}</p>
                                {item.nama_katakana ? <p className="text-xs text-[#80868b]">{item.nama_katakana}</p> : null}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-[#5f6368]">{item.nama_cabang || '-'}</td>
                          <td className="px-4 py-2.5 text-[#5f6368]">{item.jenis_kelamin || '-'}</td>
                          <td className="px-4 py-2.5 text-[#5f6368]">{item.umur ?? '-'}</td>
                          <td className="px-4 py-2.5 text-[#5f6368]">{item.bidang_ssw || '-'}</td>
                          <td className="px-4 py-2.5 text-[#5f6368]">{item.status_progres || '-'}</td>
                          <td className="px-4 py-2.5">
                            <span className={`border px-2 py-0.5 text-[11px] font-medium ${badgeFor(item.status_formulir)}`}>{item.status_formulir || '-'}</span>
                          </td>
                          <td className="px-4 py-2.5">
                            <button
                              disabled={mergeMerging !== null}
                              onClick={() => handleMerge(item)}
                              className="inline-flex items-center gap-1.5 bg-[#0E6187] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#0a4d69] disabled:opacity-50"
                            >
                              {mergeMerging === item.id ? <Loader2 size={13} className="animate-spin" /> : <ClipboardPaste size={13} />}
                              Merge
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-[#dadce0] px-5 py-3">
                <p className="text-xs text-[#5f6368]">Total {mergeTotal} kandidat</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setMergePage(p => Math.max(1, p - 1))} disabled={mergePage <= 1} className="border border-[#dadce0] bg-white p-1.5 text-[#80868b] transition hover:bg-[#f8f9fa] hover:text-[#5f6368] disabled:opacity-30 disabled:pointer-events-none">
                    <ChevronLeft size={15} />
                  </button>
                  <span className="px-2 text-xs text-[#5f6368]">Hal {mergePage} / {totalPages}</span>
                  <button onClick={() => setMergePage(p => Math.min(totalPages, p + 1))} disabled={mergePage >= totalPages} className="border border-[#dadce0] bg-white p-1.5 text-[#80868b] transition hover:bg-[#f8f9fa] hover:text-[#5f6368] disabled:opacity-30 disabled:pointer-events-none">
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

function InfoItem({ label, value, mono }: { label: string; value: string | null | undefined; mono?: boolean }) {
  const show = value !== null && value !== undefined && value !== '' && value !== '-'
  return (
    <div>
      <p className="text-xs font-medium text-[#80868b]">{label}</p>
      <p className={`text-sm font-medium ${mono ? 'font-mono' : ''} ${show ? 'text-[#202124]' : 'text-[#9aa0a6]'}`}>
        {show ? value : '-'}
      </p>
    </div>
  )
}

function docLabel(jenis: string | null | undefined): string {
  const map: Record<string, string> = {
    pas_foto: 'Pas Foto', foto_full_body: 'Foto Full Body', ktp: 'KTP', ijazah: 'Ijazah',
    akte: 'Akte Kelahiran', kk: 'Kartu Keluarga', sertifikat_jft: 'Sertifikat JFT',
    lainnya: 'Lainnya',
  }
  if (!jenis) return 'Dokumen'
  if (map[jenis]) return map[jenis]
  if (/^ssw/i.test(jenis)) return 'Sertifikat SSW'
  return jenis.replace(/_/g, ' ')
}

function MatchingJobSection({ data, learningLevel, statusFormulir }: { data: Record<string, any>; learningLevel?: number | null; statusFormulir?: string }) {
  if (!data || Object.keys(data).length === 0) {
    return <p className="text-xs text-[#80868b]">Belum ada data dari form Data Diri & Matching Job.</p>
  }

  const fmtYes = (v: any) => (v === 1 || v === '1' ? 'Ya' : v === 0 || v === '0' ? 'Tidak' : null)
  const raw = (v: any) => (v === null || v === undefined || v === '' ? null : String(v))
  const kemampuanAktif = (learningLevel ?? 1) >= 2

  const Item = ({ label, value, className }: { label: string; value: any; className?: string }) => (
    <div className={className}>
      <p className="text-[11px] font-semibold text-[#80868b]">{label}</p>
      <p className="mt-0.5 break-words text-sm font-medium text-[#202124]">{raw(value) ?? '-'}</p>
    </div>
  )

  const SectionCard = ({ title, right, children }: { title: string; right?: ReactNode; children: ReactNode }) => (
    <div className="border border-[#dadce0] bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold text-[#5f6368]">{title}</p>
        {right}
      </div>
      {children}
    </div>
  )

  const pendidikan: any[] = Array.isArray(data.pendidikan) ? data.pendidikan : []
  const pengalaman: any[] = Array.isArray(data.pengalaman) ? data.pengalaman : []
  const keluarga: any[] = Array.isArray(data.keluarga) ? data.keluarga : []
  const keahlian: any[] = Array.isArray(data.keahlian_dimiliki) ? data.keahlian_dimiliki : []
  const ssw: string[] = Array.isArray(data.sertifikat_ssw) ? data.sertifikat_ssw : []

  const warnaStatus: Record<string, string> = {
    pending: 'bg-[#feefc3] text-[#b06000]',
    final: 'bg-[#ceead6] text-[#137333]',
    submitted: 'bg-[#d2e3fc] text-[#1967d2]',
    'locked': 'bg-[#f1f3f4] text-[#5f6368]',
  }

  return (
    <div className="space-y-4">
      <SectionCard
        title="Data Pribadi & Kontak"
        right={statusFormulir ? (
          <span className={`px-2.5 py-0.5 text-[11px] font-semibold capitalize ${warnaStatus[statusFormulir.toLowerCase()] ?? 'bg-[#f1f3f4] text-[#5f6368]'}`}>
            {statusFormulir}
          </span>
        ) : undefined}
      >
        <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
          <Item label="Nama (Romaji)" value={data.nama_romaji} />
          <Item label="Nama (Katakana)" value={data.nama_katakana} />
          <Item label="NIK" value={data.nik} />
          <Item label="Tempat, Tanggal Lahir" value={[raw(data.tempat_lahir), raw(data.tanggal_lahir)].filter(Boolean).join(', ')} />
          <Item label="Umur" value={data.umur} />
          <Item label="Jenis Kelamin" value={data.jenis_kelamin} />
          <Item label="Status Pernikahan" value={data.status_pernikahan} />
          <Item label="Agama" value={data.agama} />
          <Item label="Tinggi / Berat Badan" value={[raw(data.tinggi_badan), raw(data.berat_badan)].filter(Boolean).join(' / ')} />
          <Item label="Golongan Darah" value={data.golongan_darah} />
          <Item label="Tangan Dominan" value={data.tangan_dominan} />
          <Item label="Ukuran Baju" value={data.ukuran_baju} />
          <Item label="Lingkar Pinggang" value={data.lingkar_pinggang} />
          <Item label="Panjang Telapak Kaki" value={data.panjang_telapak_kaki} />
          <Item label="SIM yang Dimiliki" value={data.sim_dimiliki} />
          <Item label="Cabang" value={data.nama_cabang || data.cabang_sim_nama} />
          <Item label="No. HP" value={data.nomor_hp} />
          <Item label="Email" value={data.email_kontak} />
          <Item label="Kontak Ortu (Nama)" value={data.kontak_ortu_nama} />
          <Item label="Kontak Ortu (HP)" value={data.kontak_ortu_hp} />
          <Item label="Desa" value={data.alamat_desa} />
          <Item label="Kecamatan" value={data.alamat_kecamatan} />
          <Item label="Kabupaten" value={data.alamat_kabupaten} />
          <Item label="Provinsi" value={data.alamat_provinsi} />
          <Item label="Alamat Lengkap" value={data.alamat_lengkap} className="sm:col-span-2" />
        </div>
      </SectionCard>

      <SectionCard title="Kesehatan">
        <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
          <Item label="Sudah Vaksin" value={fmtYes(data.sudah_vaksin)} />
          <Item label="Kondisi Kesehatan" value={data.kondisi_kesehatan} />
          <Item label="Catatan Kesehatan" value={data.catatan_kesehatan} className="sm:col-span-2" />
          <Item label="Penglihatan Kanan" value={data.penglihatan_kanan} />
          <Item label="Penglihatan Kiri" value={data.penglihatan_kiri} />
          <Item label="Berkacamata" value={fmtYes(data.berkacamata)} />
          <Item label="Lensa Kontak" value={fmtYes(data.lensa_kontak)} />
          <Item label="Buta Warna" value={fmtYes(data.buta_warna)} />
          <Item label="Jenis Buta Warna" value={data.jenis_buta_warna} />
          <Item label="Bertato" value={fmtYes(data.bertato)} />
          <Item label="Merokok" value={fmtYes(data.merokok)} />
          <Item label="Minum Alkohol" value={fmtYes(data.minum_alkohol)} />
        </div>
        {raw(data.riwayat_penyakit) && (
          <div className="mt-3 border-t border-[#e8eaed] pt-3">
            <p className="mb-1 text-[11px] font-semibold text-[#80868b]">Riwayat Penyakit</p>
            <p className="break-words text-sm text-[#202124]">{data.riwayat_penyakit}</p>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Pendidikan Terakhir">
        <Item label="Pendidikan Terakhir" value={data.pendidikan_terakhir} />
        {pendidikan.length > 0 && (
          <div className="mt-3 grid gap-3 border-t border-[#e8eaed] pt-3 sm:grid-cols-2 lg:grid-cols-3">
            {pendidikan.map((p, i) => (
              <div key={i} className="border border-[#e8eaed] bg-[#f8f9fa] p-3">
                <p className="text-[11px] font-semibold text-[#80868b]">{p.jenjang || 'Pendidikan'}</p>
                <p className="mt-0.5 text-sm font-medium text-[#202124]">{p.nama_sekolah || '-'}</p>
                {(p.jurusan || p.tahun_lulus) && (
                  <p className="text-xs text-[#5f6368]">
                    {[raw(p.jurusan), raw(p.tahun_lulus) ? `lulus ${p.tahun_lulus}` : null].filter(Boolean).join(' · ')}
                  </p>
                )}
                {raw(p.deskripsi) && <p className="mt-1 text-xs text-[#5f6368]">{p.deskripsi}</p>}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {pengalaman.length > 0 && (
        <SectionCard title="Pengalaman Kerja">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pengalaman.map((p, i) => (
              <div key={i} className="border border-[#e8eaed] bg-[#f8f9fa] p-3">
                <p className="text-sm font-medium text-[#202124]">{p.nama_perusahaan || '-'}</p>
                <p className="text-xs text-[#5f6368]">{raw(p.posisi) || 'Posisi'}{raw(p.tahun_masuk) ? ` · ${p.tahun_masuk}${raw(p.tahun_keluar) ? ` – ${p.tahun_keluar}` : ''}` : ''}</p>
                {raw(p.deskripsi) && <p className="mt-1 text-xs text-[#5f6368]">{p.deskripsi}</p>}
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <SectionCard title="Kemampuan & Sertifikat">
        {kemampuanAktif ? (
          <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            <Item label="Level JLPT" value={data.level_jlpt} />
            <Item label="Level JFT" value={data.level_jft} />
            <Item label="Lama Belajar Jepang" value={data.lama_belajar_jepang} />
            <Item label="Level Bahasa Jepang" value={data.level_bahasa_jepang} />
            <Item label="ID Prometric" value={data.id_prometric} />
            <Item label="Password Prometric" value={data.password_prometric} />
            {ssw.length > 0 && (
              <Item label="Sertifikat SSW" value={ssw.join(', ')} className="sm:col-span-2 lg:col-span-3" />
            )}
          </div>
        ) : (
          <div className="border border-[#fdd663] bg-[#fef7e0] px-4 py-3">
            <p className="text-xs font-semibold text-[#b06000]">🔒 Kemampuan & Sertifikat (JLPT / JFT / SSW)</p>
            <p className="mt-1 text-xs text-[#b06000]">
              Belum tersedia — bagian ini terbuka setelah kandidat mencapai Level 2 pembelajaran.
            </p>
          </div>
        )}
        <div className="mt-4">
          <p className="mb-2 text-[11px] font-semibold text-[#80868b]">Keahlian yang Dimiliki</p>
          {keahlian.length === 0 ? (
            <p className="text-sm text-[#5f6368]">Tidak ada data keahlian.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {keahlian.map((k, i) => (
                <div key={i} className="border border-[#e8eaed] bg-[#f8f9fa] p-3">
                  <p className="text-sm font-medium text-[#202124]">{k.keahlian || '-'}</p>
                  <p className="text-xs text-[#5f6368]">
                    {[raw(k.tingkat), raw(k.lama_pengalaman) ? `${k.lama_pengalaman} tahun` : null].filter(Boolean).join(' · ')}
                  </p>
                  {raw(k.deskripsi) && <p className="mt-1 text-xs text-[#5f6368]">{k.deskripsi}</p>}
                  {raw(k.sertifikat_file) && <p className="mt-1 text-xs text-[#5f6368]">Sertifikat: {k.sertifikat_file}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Data Keluarga">
        <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
          <Item label="Penghasilan Keluarga" value={data.penghasilan_keluarga} />
        </div>
        {keluarga.length > 0 && (
          <div className="mt-3 grid gap-3 border-t border-[#e8eaed] pt-3 sm:grid-cols-2">
            {keluarga.map((k, i) => (
              <div key={i} className="border border-[#e8eaed] bg-[#f8f9fa] p-3">
                <p className="text-[11px] font-semibold text-[#80868b]">{k.hubungan || 'Keluarga'}</p>
                <p className="mt-0.5 text-sm font-medium text-[#202124]">{k.nama || '-'}</p>
                <p className="text-xs text-[#5f6368]">
                  {[raw(k.usia), raw(k.pekerjaan)].filter(Boolean).join(' · ')}
                </p>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Informasi Jepang">
        <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
          <Item label="Pernah ke Jepang" value={fmtYes(data.pernah_ke_jepang)} />
          <Item label="Keluarga di Jepang" value={fmtYes(data.keluarga_di_jepang)} />
          <Item label="Kenalan di Jepang" value={fmtYes(data.kenalan_di_jepang)} />
          {raw(data.hubungan_keluarga_jepang) && <Item label="Hubungan Keluarga Jepang" value={data.hubungan_keluarga_jepang} />}
          {raw(data.status_kerabat_jepang) && <Item label="Status Kerabat Jepang" value={data.status_kerabat_jepang} />}
          {raw(data.kontak_keluarga_jepang) && <Item label="Kontak Keluarga Jepang" value={data.kontak_keluarga_jepang} />}
          {raw(data.detail_kenalan) && <Item label="Detail Kenalan" value={data.detail_kenalan} className="sm:col-span-2" />}
        </div>
      </SectionCard>

      <SectionCard title="Motivasi & Tujuan">
        <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
          <Item label="Tujuan ke Jepang" value={data.tujuan_ke_jepang} />
          <Item label="Alasan ke Jepang" value={data.alasan_ke_jepang} />
          <Item label="Cita-cita Setelah Jepang" value={data.cita_cita_setelah_jepang} />
          <Item label="Rencana Pengiriman Uang" value={data.rencana_pengiriman_uang} />
          <Item label="Lama Tinggal di Jepang" value={data.lama_tinggal_jepang} />
          <Item label="Lama Kerja di Perusahaan" value={data.lama_kerja_perusahaan} />
          <Item label="Rencana Pulang" value={data.rencana_pulang} />
          <Item label="Sumber Biaya" value={data.sumber_biaya} />
          <Item label="Biaya yang Disiapkan" value={data.biaya_disiapkan} />
          <Item label="Kelebihan Diri" value={data.kelebihan_diri} />
          <Item label="Kekurangan Diri" value={data.kekurangan_diri} />
          <Item label="Hobi" value={data.hobi} />
          <Item label="Keahlian" value={data.keahlian} />
          <Item label="Bersedia Shift" value={fmtYes(data.bersedia_shift)} />
          <Item label="Bersedia Lembur" value={fmtYes(data.bersedia_lembur)} />
          <Item label="Bersedia Bekerja Hari Libur" value={fmtYes(data.bersedia_hari_libur)} />
        </div>
      </SectionCard>
    </div>
  )
}

function FormField({ label, value, onChange, type, placeholder, error, maxLength }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; error?: string; maxLength?: number }) {
  const hasError = !!error
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-[#5f6368]">{label}</label>
      <input
        type={type || 'text'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`w-full border bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition placeholder:text-[#80868b] ${hasError ? 'border-[#ee675c] focus:border-[#d93025] focus:border-[#1a73e8] focus:ring-[#d93025]' : 'border-[#dadce0] focus:border-[#1a73e8] focus:border-[#1a73e8]' }`}
      />
      {hasError && <p className="mt-1 text-[11px] text-[#d93025]">{error}</p>}
    </div>
  )
}

function FormSelect({ label, value, onChange, options, error }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; error?: string }) {
  const hasError = !!error
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-[#5f6368]">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`w-full border bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition ${hasError ? 'border-[#ee675c] focus:border-[#d93025] focus:border-[#1a73e8] focus:ring-[#d93025]' : 'border-[#dadce0] focus:border-[#1a73e8] focus:border-[#1a73e8]' }`}
      >
        <option value="">Pilih...</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {hasError && <p className="mt-1 text-[11px] text-[#d93025]">{error}</p>}
    </div>
  )
}
