import carnetUrl from '@/assets/documents/carnet-suivi.svg'
import compteRenduUrl from '@/assets/documents/compte-rendu-consultation.pdf?url'
import ordonnanceUrl from '@/assets/documents/ordonnance.svg'
import resultatUrl from '@/assets/documents/resultat-analyse.svg'
import { createRandom } from '@/demo/random'
import { MAIN_DOCTOR_ID } from '@/demo/seed/people'
import { at, day } from '@/demo/time'
import type { PatientDocument } from '@/features/documents/types/document'
import type { ClinicalNote } from '@/features/notes/types/note'
import type { Intake, IntakeStatus, Treatment } from '@/features/treatments/types/treatment'

/** Historique des prises généré pour chaque traitement en cours. */
const INTAKE_HISTORY_DAYS = 14

type TreatmentSeed = Omit<Treatment, 'createdAt' | 'updatedAt' | 'status'> & {
  status?: Treatment['status']
  /** Part des prises confirmées par le patient, pour un taux d'observance réaliste. */
  adherence: number
}

const treatmentSeeds: TreatmentSeed[] = [
  {
    id: 'trt-adjovi-metformine',
    patientId: 'pat-adjovi',
    drugName: 'Metformine',
    dosage: '850 mg',
    form: 'comprime',
    times: ['08:00', '20:00'],
    startDate: day(-120),
    instructions: 'Au cours des repas.',
    prescribedBy: 'Dr Kofi Agbeko',
    adherence: 0.86,
  },
  {
    id: 'trt-adjovi-amlodipine',
    patientId: 'pat-adjovi',
    drugName: 'Amlodipine',
    dosage: '5 mg',
    form: 'comprime',
    times: ['08:00'],
    startDate: day(-50),
    prescribedBy: 'Dr Kofi Agbeko',
    adherence: 0.92,
  },
  {
    id: 'trt-adjovi-glibenclamide',
    patientId: 'pat-adjovi',
    drugName: 'Glibenclamide',
    dosage: '5 mg',
    form: 'comprime',
    times: ['08:00'],
    startDate: day(-200),
    endDate: day(-121),
    instructions: 'Remplacé par la metformine.',
    prescribedBy: 'Dr Kofi Agbeko',
    status: 'termine',
    adherence: 0,
  },
  {
    id: 'trt-amegah-metformine',
    patientId: 'pat-amegah',
    drugName: 'Metformine',
    dosage: '1 000 mg',
    form: 'comprime',
    times: ['08:00', '20:00'],
    startDate: day(-96),
    instructions: 'Au cours des repas.',
    prescribedBy: 'Dr Kofi Agbeko',
    adherence: 0.95,
  },
  {
    id: 'trt-sossou-insuline',
    patientId: 'pat-sossou',
    drugName: 'Insuline glargine',
    dosage: '14 unités',
    form: 'injection',
    times: ['21:00'],
    startDate: day(-80),
    instructions: 'Injection sous-cutanée, à heure fixe le soir.',
    prescribedBy: 'Dr Kofi Agbeko',
    adherence: 0.97,
  },
  {
    id: 'trt-sossou-rapide',
    patientId: 'pat-sossou',
    drugName: 'Insuline rapide',
    dosage: '4 à 6 unités',
    form: 'injection',
    times: ['07:30', '12:30', '19:30'],
    startDate: day(-80),
    instructions: 'Avant chaque repas, selon la glycémie mesurée.',
    prescribedBy: 'Dr Kofi Agbeko',
    adherence: 0.84,
  },
  {
    id: 'trt-akakpo-amlodipine',
    patientId: 'pat-akakpo',
    drugName: 'Amlodipine',
    dosage: '10 mg',
    form: 'comprime',
    times: ['08:00'],
    startDate: day(-64),
    prescribedBy: 'Dr Kofi Agbeko',
    adherence: 0.71,
  },
  {
    id: 'trt-akakpo-hctz',
    patientId: 'pat-akakpo',
    drugName: 'Hydrochlorothiazide',
    dosage: '12,5 mg',
    form: 'comprime',
    times: ['08:00'],
    startDate: day(-40),
    prescribedBy: 'Dr Kofi Agbeko',
    adherence: 0.68,
  },
  {
    id: 'trt-gbeassor-metformine',
    patientId: 'pat-gbeassor',
    drugName: 'Metformine',
    dosage: '500 mg',
    form: 'comprime',
    times: ['08:00', '20:00'],
    startDate: day(-45),
    prescribedBy: 'Dr Kofi Agbeko',
    adherence: 0.8,
  },
  {
    id: 'trt-gbeassor-losartan',
    patientId: 'pat-gbeassor',
    drugName: 'Losartan',
    dosage: '50 mg',
    form: 'comprime',
    times: ['08:00'],
    startDate: day(-45),
    prescribedBy: 'Dr Kofi Agbeko',
    adherence: 0.88,
  },
  {
    id: 'trt-kpodar-perindopril',
    patientId: 'pat-kpodar',
    drugName: 'Périndopril',
    dosage: '5 mg',
    form: 'comprime',
    times: ['08:00'],
    startDate: day(-110),
    prescribedBy: 'Dr Akossiwa Lawson',
    adherence: 0.9,
  },
  {
    id: 'trt-tete-amlodipine',
    patientId: 'pat-tete',
    drugName: 'Amlodipine',
    dosage: '5 mg',
    form: 'comprime',
    times: ['08:00'],
    startDate: day(-70),
    prescribedBy: 'Dr Akossiwa Lawson',
    adherence: 0.93,
  },
  {
    id: 'trt-zinsou-metformine',
    patientId: 'pat-zinsou',
    drugName: 'Metformine',
    dosage: '500 mg',
    form: 'comprime',
    times: ['20:00'],
    startDate: day(-30),
    prescribedBy: 'Dr Yao Amouzou',
    adherence: 0.9,
  },
]

