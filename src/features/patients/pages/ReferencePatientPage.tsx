import { useCallback, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { Page } from '@/components/layouts/Page'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { SelectField } from '@/components/ui/SelectField'
import { buttonClassName } from '@/components/ui/styles'
import { TextField } from '@/components/ui/TextField'
import type { ReferentOption } from '@/features/patients/components/PatientForm'
import { QrScanner } from '@/features/patients/components/QrScanner'
import { canScanQrCodes } from '@/features/patients/qrSupport'
import { conditionLabels, sexLabels } from '@/features/patients/labels'
import {
  findRegistration,
  InvalidRegistrationCodeError,
  referenceRegistration,
} from '@/features/patients/services/patientService'
import type { Condition, Patient, PendingRegistration } from '@/features/patients/types/patient'
import { useFeedback } from '@/hooks/useFeedback'
import { formatDate } from '@/utils/formatDate'
import { formatDateTime } from '@/utils/formatDateTime'
import { getAge } from '@/utils/getAge'

const backLink = { to: '/patients', label: 'Retour à la liste des patients' }
const conditionOptions = Object.entries(conditionLabels).map(([value, label]) => ({ value, label }))

function CodeStep({ onFound }: { onFound: (registration: PendingRegistration) => void }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string>()
  const [searching, setSearching] = useState(false)
  const [scanning, setScanning] = useState(canScanQrCodes())

  const lookUp = useCallback(
    async (value: string) => {
      setSearching(true)
      setError(undefined)
      try {
        onFound(await findRegistration(value))
      } catch (caught) {
        setError(
          caught instanceof InvalidRegistrationCodeError
            ? 'Ce code est inconnu, déjà utilisé ou expiré. Demandez au patient d’afficher un nouveau code dans l’application.'
            : 'La recherche n’a pas pu aboutir. Vérifiez votre connexion puis réessayez.',
        )
        setScanning(false)
      } finally {
        setSearching(false)
      }
    },
    [onFound],
  )

  const handleDetected = useCallback(
    (value: string) => {
      setCode(value)
      void lookUp(value)
    },
    [lookUp],
  )
  const handleUnavailable = useCallback(() => setScanning(false), [])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!code.trim()) return setError('Saisissez le code affiché sous le QR code du patient.')
    void lookUp(code)
  }

  return (
    <Card title="Code QR du patient">
      <div className="flex flex-col gap-6">
        <p className="text-sm text-muted">
          Après son inscription dans l'application, le patient affiche un code QR personnel, valable
          48 heures. Scannez-le, ou saisissez le code écrit en dessous.
        </p>
        {scanning && <QrScanner onDetected={handleDetected} onUnavailable={handleUnavailable} />}
        <form
          noValidate
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 sm:flex-row sm:items-start"
        >
          <div className="flex-1">
            <TextField
              label="Code du patient"
              placeholder="ECP-QR-XXXXXX"
              autoComplete="off"
              autoCapitalize="characters"
              value={code}
              error={error}
              disabled={searching}
              showRequirement={false}
              onChange={(event) => {
                setCode(event.target.value.toUpperCase())
                setError(undefined)
              }}
            />
          </div>
          <div className="sm:pt-7">
            <Button type="submit" loading={searching}>
              Rechercher
            </Button>
          </div>
        </form>
      </div>
    </Card>
  )
}

interface DetailsStepProps {
  registration: PendingRegistration
  doctors: ReferentOption[]
  onDone: (patient: Patient) => void
  onRestart: () => void
}

