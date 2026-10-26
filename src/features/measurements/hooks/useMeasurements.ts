import { useEffect, useState } from 'react'
import { listMeasurements } from '@/features/measurements/services/measurementService'
import type { Measurement } from '@/features/measurements/types/measurement'

type MeasurementsState =
  { status: 'loading' } | { status: 'error' } | { status: 'success'; measurements: Measurement[] }

export function useMeasurements(patientId: string): MeasurementsState {
  const [loaded, setLoaded] = useState<{ patientId: string; state: MeasurementsState } | null>(null)

  useEffect(() => {
    let active = true
    listMeasurements(patientId)
      .then((measurements) => {
        if (active) setLoaded({ patientId, state: { status: 'success', measurements } })
      })
      .catch(() => {
        if (active) setLoaded({ patientId, state: { status: 'error' } })
      })
    return () => {
      active = false
    }
  }, [patientId])

  // Tant que le résultat chargé ne correspond pas au patient demandé, on est en chargement.
  return loaded?.patientId === patientId ? loaded.state : { status: 'loading' }
}