export const treatments: Treatment[] = treatmentSeeds.map(
  ({ adherence: _adherence, status, ...seed }) => ({
    ...seed,
    status: status ?? 'en_cours',
    createdAt: `${seed.startDate}T09:00:00.000Z`,
    updatedAt: `${seed.startDate}T09:00:00.000Z`,
  }),
)

/** Réponses aux rappels des deux dernières semaines ; les prises à venir ne figurent pas. */
export function buildIntakes(): Intake[] {
  const random = createRandom(77)
  const now = Date.now()
  const intakes: Intake[] = []
  for (const seed of treatmentSeeds) {
    if (seed.status === 'termine') continue
    for (let offset = -INTAKE_HISTORY_DAYS + 1; offset <= 0; offset++) {
      for (const time of seed.times) {
        const scheduledAt = at(offset, time)
        if (new Date(scheduledAt).getTime() > now) continue
        const roll = random.next()
        const missed = 1 - seed.adherence
        const status: IntakeStatus =
          roll < seed.adherence
            ? 'pris'
            : roll < seed.adherence + missed * 0.5
              ? 'non_confirme'
              : roll < seed.adherence + missed * 0.8
                ? 'ignore'
                : 'reporte'
        const delayMinutes = 2 + Math.floor(random.next() * 40)
        intakes.push({
          id: `prs-${intakes.length + 1}`,
          treatmentId: seed.id,
          patientId: seed.patientId,
          scheduledAt,
          status,
          answeredAt:
            status === 'non_confirme'
              ? undefined
              : new Date(new Date(scheduledAt).getTime() + delayMinutes * 60_000).toISOString(),
        })
      }
    }
  }
  return intakes
}