function DetailsStep({ registration, doctors, onDone, onRestart }: DetailsStepProps) {
  const [condition, setCondition] = useState('')
  const [doctorId, setDoctorId] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const feedback = useFeedback()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors: Record<string, string> = {}
    if (!condition) nextErrors.condition = 'Sélectionnez la pathologie suivie.'
    if (!doctorId) nextErrors.doctor = 'Choisissez le médecin référent.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    setSubmitting(true)
    try {
      onDone(
        await referenceRegistration(registration.code, {
          condition: condition as Condition,
          referentDoctorId: doctorId,
        }),
      )
    } catch (caught) {
      feedback.error(
        caught instanceof InvalidRegistrationCodeError
          ? 'Ce code n’est plus valable'
          : 'Le référencement n’a pas abouti',
        caught instanceof InvalidRegistrationCodeError
          ? 'Demandez au patient d’afficher un nouveau code.'
          : 'Vérifiez votre connexion puis réessayez.',
      )
      setSubmitting(false)
    }
  }

  const born = registration.sex === 'F' ? 'Née' : 'Né'

  return (
    <div className="grid items-start gap-6 xl:grid-cols-2">
      <Card title="Compte du patient">
        <div className="flex flex-col gap-3">
          <p className="font-display text-xl font-bold text-ink">
            {registration.firstName} {registration.lastName}
          </p>
          <p className="text-sm text-ink">
            {sexLabels[registration.sex]} · {born} le {formatDate(registration.birthDate)} (
            {getAge(registration.birthDate)} ans)
          </p>
          <p className="text-sm text-ink">{registration.phone}</p>
          {registration.email && <p className="text-sm text-ink">{registration.email}</p>}
          <p className="text-xs text-muted">
            Inscrit dans l'application le {formatDateTime(registration.registeredAt)} · conditions
            d'utilisation acceptées
          </p>
          <p className="text-xs text-muted">
            Vérifiez l'identité du patient avant de rattacher son compte.
          </p>
          <div>
            <Button variant="secondary" size="sm" onClick={onRestart} disabled={submitting}>
              Ce n'est pas le bon patient
            </Button>
          </div>
        </div>
      </Card>

      <Card title="Rattachement au suivi">
        <form
          noValidate
          onSubmit={(event) => void handleSubmit(event)}
          className="flex flex-col gap-5"
        >
          <fieldset disabled={submitting} className="flex min-w-0 flex-col gap-5">
            <SelectField
              label="Pathologie suivie"
              required
              placeholder="Sélectionner"
              options={conditionOptions}
              value={condition}
              error={errors.condition}
              onChange={(event) => setCondition(event.target.value)}
            />
            <SelectField
              label="Médecin référent"
              required
              placeholder="Choisir un médecin"
              hint="Choisissez selon la pathologie du patient."
              options={doctors.map((doctor) => ({
                value: doctor.id,
                label: `${doctor.name}, ${doctor.specialty}`,
              }))}
              value={doctorId}
              error={errors.doctor}
              onChange={(event) => setDoctorId(event.target.value)}
            />
          </fieldset>
          <Button type="submit" loading={submitting}>
            Référencer le patient
          </Button>
        </form>
      </Card>
    </div>
  )
}

/** Référencement d'un patient inscrit seul dans l'application, par son code QR (EF-W1-13). */
export function ReferencePatientPage({ doctors }: { doctors: ReferentOption[] }) {
  const [registration, setRegistration] = useState<PendingRegistration>()
  const [referenced, setReferenced] = useState<Patient>()

  return (
    <Page
      title="Référencer un patient"
      description="Rattacher à l'établissement un compte créé dans l'application mobile"
      backLink={backLink}
    >
      <div className="flex w-full max-w-5xl flex-col gap-6">
        {referenced ? (
          <>
            <Alert
              variant="success"
              title={`${referenced.firstName} ${referenced.lastName} est référencé : dossier n° ${referenced.fileNumber}.`}
            >
              Son médecin référent le retrouve dès maintenant dans sa liste, et le patient peut lui
              écrire depuis l'application.
            </Alert>
            <div className="flex flex-wrap gap-3">
              <Link to={`/patients/${referenced.id}`} className={buttonClassName('primary')}>
                Voir le dossier
              </Link>
              <Button
                variant="secondary"
                onClick={() => {
                  setReferenced(undefined)
                  setRegistration(undefined)
                }}
              >
                Référencer un autre patient
              </Button>
            </div>
          </>
        ) : registration ? (
          <DetailsStep
            registration={registration}
            doctors={doctors}
            onDone={setReferenced}
            onRestart={() => setRegistration(undefined)}
          />
        ) : (
          <CodeStep onFound={setRegistration} />
        )}
      </div>
    </Page>
  )
}
