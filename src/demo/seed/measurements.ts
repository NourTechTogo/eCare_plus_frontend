import { createRandom, round } from '@/demo/random'
import { at } from '@/demo/time'
import type { Alert, AlertStatus } from '@/features/alerts/types/alert'
import { buildAlert } from '@/features/alerts/rules'
import type {
  Measurement,
  MeasurementSource,
  PatientThreshold,
} from '@/features/measurements/types/measurement'
import { defaultThresholds, type ThresholdSet } from '@/features/measurements/thresholds'
import type { Patient } from '@/features/patients/types/patient'

/*
 * Trente jours de mesures par patient. Les valeurs courantes restent dans la plage normale ;
 * les écarts sont placés explicitement, et chaque écart produit l'alerte correspondante.
 */

const HISTORY_DAYS = 30

/** `Omit` appliqué à chaque type de mesure de l'union, et non à leur partie commune. */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never

type MeasurementData = DistributiveOmit<Measurement, 'id' | 'patientId'>

interface Profile {
  /** Glycémie à jeun habituelle, en g/L. */
  fasting?: number
  postPrandial?: number
  /** Tension habituelle. */
  pressure?: [number, number]
  /** Une tension par jour, ou une par semaine pour un patient non hypertendu. */
  dailyPressure: boolean
  heartRate: number
  weight: number
  /** Mesures lues sur la montre connectée (fréquence cardiaque, SpO₂). */
  watch: boolean
}

const profiles: Record<string, Profile> = {
  'pat-adjovi': {
    fasting: 1.02,
    postPrandial: 1.32,
    pressure: [132, 84],
    dailyPressure: true,
    heartRate: 76,
    weight: 84,
    watch: true,
  },
  'pat-amegah': {
    fasting: 0.98,
    postPrandial: 1.28,
    pressure: [124, 78],
    dailyPressure: false,
    heartRate: 70,
    weight: 79,
    watch: true,
  },
  'pat-sossou': {
    fasting: 0.94,
    postPrandial: 1.26,
    dailyPressure: false,
    pressure: [116, 74],
    heartRate: 72,
    weight: 61,
    watch: false,
  },
  'pat-akakpo': {
    pressure: [134, 86],
    dailyPressure: true,
    heartRate: 80,
    weight: 88,
    watch: true,
  },
  'pat-gbeassor': {
    fasting: 1.04,
    postPrandial: 1.34,
    pressure: [130, 82],
    dailyPressure: true,
    heartRate: 74,
    weight: 72,
    watch: false,
  },
  'pat-kpodar': {
    pressure: [131, 83],
    dailyPressure: true,
    heartRate: 71,
    weight: 70,
    watch: true,
  },
  'pat-tete': { pressure: [136, 85], dailyPressure: true, heartRate: 68, weight: 81, watch: false },
  'pat-zinsou': {
    fasting: 0.96,
    postPrandial: 1.25,
    dailyPressure: false,
    pressure: [114, 72],
    heartRate: 73,
    weight: 66,
    watch: true,
  },
}

/** Écart placé dans les mesures d'un patient, et suite donnée à l'alerte qu'il déclenche. */
interface Anomaly {
  patientId: string
  offsetDays: number
  time: string
  measurement: MeasurementData
  status: AlertStatus
  /** Commentaire du médecin pour une alerte traitée. */
  comment?: string
}

