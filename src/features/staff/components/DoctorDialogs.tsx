import { useState, type FormEvent } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { TextField } from '@/components/ui/TextField'
import { emptyAccountPassword, validateAccountPassword } from '@/features/staff/accountPassword'
import { AccountPasswordFields } from '@/features/staff/components/AccountPasswordFields'
import {
  createDoctor,
  DuplicateEmailError,
  updateDoctor,
  setDoctorStatus,
} from '@/features/staff/services/staffService'
import type { Doctor, DoctorInput } from '@/features/staff/types/doctor'
import { useFeedback } from '@/hooks/useFeedback'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const specialtySuggestions = [
  'Diabétologie et endocrinologie',
  'Cardiologie',
  'Médecine générale',
  'Médecine interne',
  'Néphrologie',
]

type Field = keyof DoctorInput

function validate(values: Record<Field, string>) {
  const errors: Partial<Record<Field, string>> = {}
  if (!values.lastName.trim()) errors.lastName = 'Saisissez le nom.'
  if (!values.firstName.trim()) errors.firstName = 'Saisissez le ou les prénoms.'
  if (!EMAIL_PATTERN.test(values.email.trim()))
    errors.email = 'Saisissez une adresse e-mail valide.'
  if (values.phone && values.phone.replace(/\D/g, '').length < 8)
    errors.phone = 'Saisissez un numéro valide.'
  if (!values.specialty.trim()) errors.specialty = 'Indiquez la spécialité.'
  return errors
}

/** Création d'un compte, ou modification de ses informations quand `doctor` est fourni. */
export function DoctorFormDialog({
  doctor,
  onClose,
  onSaved,
}: {
  doctor?: Doctor
  onClose: () => void
  onSaved: (doctor: Doctor) => void
}) {
  const editing = doctor !== undefined
  const [values, setValues] = useState<Record<Field, string>>(
    doctor
      ? {
          lastName: doctor.lastName,
          firstName: doctor.firstName,
          email: doctor.email,
          phone: doctor.phone ?? '',
          specialty: doctor.specialty,
        }
      : {
          lastName: '',
          firstName: '',
          email: '',
          phone: '',
          specialty: '',
        },
  )
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({})
  const [saving, setSaving] = useState(false)
  const [password, setPassword] = useState(emptyAccountPassword)
  const [passwordErrors, setPasswordErrors] = useState<ReturnType<typeof validateAccountPassword>>(
    {},
  )
  const feedback = useFeedback()

  const bind = (field: Field) => ({
    value: values[field],
    error: errors[field],
    onChange: (event: { target: { value: string } }) => {
      setValues((current) => ({ ...current, [field]: event.target.value }))
      if (errors[field]) setErrors(({ [field]: _fixed, ...rest }) => rest)
    },
  })

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validate(values)
    // Le mot de passe n'est saisi qu'à la création ; l'utilisateur le change ensuite lui-même.
    const nextPasswordErrors = editing ? {} : validateAccountPassword(password)
    setErrors(nextErrors)
    setPasswordErrors(nextPasswordErrors)
    if (Object.keys(nextErrors).length + Object.keys(nextPasswordErrors).length > 0) return
    setSaving(true)
    try {
      if (doctor) {
        const account = await updateDoctor(doctor.id, values)
        onSaved(account)
        feedback.success('Compte mis à jour')
        onClose()
        return
      }
      const account = await createDoctor(values, password.password)
      onSaved(account)
      feedback.success(
        'Compte créé',
        `Dr ${account.firstName} ${account.lastName} peut se connecter avec ${account.email} et le mot de passe choisi.`,
      )
      onClose()
    } catch (error) {
      if (error instanceof DuplicateEmailError)
        setErrors({ email: 'Un compte utilise déjà cette adresse e-mail.' })
      else
        feedback.error(
          editing ? "Le compte n'a pas pu être modifié" : "Le compte n'a pas pu être créé",
          'Vos informations sont conservées. Réessayez.',
        )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      title={editing ? 'Modifier le compte du médecin' : 'Ajouter un médecin'}
      size="lg"
      onClose={onClose}
    >
      <form
        noValidate
        onSubmit={(event) => void handleSubmit(event)}
        className="flex flex-col gap-5"
      >
        <fieldset disabled={saving} className="grid min-w-0 gap-4 sm:grid-cols-2">
          <TextField label="Nom" required autoComplete="off" {...bind('lastName')} />
          <TextField label="Prénom(s)" required autoComplete="off" {...bind('firstName')} />
          <TextField
            label="Adresse e-mail"
            type="email"
            required
            autoComplete="off"
            hint="Elle sert d'identifiant de connexion."
            {...bind('email')}
          />
          <TextField
            label="Téléphone"
            type="tel"
            autoComplete="off"
            showRequirement={false}
            {...bind('phone')}
          />
          <TextField
            label="Spécialité"
            required
            list="specialites"
            autoComplete="off"
            {...bind('specialty')}
          />
          <datalist id="specialites">
            {specialtySuggestions.map((specialty) => (
              <option key={specialty} value={specialty} />
            ))}
          </datalist>
          {!editing && (
            <AccountPasswordFields
              value={password}
              errors={passwordErrors}
              onChange={(next) => {
                setPassword(next)
                setPasswordErrors({})
              }}
            />
          )}
        </fieldset>
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="secondary" disabled={saving} onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" loading={saving}>
            {editing ? 'Enregistrer' : 'Créer le compte'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

export function StatusDialog({
  doctor,
  onClose,
  onChanged,
}: {
  doctor: Doctor
  onClose: () => void
  onChanged: (doctor: Doctor) => void
}) {
  const [saving, setSaving] = useState(false)
  const feedback = useFeedback()
  const deactivating = doctor.status === 'actif'

  const confirm = async () => {
    setSaving(true)
    try {
      onChanged(await setDoctorStatus(doctor.id, deactivating ? 'desactive' : 'actif'))
      feedback.success(deactivating ? 'Compte désactivé' : 'Compte réactivé')
    } catch {
      feedback.error(
        "Le compte n'a pas pu être modifié",
        'Vérifiez votre connexion puis réessayez.',
      )
      setSaving(false)
    }
  }

  return (
    <Dialog
      title={deactivating ? 'Désactiver le compte ?' : 'Réactiver le compte ?'}
      description={`Dr ${doctor.firstName} ${doctor.lastName}, ${doctor.specialty}`}
      onClose={onClose}
    >
      <div className="flex flex-col gap-5">
        <p className="text-sm text-ink">
          {deactivating
            ? 'Le médecin ne pourra plus se connecter. Son historique (notes, alertes traitées) est conservé.'
            : 'Le médecin pourra de nouveau se connecter avec son mot de passe habituel.'}
        </p>
        {deactivating && doctor.patientCount > 0 && (
          <Alert
            variant="error"
            title={`${doctor.patientCount} patient${doctor.patientCount > 1 ? 's sont rattachés' : ' est rattaché'} à ce médecin.`}
          >
            Demandez au personnel de l'établissement de les affecter à un autre médecin référent,
            pour assurer la continuité du suivi.
          </Alert>
        )}
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="secondary" disabled={saving} onClick={onClose}>
            Annuler
          </Button>
          <Button loading={saving} onClick={() => void confirm()}>
            {deactivating ? 'Désactiver' : 'Réactiver'}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
