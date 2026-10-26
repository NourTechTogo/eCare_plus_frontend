import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { SelectField } from '@/components/ui/SelectField'
import { TextareaField } from '@/components/ui/TextareaField'
import { TextField } from '@/components/ui/TextField'
import { formLabels } from '@/features/treatments/labels'
import { createTreatment, updateTreatment } from '@/features/treatments/services/treatmentService'
import type { DrugForm, Treatment, TreatmentInput } from '@/features/treatments/types/treatment'
import { useFeedback } from '@/hooks/useFeedback'
import { toDateInput } from '@/utils/localDate'

const formOptions = Object.entries(formLabels).map(([value, label]) => ({ value, label }))
const MAX_TIMES = 6

interface TreatmentDialogProps {
  patientId: string
  /** Traitement à modifier ; absent, la fenêtre sert à en prescrire un nouveau. */
  treatment?: Treatment
  onClose: () => void
  onSaved: (treatment: Treatment) => void
}

/** Prescription ou modification d'un traitement (EF-W2-20, EF-W2-25). */
export function TreatmentDialog({ patientId, treatment, onClose, onSaved }: TreatmentDialogProps) {
  const [drugName, setDrugName] = useState(treatment?.drugName ?? '')
  const [dosage, setDosage] = useState(treatment?.dosage ?? '')
  const [form, setForm] = useState<string>(treatment?.form ?? 'comprime')
  const [times, setTimes] = useState<string[]>(treatment?.times ?? ['08:00'])
  const [startDate, setStartDate] = useState(() => treatment?.startDate ?? toDateInput(new Date()))
  const [endDate, setEndDate] = useState(treatment?.endDate ?? '')
  const [instructions, setInstructions] = useState(treatment?.instructions ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const feedback = useFeedback()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors: Record<string, string> = {}
    if (!drugName.trim()) nextErrors.drugName = 'Indiquez le médicament.'
    if (!dosage.trim()) nextErrors.dosage = 'Indiquez la dose par prise.'
    if (times.length === 0 || times.some((time) => !time))
      nextErrors.times = 'Indiquez chaque heure de prise.'
    else if (new Set(times).size !== times.length)
      nextErrors.times = 'Deux prises ne peuvent pas avoir la même heure.'
    if (!startDate) nextErrors.startDate = 'Indiquez la date de début.'
    if (endDate && endDate < startDate) nextErrors.endDate = 'La fin ne peut pas précéder le début.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const input: TreatmentInput = {
      drugName: drugName.trim(),
      dosage: dosage.trim(),
      form: form as DrugForm,
      times: [...times].sort(),
      startDate,
      endDate: endDate || undefined,
      instructions: instructions.trim() || undefined,
    }
    setSaving(true)
    try {
      const saved = treatment
        ? await updateTreatment(treatment.id, input)
        : await createTreatment(patientId, input)
      onSaved(saved)
      feedback.success(
        treatment ? 'Traitement modifié' : 'Traitement prescrit',
        'Le patient est prévenu dans l’application et ses rappels de prise sont mis à jour.',
      )
    } catch {
      feedback.error(
        "Le traitement n'a pas pu être enregistré",
        'Vos informations sont conservées. Réessayez.',
      )
      setSaving(false)
    }
  }

  return (
    <Dialog
      title={treatment ? 'Modifier le traitement' : 'Prescrire un traitement'}
      size="lg"
      onClose={onClose}
    >
      <form
        noValidate
        onSubmit={(event) => void handleSubmit(event)}
        className="flex flex-col gap-5"
      >
        <fieldset disabled={saving} className="flex min-w-0 flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Médicament"
              required
              placeholder="Par exemple : Metformine"
              value={drugName}
              error={errors.drugName}
              onChange={(event) => setDrugName(event.target.value)}
            />
            <TextField
              label="Dose par prise"
              required
              placeholder="Par exemple : 850 mg"
              value={dosage}
              error={errors.dosage}
              onChange={(event) => setDosage(event.target.value)}
            />
            <SelectField
              label="Forme"
              required
              placeholder="Choisir"
              options={formOptions}
              value={form}
              onChange={(event) => setForm(event.target.value)}
            />
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-semibold text-muted">
              Heures de prise <span className="text-danger">*</span>
            </legend>
            <div className="flex flex-wrap items-center gap-3">
              {times.map((time, index) => (
                <div key={index} className="flex items-center gap-1">
                  <input
                    type="time"
                    aria-label={`Heure de la prise ${index + 1}`}
                    value={time}
                    onChange={(event) =>
                      setTimes((current) =>
                        current.map((value, position) =>
                          position === index ? event.target.value : value,
                        ),
                      )
                    }
                    className="h-11 rounded-xl border border-control bg-page px-3 text-sm text-ink focus:bg-surface focus:outline-2 focus:outline-primary"
                  />
                  {times.length > 1 && (
                    <button
                      type="button"
                      aria-label={`Retirer la prise de ${time || 'cette heure'}`}
                      onClick={() =>
                        setTimes((current) => current.filter((_, position) => position !== index))
                      }
                      className="inline-flex size-8 items-center justify-center rounded-full text-muted hover:bg-danger-soft hover:text-danger focus-visible:outline-2 focus-visible:outline-primary"
                    >
                      <span aria-hidden="true">×</span>
                    </button>
                  )}
                </div>
              ))}
              {times.length < MAX_TIMES && (
                <Button
                  variant="soft"
                  size="sm"
                  onClick={() => setTimes((current) => [...current, ''])}
                >
                  Ajouter une prise
                </Button>
              )}
            </div>
            {errors.times && <p className="text-sm text-danger">{errors.times}</p>}
            <p className="text-xs text-muted">
              Un rappel est envoyé au patient à chaque heure de prise, même hors connexion.
            </p>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Début"
              type="date"
              required
              value={startDate}
              error={errors.startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
            <TextField
              label="Fin"
              type="date"
              hint="Laisser vide pour un traitement au long cours."
              min={startDate}
              value={endDate}
              error={errors.endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </div>
          <TextareaField
            label="Consignes"
            rows={3}
            maxLength={500}
            placeholder="Par exemple : au cours des repas"
            value={instructions}
            onChange={(event) => setInstructions(event.target.value)}
          />
        </fieldset>
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="secondary" disabled={saving} onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" loading={saving}>
            {treatment ? 'Enregistrer' : 'Prescrire'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
