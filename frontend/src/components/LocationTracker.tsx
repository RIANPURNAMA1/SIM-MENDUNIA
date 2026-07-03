import { useState, useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { monitoringLokasiApi } from '../services/api'
import type { Absensi } from '../types'

// Fix Leaflet default marker icon
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

// @ts-expect-error - Leaflet icon fix
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
})

// Custom icons
const greenIcon = new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'hue-rotate-[90deg] brightness-[1.2] saturate-[2]',
})

const blueIcon = new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'hue-rotate-[200deg] saturate-[2]',
})

interface LocationTrackerProps {
  height?: string
  showLiveIndicator?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
}

export default function LocationTracker({
  height = 'h-72',
  showLiveIndicator = true,
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
}: LocationTrackerProps) {
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const [data, setData] = useState<Absensi[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<string>('')

  // Fetch latest attendance data
  const fetchLocationData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const res = await monitoringLokasiApi.get({
        tgl_mulai: today,
        tgl_selesai: today,
      })
      setData(res.data.data || [])
      setLastUpdate(new Date().toLocaleTimeString('id-ID'))
      setLoading(false)
    } catch (err) {
      console.error('Failed to fetch location data:', err)
      setLoading(false)
    }
  }

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    mapRef.current = L.map(mapContainerRef.current, {
      center: [-2.5489, 118.0149],
      zoom: 5,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapRef.current)

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // Fetch initial data
  useEffect(() => {
    fetchLocationData()
  }, [])

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return

    refreshIntervalRef.current = setInterval(() => {
      fetchLocationData()
    }, refreshInterval)

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [autoRefresh, refreshInterval])

  // Update markers when data changes
  useEffect(() => {
    const map = mapRef.current
    if (!map || !data.length) return

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    const bounds: L.LatLngBoundsExpression[] = []

    data.forEach((item) => {
      // Check-in marker
      if (item.lat_masuk && item.long_masuk) {
        const popup = `
          <div style="font-size:12px;line-height:1.5">
            <b>${item.user?.name || '-'}</b><br/>
            <span style="color:#059669">●</span> <strong>Check-in</strong> ${item.jam_masuk || '-'}<br/>
            <span style="font-size:11px;color:#666">${item.tanggal}</span><br/>
            <span style="font-size:11px;color:#666">${item.cabang?.nama_cabang || '-'}</span>
          </div>`
        const marker = L.marker([item.lat_masuk, item.long_masuk], { icon: greenIcon })
          .addTo(map)
          .bindPopup(popup)
        markersRef.current.push(marker)
        bounds.push([item.lat_masuk, item.long_masuk])
      }

      // Check-out marker
      if (item.lat_pulang && item.long_pulang) {
        const popup = `
          <div style="font-size:12px;line-height:1.5">
            <b>${item.user?.name || '-'}</b><br/>
            <span style="color:#2563eb">●</span> <strong>Check-out</strong> ${item.jam_keluar || '-'}<br/>
            <span style="font-size:11px;color:#666">${item.tanggal}</span><br/>
            <span style="font-size:11px;color:#666">${item.cabang?.nama_cabang || '-'}</span>
          </div>`
        const marker = L.marker([item.lat_pulang, item.long_pulang], { icon: blueIcon })
          .addTo(map)
          .bindPopup(popup)
        markersRef.current.push(marker)
        bounds.push([item.lat_pulang, item.long_pulang])
      }
    })

    // Fit bounds if markers exist
    if (bounds.length) {
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [data])

  if (loading) {
    return (
      <div
        className={`${height} w-full bg-slate-100 flex items-center justify-center rounded-lg`}
      >
        <div className="text-center text-slate-400">
          <div className="inline-block">
            <div className="w-8 h-8 border-4 border-slate-300 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
          <p className="text-xs mt-2">Memuat data lokasi...</p>
        </div>
      </div>
    )
  }

  const masukCount = data.filter((d) => d.lat_masuk).length
  const pulangCount = data.filter((d) => d.lat_pulang).length

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between text-xs">
        <div className="flex gap-2 flex-wrap">
          <div className="inline-flex items-center gap-1">
            <span className="inline-block w-3 h-3 bg-emerald-500 rounded-full"></span>
            <span className="text-slate-600">Check-in: <strong className="text-slate-800">{masukCount}</strong></span>
          </div>
          <div className="inline-flex items-center gap-1">
            <span className="inline-block w-3 h-3 bg-blue-500 rounded-full"></span>
            <span className="text-slate-600">Check-out: <strong className="text-slate-800">{pulangCount}</strong></span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {showLiveIndicator && (
            <span className="text-[10px] text-blue-600 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></span>
              Live {lastUpdate && `(${lastUpdate})`}
            </span>
          )}
          <button
            onClick={fetchLocationData}
            disabled={loading}
            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
      </div>

      <div
        ref={mapContainerRef}
        className={`${height} w-full rounded-lg border border-slate-200 overflow-hidden`}
      />

      {data.length === 0 && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-center text-xs text-blue-700">
          Belum ada data absensi untuk hari ini
        </div>
      )}
    </div>
  )
}
