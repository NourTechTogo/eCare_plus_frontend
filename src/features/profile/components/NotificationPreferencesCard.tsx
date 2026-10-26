import { useState } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ListSkeleton } from '@/components/ui/Skeleton'
import { getPreferences, savePreferences } from '@/features/profile/services/profileService'
import type {
  NotificationChannels,
  NotificationPreferences,
  NotificationTopics,
} from '@/features/profile/types/preferences'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useFeedback } from '@/hooks/useFeedback'

const channelOptions: { key: keyof NotificationChannels; label: string; hint: string }[] = [
  { key: 'web', label: 'Dans le portail', hint: 'Cloche de notifications et compteurs' },
  { key: 'email', label: 'Par e-mail', hint: 'À votre adresse de connexion' },
  { key: 'whatsapp', label: 'Par WhatsApp', hint: 'Message court, sans donnée médicale détaillée' },
]

const topicOptions: { key: keyof NotificationTopics; label: string; hint: string }[] = [
  { key: 'alertes', label: 'Alertes de mesure', hint: 'Mesure hors seuil d’un de vos patients' },
  { key: 'messages', label: 'Nouveaux messages', hint: 'Message ou appel manqué d’un patient' },
  { key: 'rendezVous', label: 'Rendez-vous', hint: 'Confirmation ou annulation par le patient' },
]

function Toggle({
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  label: string
  hint: string
  checked: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl px-1 py-2 has-disabled:cursor-not-allowed">
      <span className="flex flex-col">
        <span className="text-sm font-semibold text-ink">{label}</span>
        <span className="text-xs text-muted">{hint}</span>
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className="relative h-7 w-12 shrink-0 rounded-full bg-control transition-colors peer-checked:bg-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary peer-disabled:opacity-60 after:absolute after:top-1 after:left-1 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5"
      />
    </label>
  )
}

function PreferencesForm({ initial }: { initial: NotificationPreferences }) {
  const [saved, setSaved] = useState(initial)
  const [values, setValues] = useState(initial)
  const [saving, setSaving] = useState(false)
  const feedback = useFeedback()
  const changed = JSON.stringify(values) !== JSON.stringify(saved)

  const save = async () => {
    setSaving(true)
    try {
      setSaved(await savePreferences(values))
      feedback.success('Préférences enregistrées')
    } catch {
      feedback.error(
        "Les préférences n'ont pas pu être enregistrées",
        'Vérifiez votre connexion puis réessayez.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <fieldset className="flex flex-col gap-1">
        <legend className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
          Canaux
        </legend>
        {channelOptions.map((option) => (
          <Toggle
            key={option.key}
            label={option.label}
            hint={option.hint}
            checked={values.channels[option.key]}
            disabled={saving}
            onChange={(checked) =>
              setValues((current) => ({
                ...current,
                channels: { ...current.channels, [option.key]: checked },
              }))
            }
          />
        ))}
      </fieldset>
      <fieldset className="flex flex-col gap-1">
        <legend className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
          Être prévenu pour
        </legend>
        {topicOptions.map((option) => (
          <Toggle
            key={option.key}
            label={option.label}
            hint={option.hint}
            checked={values.topics[option.key]}
            disabled={saving}
            onChange={(checked) =>
              setValues((current) => ({
                ...current,
                topics: { ...current.topics, [option.key]: checked },
              }))
            }
          />
        ))}
      </fieldset>
      {!values.channels.web && !values.channels.email && !values.channels.whatsapp && (
        <Alert variant="error" title="Aucun canal n'est activé.">
          Vous ne serez prévenu d'aucune alerte. Gardez au moins un canal actif.
        </Alert>
      )}
      <div className="flex justify-end">
        <Button loading={saving} disabled={!changed} onClick={() => void save()}>
          Enregistrer
        </Button>
      </div>
    </div>
  )
}

/** Gestion des notifications (EF-AUTH-8, EF-W2-14, EF-W2-19). */
export function NotificationPreferencesCard() {
  const state = useAsyncData('notification-preferences', getPreferences)
  return (
    <Card title="Notifications">
      {state.status === 'loading' ? (
        <ListSkeleton label="Chargement des préférences…" />
      ) : state.status === 'error' ? (
        <Alert variant="error" title="Les préférences n'ont pas pu être chargées.">
          Rechargez la page pour réessayer.
        </Alert>
      ) : (
        <PreferencesForm initial={state.data} />
      )}
    </Card>
  )
}
