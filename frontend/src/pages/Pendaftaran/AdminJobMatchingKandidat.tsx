import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import api from '../../services/api'
import MatchingJobForm from '../Siswa/MatchingJobForm'

export default function AdminJobMatchingKandidat() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const kandidatId = Number(id)
  const [nama, setNama] = useState('')

  useEffect(() => {
    if (!id) return
    api
      .get(`/kandidat/${id}/matching-job`)
      .then(res => {
        const p: any = res.data?.data?.pendaftar
        setNama(p?.nama || p?.user?.name || '')
      })
      .catch(() => {})
  }, [id])

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="sticky top-0 z-50 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-2.5 shadow-sm">
        <button
          onClick={() => navigate('/data-kandidat')}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50"
          aria-label="Kembali"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <p className="text-xs font-medium text-slate-400">Kembali ke Data Kandidat</p>
          <p className="text-sm font-bold text-slate-800">{nama || 'Memuat...'}</p>
        </div>
      </div>
      <MatchingJobForm adminKandidatId={kandidatId} onClose={() => navigate('/data-kandidat', { replace: true })} />
    </div>
  )
}