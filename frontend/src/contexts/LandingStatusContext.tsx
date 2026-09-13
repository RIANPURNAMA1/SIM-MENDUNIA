import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { siteApi } from '../services/api'

interface LandingStatus {
  landingEnabled: boolean
}

const LandingStatusContext = createContext<LandingStatus>({ landingEnabled: true })

export function LandingStatusProvider({ children }: { children: ReactNode }) {
  const [landingEnabled, setLandingEnabled] = useState(true)

  useEffect(() => {
    siteApi
      .getLandingStatus()
      .then((res) => setLandingEnabled(res.data.landing_enabled !== false))
      .catch(() => setLandingEnabled(true))
  }, [])

  return (
    <LandingStatusContext.Provider value={{ landingEnabled }}>
      {children}
    </LandingStatusContext.Provider>
  )
}

export function useLandingStatus() {
  return useContext(LandingStatusContext)
}