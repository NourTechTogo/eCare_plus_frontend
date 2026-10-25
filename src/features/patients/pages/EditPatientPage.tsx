import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Page } from '@/components/layouts/Page'
import { PatientForm } from '@/features/patients/components/PatientForm'
import { PatientUnavailable } from '@/features/patients/components/PatientUnavailable'
import { usePatient } from '@/features/patients/hooks/usePatients'
import { updatePatient } from '@/features/patients/services/patientService'
import type { PatientInput } from '@/features/patients/types/patient'
import { useFeedback } from '@/hooks/useFeedback'
import { formatDate } from '@/utils/formatDate'

const backLink = { to: '/patients', label: 'Retour à la liste des patients' }

export function EditPatientPage() {
  const { patientId } = useParams()
  const navigate = useNavigate()
  const feedback = useFeedback()
  const state = usePatient(patientId)
  const [submitting, setSubmitting] = useState(false)

  if (state.status !== 'success') {
    return (
      <Page title="Modifier le dossier patient" backLink={backLink}>
        <PatientUnavailable status={state.status} />
      </Page>
    )
  }

  const { patient } = state

  const handleSubmit = async (input: PatientInput) => {
    setSubmitting(true)
    try {
      await updatePatient(patient.id, input, patient)
      feedback.success('Dossier patient modifié', 'Les nouvelles informations sont enregistrées.')
      await navigate(`/patients/${patient.id}`)
    } catch (error) {
      feedback.error(
        "Les modifications n'ont pas pu être enregistrées",
        error instanceof Error ? error.message : 'Vos modifications sont conservées. Réessayez.',
      )
      setSubmitting(false)
    }
  }

  return (
    <Page
      title="Modifier le dossier patient"
      description={`${patient.firstName} ${patient.lastName}, dossier n° ${patient.fileNumber}`}
      backLink={backLink}
    >
      <div className="flex w-full max-w-4xl flex-col gap-6">
        <p className="text-sm text-muted">
          Le numéro de dossier ({patient.fileNumber}) et la date de création (
          {formatDate(patient.createdAt)}) ne sont pas modifiables.
        </p>

        <PatientForm
          initialPatient={patient}
          submitting={submitting}
          onSubmit={(input) => void handleSubmit(input)}
          onCancel={() => void navigate(backLink.to)}
        />
      </div>
    </Page>
  )
}