const anomalies: Anomaly[] = [
  {
    patientId: 'pat-akakpo',
    offsetDays: 0,
    time: '07:05',
    measurement: {
      kind: 'tension',
      systolic: 184,
      diastolic: 112,
      source: 'manuelle',
      recordedAt: '',
    },
    status: 'nouvelle',
  },
  {
    patientId: 'pat-gbeassor',
    offsetDays: 0,
    time: '06:50',
    measurement: {
      kind: 'glycemie',
      context: 'a_jeun',
      value: 2.06,
      source: 'manuelle',
      recordedAt: '',
    },
    status: 'nouvelle',
  },
  {
    patientId: 'pat-adjovi',
    offsetDays: -1,
    time: '20:40',
    measurement: {
      kind: 'glycemie',
      context: 'post_prandiale',
      value: 2.12,
      source: 'manuelle',
      recordedAt: '',
      note: 'Repas de fête en famille',
    },
    status: 'vue',
  },
  {
    patientId: 'pat-adjovi',
    offsetDays: 0,
    time: '07:20',
    measurement: {
      kind: 'tension',
      systolic: 152,
      diastolic: 94,
      source: 'manuelle',
      recordedAt: '',
    },
    status: 'nouvelle',
  },
  {
    patientId: 'pat-gbeassor',
    offsetDays: -1,
    time: '18:30',
    measurement: { kind: 'frequence_cardiaque', value: 112, source: 'manuelle', recordedAt: '' },
    status: 'vue',
  },
  {
    patientId: 'pat-adjovi',
    offsetDays: -2,
    time: '06:10',
    measurement: { kind: 'frequence_cardiaque', value: 134, source: 'montre', recordedAt: '' },
    status: 'traitee',
    comment:
      'Patient joint par téléphone : mesure prise juste après une montée d’escaliers, contrôle à 76 bpm au repos. Pas de malaise.',
  },
  {
    patientId: 'pat-amegah',
    offsetDays: -5,
    time: '07:35',
    measurement: {
      kind: 'glycemie',
      context: 'a_jeun',
      value: 1.24,
      source: 'manuelle',
      recordedAt: '',
    },
    status: 'traitee',
    comment: 'Dîner tardif la veille. Rappel des conseils alimentaires par message ; à surveiller.',
  },
  {
    patientId: 'pat-sossou',
    offsetDays: -8,
    time: '11:15',
    measurement: {
      kind: 'glycemie',
      context: 'a_jeun',
      value: 0.62,
      source: 'manuelle',
      recordedAt: '',
      note: 'Sensation de malaise',
    },
    status: 'traitee',
    comment:
      'Hypoglycémie après un repas sauté. Resucrage fait par la patiente, contrôle à 1,02 g/L. Dose d’insuline du soir maintenue.',
  },
  {
    patientId: 'pat-kpodar',
    offsetDays: 0,
    time: '08:15',
    measurement: {
      kind: 'tension',
      systolic: 158,
      diastolic: 97,
      source: 'manuelle',
      recordedAt: '',
    },
    status: 'nouvelle',
  },
  {
    patientId: 'pat-tete',
    offsetDays: -3,
    time: '09:00',
    measurement: { kind: 'frequence_cardiaque', value: 112, source: 'manuelle', recordedAt: '' },
    status: 'traitee',
    comment: 'Mesure prise après la marche du matin ; valeur de repos normale le lendemain.',
  },
]

/** Seuils personnalisés par les médecins pour certains patients (EF-W2-11). */
export const thresholds: PatientThreshold[] = [
  {
    patientId: 'pat-akakpo',
    metric: 'systolique',
    rule: { normalMin: 90, normalMax: 135, criticalMin: 80, criticalMax: 175 },
    updatedAt: at(-20, '10:30'),
    updatedBy: 'Dr Kofi Agbeko',
  },
  {
    patientId: 'pat-sossou',
    metric: 'glycemie_a_jeun',
    rule: { normalMin: 0.8, normalMax: 1.2, criticalMin: 0.6, criticalMax: 2.2 },
    updatedAt: at(-40, '15:00'),
    updatedBy: 'Dr Kofi Agbeko',
  },
]

export function effectiveThresholds(
  patientId: string,
  overrides: PatientThreshold[],
): ThresholdSet {
  const set: ThresholdSet = { ...defaultThresholds }
  for (const override of overrides) {
    if (override.patientId === patientId) set[override.metric] = override.rule
  }
  return set
}

/** Garde une valeur générée dans la plage normale, pour que seuls les écarts placés déclenchent une alerte. */
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

