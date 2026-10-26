import { PasswordField } from '@/components/ui/PasswordField'
import { PASSWORD_MAX_LENGTH, PasswordRuleList } from '@/features/auth'
import type { AccountPassword } from '@/features/staff/accountPassword'

interface AccountPasswordFieldsProps {
  value: AccountPassword
  errors: Partial<Record<keyof AccountPassword, string>>
  onChange: (value: AccountPassword) => void
}

/**
 * Mot de passe de connexion saisi par l'administrateur à la création du compte ; l'utilisateur
 * pourra le changer depuis son profil.
 */
export function AccountPasswordFields({ value, errors, onChange }: AccountPasswordFieldsProps) {
  return (
    <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
      <div className="flex flex-col gap-3">
        <PasswordField
          label="Mot de passe"
          required
          autoComplete="new-password"
          maxLength={PASSWORD_MAX_LENGTH}
          value={value.password}
          error={errors.password}
          onChange={(event) => onChange({ ...value, password: event.target.value })}
        />
        <PasswordRuleList password={value.password} />
      </div>
      <PasswordField
        label="Confirmez le mot de passe"
        required
        autoComplete="new-password"
        maxLength={PASSWORD_MAX_LENGTH}
        value={value.confirmation}
        error={errors.confirmation}
        onChange={(event) => onChange({ ...value, confirmation: event.target.value })}
      />
    </div>
  )
}
