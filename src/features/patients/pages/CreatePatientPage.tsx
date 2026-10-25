import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Page } from '@/components/layouts/Page'
import { PatientForm } from '@/features/patients/components/PatientForm'
import { createPatient } from '@/features/patients/services/patientService'
import type { PatientInput } from '@/features/patients/types/patient'
import { useFeedback } from '@/hooks/useFeedback'

export function CreatePatientPage() {
  const navigate = useNavigate()
  const feedback = useFeedback()
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (input: PatientInput) => {
    setSubmitting(true)
    try {
      const patient = await createPatient(input)
      feedback.success(
        'Dossier patient créé',
        `Dossier n° ${patient.fileNumber} enregistré pour ${patient.firstName} ${patient.lastName}.`,
      )
      await navigate(`/patients/${patient.id}`)
    } catch (error) {
      feedback.error(
        "Le dossier n'a pas pu être créé",
        error instanceof Error ? error.message : 'Vos informations sont conservées. Réessayez.',
      )
      setSubmitting(false)
    }
  }

  return (
    <Page
      title="Nouveau dossier patient"
      description="Renseignez les informations essentielles du patient"
      backLink={{ to: '/patients', label: 'Retour à la liste des patients' }}
    >
      <div className="flex w-full max-w-4xl flex-col gap-6">
        <PatientForm
          submitting={submitting}
          onSubmit={(input) => void handleSubmit(input)}
          onCancel={() => void navigate('/patients')}
        />
      </div>
    </Page>
  )
}
