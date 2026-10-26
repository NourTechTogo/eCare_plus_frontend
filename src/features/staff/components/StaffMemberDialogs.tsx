import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { TextField } from '@/components/ui/TextField'
import { emptyAccountPassword, validateAccountPassword } from '@/features/staff/accountPassword'
import { AccountPasswordFields } from '@/features/staff/components/AccountPasswordFields'
import {
  createStaffMember,
  DuplicateEmailError,
  updateStaffMember,
  setStaffMemberStatus,
} from '@/features/staff/services/staffService'
import type { StaffMember, StaffMemberInput } from '@/features/staff/types/staffMember'
import { useFeedback } from '@/hooks/useFeedback'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Field = keyof StaffMemberInput

function validate(values: Record<Field, string>) {
  const errors: Partial<Record<Field, string>> = {}
  if (!values.lastName.trim()) errors.lastName = 'Saisissez le nom.'
  if (!values.firstName.trim()) errors.firstName = 'Saisissez le ou les prénoms.'
  if (!EMAIL_PATTERN.test(values.email.trim()))
    errors.email = 'Saisissez une adresse e-mail valide.'
  if (values.phone && values.phone.replace(/\D/g, '').length < 8)
    errors.phone = 'Saisissez un numéro valide.'
  return errors
}

/** Création d'un compte, ou modification de ses informations quand `member` est fourni. */
export function StaffMemberFormDialog({
  member,
  onClose,
  onSaved,
}: {
  member?: StaffMember
  onClose: () => void
  onSaved: (member: StaffMember) => void
}) {
  const editing = member !== undefined
  const [values, setValues] = useState<Record<Field, string>>(
    member
      ? {
          lastName: member.lastName,
          firstName: member.firstName,
          email: member.email,
          phone: member.phone ?? '',
        }
      : {
          lastName: '',
          firstName: '',
          email: '',
          phone: '',
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
      if (member) {
        const account = await updateStaffMember(member.id, values)
        onSaved(account)
        feedback.success('Compte mis à jour')
        onClose()
        return
      }
      const account = await createStaffMember(values, password.password)
      onSaved(account)
      feedback.success(
        'Compte créé',
        `${account.firstName} ${account.lastName} peut se connecter avec ${account.email} et le mot de passe choisi.`,
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
      title={editing ? 'Modifier le compte' : 'Ajouter un membre du personnel'}
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
        <p className="text-xs text-muted">
          Ce compte pourra créer les comptes et dossiers patients, affecter le médecin référent et
          référencer les patients inscrits depuis l’application (code QR). Il n’a pas accès aux
          données médicales.
        </p>
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

export function StaffMemberStatusDialog({
  member,
  onClose,
  onChanged,
}: {
  member: StaffMember
  onClose: () => void
  onChanged: (member: StaffMember) => void
}) {
  const [saving, setSaving] = useState(false)
  const feedback = useFeedback()
  const deactivating = member.status === 'actif'

  const confirm = async () => {
    setSaving(true)
    try {
      onChanged(await setStaffMemberStatus(member.id, deactivating ? 'desactive' : 'actif'))
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
      description={`${member.firstName} ${member.lastName}`}
      onClose={onClose}
    >
      <div className="flex flex-col gap-5">
        <p className="text-sm text-ink">
          {deactivating
            ? 'Cette personne ne pourra plus se connecter. Les dossiers qu’elle a créés sont conservés.'
            : 'Cette personne pourra de nouveau se connecter avec son mot de passe habituel.'}
        </p>
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
