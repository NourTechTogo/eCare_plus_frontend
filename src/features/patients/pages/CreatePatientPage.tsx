import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Page } from '@/components/layouts/Page'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { buttonClassName } from '@/components/ui/styles'
import { ActivationInstructions } from '@/features/patients/components/ActivationInstructions'
import { PatientForm, type ReferentOption } from '@/features/patients/components/PatientForm'
import { createPatient, DuplicatePatientError } from '@/features/patients/services/patientService'
import type { Patient, PatientInput } from '@/features/patients/types/patient'
import { useFeedback } from '@/hooks/useFeedback'

const backLink = { to: '/patients', label: 'Retour à la liste des patients' }

export function CreatePatientPage({ doctors }: { doctors: ReferentOption[] }) {
  const navigate = useNavigate()
  const feedback = useFeedback()
  const [submitting, setSubmitting] = useState(false)
  const [created, setCreated] = useState<Patient>()
  // Une nouvelle clé vide le formulaire pour enchaîner un autre dossier.
  const [formKey, setFormKey] = useState(0)

  const handleSubmit = async (input: PatientInput) => {
    setSubmitting(true)
    try {
      setCreated(await createPatient(input))
      window.scrollTo({ top: 0 })
    } catch (error) {
      if (error instanceof DuplicatePatientError) {
        feedback.error(
          'Ce patient a déjà un dossier',
          'Un dossier existe au même nom, prénom et date de naissance. Recherchez-le dans la liste des patients.',
        )
      } else {
        feedback.error(
          "Le dossier n'a pas pu être créé",
          'Vos informations sont conservées. Vérifiez votre connexion puis réessayez.',
        )
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (created) {
    const doctor = doctors.find((candidate) => candidate.id === created.referentDoctorId)
    return (
      <Page title="Dossier patient créé" backLink={backLink}>
        <div className="flex w-full max-w-3xl flex-col gap-6">
          <Alert
            variant="success"
            title={`Dossier n° ${created.fileNumber} créé pour ${created.firstName} ${created.lastName}.`}
          >
            {doctor ? `Médecin référent : ${doctor.name}. ` : ''}Le médecin retrouvera le patient
            dans sa liste dès que le compte sera activé.
          </Alert>
          <ActivationInstructions patient={created} />
          <div className="flex flex-wrap gap-3">
            <Link to={`/patients/${created.id}`} className={buttonClassName('primary')}>
              Voir le dossier
            </Link>
            <Button
              variant="secondary"
              onClick={() => {
                setCreated(undefined)
                setFormKey((key) => key + 1)
              }}
            >
              Créer un autre dossier
            </Button>
          </div>
        </div>
      </Page>
    )
  }

  return (
    <Page
      title="Nouveau dossier patient"
      description="Création du compte et du dossier, avec le médecin référent"
      backLink={backLink}
    >
      <div className="flex w-full max-w-4xl flex-col gap-6">
        <PatientForm
          key={formKey}
          doctors={doctors}
          submitting={submitting}
          onSubmit={(input) => void handleSubmit(input)}
          onCancel={() => void navigate(backLink.to)}
        />
      </div>
    </Page>
  )
}
