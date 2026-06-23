import { useEffect, useState } from 'react'
import { getRegistrationStatus } from '../lib/authApi'

export function useRegistrationStatus() {
  const [enabled, setEnabled] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false

    getRegistrationStatus()
      .then(({ enabled: isEnabled }) => {
        if (!cancelled) setEnabled(isEnabled)
      })
      .catch(() => {
        if (!cancelled) setEnabled(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return enabled
}
