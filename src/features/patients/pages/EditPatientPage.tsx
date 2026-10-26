import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Page } from '@/components/layouts/Page'
import { PatientForm, type ReferentOption } from '@/features/patients/components/PatientForm'
import { PatientUnavailable } from '@/features/patients/components/PatientUnavailable'
import { usePatient } from '@/features/patients/hooks/usePatients'
import { updatePatient } from '@/features/patients/services/patientService'
import type { PatientInput } from '@/features/patients/types/patient'
import { useFeedback } from '@/hooks/useFeedback'
import { formatDate } from '@/utils/formatDate'

const backLink = { to: '/patients', label: 'Retour à la liste des patients' }

export function EditPatientPage({ doctors }: { doctors: ReferentOption[] }) {
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
      await updatePatient(patient.id, input)
      feedback.success(
        'Dossier patient modifié',
        input.referentDoctorId !== patient.referentDoctorId
          ? 'Le nouveau médecin référent a désormais accès au dossier.'
          : 'Les nouvelles informations sont enregistrées.',
      )
      await navigate(`/patients/${patient.id}`)
    } catch {
      feedback.error(
        "Les modifications n'ont pas pu être enregistrées",
        'Vos modifications sont conservées. Vérifiez votre connexion puis réessayez.',
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
          doctors={doctors}
          submitting={submitting}
          onSubmit={(input) => void handleSubmit(input)}
          onCancel={() => void navigate(backLink.to)}
        />
      </div>
    </Page>
  )
}