export const documents: PatientDocument[] = [
  {
    id: 'doc-adjovi-ordonnance',
    patientId: 'pat-adjovi',
    type: 'ordonnance',
    title: 'Ordonnance de suivi trimestriel',
    documentDate: day(-72),
    url: ordonnanceUrl,
    mimeType: 'image/svg+xml',
    sizeBytes: 412_000,
    origin: 'numerisation',
    uploadedAt: at(-120, '10:20'),
  },
  {
    id: 'doc-adjovi-analyse',
    patientId: 'pat-adjovi',
    type: 'resultat_analyse',
    title: 'Bilan sanguin : glycémie et HbA1c',
    documentDate: day(-25),
    url: resultatUrl,
    mimeType: 'image/svg+xml',
    sizeBytes: 538_000,
    origin: 'ajout',
    uploadedAt: at(-25, '12:40'),
  },
  {
    id: 'doc-adjovi-compte-rendu',
    patientId: 'pat-adjovi',
    type: 'compte_rendu',
    title: 'Compte rendu de consultation',
    documentDate: day(-51),
    url: compteRenduUrl,
    mimeType: 'application/pdf',
    sizeBytes: 1_807,
    origin: 'ajout',
    uploadedAt: at(-51, '17:05'),
  },
  {
    id: 'doc-akakpo-carnet',
    patientId: 'pat-akakpo',
    type: 'carnet_suivi',
    title: 'Carnet de tension (juin)',
    documentDate: day(-130),
    url: carnetUrl,
    mimeType: 'image/svg+xml',
    sizeBytes: 356_000,
    origin: 'numerisation',
    uploadedAt: at(-64, '09:30'),
  },
  {
    id: 'doc-gbeassor-ordonnance',
    patientId: 'pat-gbeassor',
    type: 'ordonnance',
    title: 'Ordonnance initiale',
    documentDate: day(-45),
    url: ordonnanceUrl,
    mimeType: 'image/svg+xml',
    sizeBytes: 398_000,
    origin: 'numerisation',
    uploadedAt: at(-45, '16:00'),
  },
  {
    id: 'doc-sossou-analyse',
    patientId: 'pat-sossou',
    type: 'resultat_analyse',
    title: 'Hémoglobine glyquée',
    documentDate: day(-14),
    url: resultatUrl,
    mimeType: 'image/svg+xml',
    sizeBytes: 501_000,
    origin: 'ajout',
    uploadedAt: at(-14, '09:10'),
  },
]

export const notes: ClinicalNote[] = [
  {
    id: 'note-1',
    patientId: 'pat-adjovi',
    authorId: MAIN_DOCTOR_ID,
    author: 'Dr Kofi Agbeko',
    authorRole: 'medecin',
    visibility: 'partagee',
    createdAt: at(-6, '18:45'),
    text: 'Glycémies du soir un peu plus hautes cette semaine. Merci de noter vos repas du soir pendant quelques jours.',
  },
  {
    id: 'note-2',
    patientId: 'pat-adjovi',
    authorId: MAIN_DOCTOR_ID,
    author: 'Dr Kofi Agbeko',
    authorRole: 'medecin',
    visibility: 'privee',
    createdAt: at(-6, '18:50'),
    text: 'Envisager une adaptation du traitement au prochain bilan si l’HbA1c reste au-dessus de 7 %.',
  },
  {
    id: 'note-3',
    patientId: 'pat-adjovi',
    authorId: 'pat-adjovi',
    author: 'Kodjo Adjovi',
    authorRole: 'patient',
    visibility: 'partagee',
    createdAt: at(-1, '21:05'),
    text: 'Repas de fête hier soir chez ma fille, j’ai mangé plus que d’habitude.',
  },
  {
    id: 'note-4',
    patientId: 'pat-akakpo',
    authorId: MAIN_DOCTOR_ID,
    author: 'Dr Kofi Agbeko',
    authorRole: 'medecin',
    visibility: 'privee',
    createdAt: at(-20, '10:35'),
    text: 'Seuil systolique abaissé à 135 mmHg en raison de l’antécédent familial d’AVC.',
  },
  {
    id: 'note-5',
    patientId: 'pat-sossou',
    authorId: MAIN_DOCTOR_ID,
    author: 'Dr Kofi Agbeko',
    authorRole: 'medecin',
    visibility: 'partagee',
    createdAt: at(-8, '13:00'),
    text: 'Pensez à toujours avoir du sucre sur vous et à ne pas sauter de repas après l’injection.',
  },
]
