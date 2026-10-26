import { useState, type FormEvent } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { TextField } from '@/components/ui/TextField'
import { roleLabels, type User } from '@/features/auth'
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
      feedback.success('Profil mis à jour', 'Vos informations ont été enregistrées avec succès.')
    } catch {
      feedback.error(
        "Le profil n'a pas pu être mis à jour",
        'Vos modifications sont conservées. Vérifiez votre connexion puis réessayez.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card
      title="Informations personnelles"
      subtitle="Coordonnées visibles par vos collègues et utilisées pour les communications"
    >
      <form
        noValidate
        onSubmit={(event) => void handleSubmit(event)}
        className="flex flex-col gap-6"
      >
        {changed && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-warning-line bg-warning-soft px-4 py-3 text-xs font-medium text-warning">
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-warning" />
              Vous avez des modifications non enregistrées.
            </span>
            <button
              type="button"
              onClick={() => {
                setValues(initial)
                setErrors({})
              }}
              className="font-semibold underline hover:text-ink"
            >
              Rétablir
            </button>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <h3 className="text-xs font-semibold tracking-wider text-muted uppercase">
            Identité et coordonnées
          </h3>
          <fieldset disabled={saving} className="grid min-w-0 gap-5 sm:grid-cols-2">
            <TextField label="Prénoms" autoComplete="given-name" required {...bind('firstName')} />
            <TextField label="Nom" autoComplete="family-name" required {...bind('lastName')} />
            <div className="sm:col-span-2">
              <TextField
                label="Numéro de téléphone"
                type="tel"
                autoComplete="tel"
                placeholder="+228 90 00 00 00"
                hint="Utilisé pour les notifications d'urgence et les rappels."
                {...bind('phone')}
              />
            </div>
          </fieldset>
        </div>

        <div className="flex flex-col gap-4 border-t border-line pt-5">
          <h3 className="text-xs font-semibold tracking-wider text-muted uppercase">
            Paramètres institutionnels
          </h3>
          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            <TextField
              label="Adresse e-mail"
              type="email"
              value={user.email ?? ''}
              readOnly
              disabled
              showRequirement={false}
              hint="Identifiant de connexion officiel. Non modifiable directement."
            />
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted">Rôle sur la plateforme</span>
              <div className="flex h-11 items-center justify-between rounded-2xl border border-line bg-page px-3.5">
                <span className="text-sm font-semibold text-ink">{roleLabels[user.role]}</span>
                <Badge tone="blue">Attribué</Badge>
              </div>
              <p className="text-xs text-muted">
                Défini par l’établissement. Contactez l’administrateur pour tout changement.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-line pt-4">
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
            Enregistrer les modifications
          </Button>
        </div>
      </form>
    </Card>
  )
}
