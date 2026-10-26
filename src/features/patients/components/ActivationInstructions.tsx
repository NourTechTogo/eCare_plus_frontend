import type { Patient } from '@/features/patients/types/patient'

const steps = [
  'Installer l’application eCare+ sur son téléphone.',
  'Choisir « Activer mon compte » et saisir son numéro de téléphone avec le code ci-dessous.',
  'Choisir son mot de passe, puis lire et accepter les conditions d’utilisation.',
  'Vérifier et compléter ses informations ; il peut aussi numériser ses anciens documents.',
]

/** Code et marche à suivre remis au patient pour activer son compte (scénario A, étape 3). */
export function ActivationInstructions({ patient }: { patient: Patient }) {
  if (!patient.activationCode) return null
  return (
    <div className="flex flex-col gap-5 rounded-3xl border border-primary/30 bg-primary-soft p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-primary-strong">
            Code d'activation à remettre au patient
          </p>
          <p className="mt-1 font-display text-4xl font-extrabold tracking-[0.2em] text-ink tabular-nums">
            {patient.activationCode}
          </p>
        </div>
        <p className="max-w-xs text-sm text-muted">
          Valable jusqu'à l'activation du compte. Le patient l'utilise avec le numéro{' '}
          {patient.phone}.
        </p>
      </div>
      <ol className="flex flex-col gap-2">
        {steps.map((step, index) => (
          <li key={step} className="flex items-start gap-3 text-sm text-ink">
            <span
              aria-hidden="true"
              className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-bold text-primary-strong"
            >
              {index + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
    </div>
  )
}