function routineMeasurements(patientId: string, profile: Profile, seed: number) {
  const random = createRandom(seed)
  const data: MeasurementData[] = []
  const add = (
    offsetDays: number,
    time: string,
    measurement: DistributiveOmit<MeasurementData, 'recordedAt'>,
  ) => data.push({ ...measurement, recordedAt: at(offsetDays, time) } as MeasurementData)
  const source: MeasurementSource = profile.watch ? 'montre' : 'manuelle'
  // Seuils réels du patient, personnalisations comprises : une valeur courante n'en sort jamais.
  const limits = effectiveThresholds(patientId, thresholds)

  for (let offset = -HISTORY_DAYS + 1; offset <= 0; offset++) {
    // Le patient ne mesure pas tout, tous les jours : quelques jours sans données.
    const skipped = random.chance(0.08)
    if (skipped) continue

    if (profile.fasting !== undefined) {
      add(offset, `07:${String(5 + Math.floor(random.next() * 40)).padStart(2, '0')}`, {
        kind: 'glycemie',
        context: 'a_jeun',
        value: round(
          clamp(
            random.around(profile.fasting, 0.08),
            limits.glycemie_a_jeun.normalMin + 0.02,
            limits.glycemie_a_jeun.normalMax - 0.01,
          ),
          2,
        ),
        source: 'manuelle',
      })
      if (profile.postPrandial !== undefined && offset % 2 === 0) {
        add(offset, `20:${String(5 + Math.floor(random.next() * 40)).padStart(2, '0')}`, {
          kind: 'glycemie',
          context: 'post_prandiale',
          value: round(
            clamp(
              random.around(profile.postPrandial, 0.07),
              0.9,
              limits.glycemie_post_prandiale.normalMax - 0.01,
            ),
            2,
          ),
          source: 'manuelle',
        })
      }
    }

    if (profile.pressure && (profile.dailyPressure || offset % 7 === 0)) {
      add(offset, `08:${String(Math.floor(random.next() * 45)).padStart(2, '0')}`, {
        kind: 'tension',
        systolic: Math.round(
          clamp(random.around(profile.pressure[0], 5), 100, limits.systolique.normalMax - 1),
        ),
        diastolic: Math.round(
          clamp(random.around(profile.pressure[1], 4), 62, limits.diastolique.normalMax - 1),
        ),
        source: 'manuelle',
      })
    }

    add(offset, profile.watch ? '06:30' : '08:50', {
      kind: 'frequence_cardiaque',
      value: Math.round(
        clamp(random.around(profile.heartRate, 6), 55, limits.frequence_cardiaque.normalMax - 4),
      ),
      source,
    })

    if (offset % 7 === 0) {
      add(offset, '07:00', {
        kind: 'poids',
        value: round(random.around(profile.weight, 0.5), 1),
        source: 'manuelle',
      })
    }
  }
  return data
}

export function buildMeasurementsAndAlerts(patients: Patient[]) {
  const measurements: Measurement[] = []
  const alerts: Alert[] = []
  let counter = 0
  let alertNumber = 400
  const nextId = () => `mes-${String(++counter).padStart(5, '0')}`

  patients.forEach((patient, index) => {
    const profile = profiles[patient.id]
    if (!profile) return
    for (const data of routineMeasurements(patient.id, profile, 1000 + index)) {
      measurements.push({ ...data, id: nextId(), patientId: patient.id } as Measurement)
    }
  })

  for (const anomaly of anomalies) {
    const patient = patients.find((candidate) => candidate.id === anomaly.patientId)
    if (!patient) continue
    const measurement = {
      ...anomaly.measurement,
      id: nextId(),
      patientId: patient.id,
      recordedAt: at(anomaly.offsetDays, anomaly.time),
    } as Measurement
    measurements.push(measurement)

    const alert = buildAlert(
      measurement,
      patient,
      effectiveThresholds(patient.id, thresholds),
      `ALT-${++alertNumber}`,
    )
    if (!alert) continue
    const triggeredAt = new Date(measurement.recordedAt).getTime()
    alerts.push({
      ...alert,
      status: anomaly.status,
      seenAt:
        anomaly.status === 'nouvelle'
          ? undefined
          : new Date(triggeredAt + 40 * 60_000).toISOString(),
      handledAt:
        anomaly.status === 'traitee'
          ? new Date(triggeredAt + 3 * 3600_000).toISOString()
          : undefined,
      handledBy: anomaly.status === 'traitee' ? doctorNameFor(patient.referentDoctorId) : undefined,
      handledComment: anomaly.comment,
    })
  }

  measurements.sort((a, b) => a.recordedAt.localeCompare(b.recordedAt))
  return { measurements, alerts }
}

const doctorNames: Record<string, string> = {
  'med-agbeko': 'Dr Kofi Agbeko',
  'med-lawson': 'Dr Akossiwa Lawson',
  'med-amouzou': 'Dr Yao Amouzou',
}

const doctorNameFor = (doctorId: string) => doctorNames[doctorId] ?? 'Médecin référent'
