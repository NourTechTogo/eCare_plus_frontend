import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { TextField } from '@/components/ui/TextField'
import type { User } from '@/features/auth'
import { updateProfile, type ProfileChanges } from '@/features/profile/services/profileService'
import { useFeedback } from '@/hooks/useFeedback'

type Field = keyof ProfileChanges
type Errors = Partial<Record<Field, string>>

const fieldOrder: Field[] = ['firstName', 'lastName', 'phone']
const fieldId = (field: Field) => `profil-${field}`

/** Prénoms et nom ; une session ancienne n'a que le nom complet, coupé avant le dernier mot. */
function nameParts(user: User) {
  if (user.firstName !== undefined && user.lastName !== undefined) {
    return { firstName: user.firstName, lastName: user.lastName }
  }
  const words = user.name.trim().split(/\s+/)
  return { firstName: words.slice(0, -1).join(' '), lastName: words.at(-1) ?? '' }
}

function validate(values: ProfileChanges): Errors {
  const errors: Errors = {}
  if (!values.firstName.trim()) errors.firstName = 'Saisissez vos prénoms.'
  if (!values.lastName.trim()) errors.lastName = 'Saisissez votre nom.'
  const phone = values.phone.trim()
  if (phone && (!/^\+?[\d\s.-]+$/.test(phone) || phone.replace(/\D/g, '').length < 8)) {
    errors.phone = 'Saisissez un numéro valide, par exemple +228 90 00 00 00.'
  }
  return errors
}

interface PersonalInfoFormProps {
  user: User
  onSaved: (user: User) => void
}

/** Prénoms, nom et téléphone du professionnel ; l'adresse e-mail sert d'identifiant. */
export function PersonalInfoForm({ user, onSaved }: PersonalInfoFormProps) {
  const initial: ProfileChanges = { ...nameParts(user), phone: user.phone ?? '' }
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState<Errors>({})
  const [saving, setSaving] = useState(false)
  const feedback = useFeedback()

  const changed = fieldOrder.some((field) => values[field].trim() !== initial[field].trim())

  const bind = (field: Field) => ({
    id: fieldId(field),
    value: values[field],
    error: errors[field],
    onChange: (event: { target: { value: string } }) => {
      const { value } = event.target
      setValues((current) => ({ ...current, [field]: value }))
      if (errors[field]) setErrors(({ [field]: _fixed, ...rest }) => rest)
    },
  })

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validate(values)
    setErrors(nextErrors)
    const firstInvalid = fieldOrder.find((field) => nextErrors[field])
    if (firstInvalid) {
      document.getElementById(fieldId(firstInvalid))?.focus()
      return
    }
    setSaving(true)
    try {
      onSaved(await updateProfile(user, values))
      feedback.success('Profil mis à jour', 'Vos informations sont enregistrées.')
    } catch (error) {
      feedback.error(
        "Le profil n'a pas pu être mis à jour",
        error instanceof Error ? error.message : 'Vos modifications sont conservées. Réessayez.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card title="Informations personnelles">
      <form
        noValidate
        onSubmit={(event) => void handleSubmit(event)}
        className="flex flex-col gap-5"
      >
        <fieldset disabled={saving} className="grid min-w-0 gap-5 sm:grid-cols-2">
          <TextField label="Prénoms" autoComplete="given-name" required {...bind('firstName')} />
          <TextField label="Nom" autoComplete="family-name" required {...bind('lastName')} />
          <TextField
            label="Téléphone"
            type="tel"
            autoComplete="tel"
            placeholder="+228 90 00 00 00"
            {...bind('phone')}
          />
          <TextField
            label="Adresse e-mail"
            type="email"
            value={user.email ?? ''}
            readOnly
            disabled
            showRequirement={false}
            hint="Elle sert à vous connecter. Pour la changer, contactez l'administrateur de votre structure."
          />
        </fieldset>
        <div className="flex flex-wrap justify-end gap-3">
          {changed && (
            <Button
              variant="secondary"
              disabled={saving}
              onClick={() => {
                setValues(initial)
                setErrors({})
              }}
            >
              Annuler
            </Button>
          )}
          <Button type="submit" loading={saving} disabled={!changed}>
            Enregistrer
          </Button>
        </div>
      </form>
    </Card>
  )
}
