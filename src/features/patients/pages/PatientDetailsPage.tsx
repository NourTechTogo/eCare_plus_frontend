import type { ReactNode } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { Page } from '@/components/layouts/Page'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { tabId, tabPanelId } from '@/components/ui/tabIds'
import { Tabs } from '@/components/ui/Tabs'
import { ActivationInstructions } from '@/features/patients/components/ActivationInstructions'
import { ConditionBadges } from '@/features/patients/components/ConditionBadges'
import { PatientUnavailable } from '@/features/patients/components/PatientUnavailable'
import { usePatient } from '@/features/patients/hooks/usePatients'
import { conditionLabels, sexLabels } from '@/features/patients/labels'
import type { Patient } from '@/features/patients/types/patient'
import { formatDate } from '@/utils/formatDate'
import { getAge } from '@/utils/getAge'

const backLink = { to: '/patients', label: 'Retour à la liste des patients' }

/** Paramètre d'adresse qui retient l'onglet ouvert, pour le retour arrière et le partage du lien. */
const TAB_PARAM = 'onglet'
const informationTab = { id: 'informations', label: 'Informations' }

/** Onglet du dossier fourni par l'application, par exemple les mesures ou les observations. */
export interface PatientTab {
  id: string
  label: string
  /** `openTab` permet à un contenu (un résumé, par exemple) d'ouvrir un autre onglet. */
  render: (patient: Patient, openTab: (id: string) => void) => ReactNode
}

function Details({ children }: { children: ReactNode }) {
  return <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">{children}</dl>
}

function Item({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-semibold tracking-wide text-muted uppercase">{label}</dt>
      <dd className={`text-sm ${value ? 'text-ink' : 'text-muted'}`}>{value ?? 'Non renseigné'}</dd>
    </div>
  )
}

const originLabels = {
  etablissement: 'Créé par l’établissement',
  auto_inscription: 'Inscription dans l’application, référencée par code QR',
}

function PatientInformation({
  patient,
  referentName,
}: {
  patient: Patient
  referentName?: string
}) {
  const format = (value: number | undefined, unit: string) =>
    value === undefined ? undefined : `${value.toLocaleString('fr-FR')} ${unit}`
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card title="Informations personnelles">
        <Details>
          <Item label="Nom" value={patient.lastName} />
          <Item label="Prénom(s)" value={patient.firstName} />
          <Item label="Sexe" value={sexLabels[patient.sex]} />
          <Item label="Date de naissance" value={formatDate(patient.birthDate)} />
        </Details>
      </Card>

      <Card title="Coordonnées">
        <Details>
          <Item label="Téléphone" value={patient.phone} />
          <Item label="Adresse e-mail" value={patient.email} />
          <Item label="Adresse" value={patient.address} />
          <Item label="Ville" value={patient.city} />
        </Details>
      </Card>

      <Card title="Suivi">
        <Details>
          <Item label="Pathologie suivie" value={conditionLabels[patient.condition]} />
          <Item label="Médecin référent" value={referentName} />
          <Item label="Origine du dossier" value={originLabels[patient.origin]} />
          <Item
            label="Consentement"
            value={
              patient.consentAcceptedAt
                ? `Accepté le ${formatDate(patient.consentAcceptedAt)}`
                : 'En attente de l’activation du compte'
            }
          />
        </Details>
      </Card>

      <Card title="Informations médicales">
        <Details>
          <Item label="Taille" value={format(patient.heightCm, 'cm')} />
          <Item label="Poids" value={format(patient.weightKg, 'kg')} />
          <Item label="Groupe sanguin" value={patient.bloodGroup} />
          <Item label="Allergies" value={patient.allergies} />
        </Details>
        <div className="mt-4">
          <Details>
            <Item label="Antécédents médicaux" value={patient.history} />
          </Details>
        </div>
      </Card>

      <Card title="Personne à prévenir">
        <Details>
          <Item label="Nom complet" value={patient.emergencyContactName} />
          <Item label="Téléphone" value={patient.emergencyContactPhone} />
        </Details>
      </Card>
    </div>
  )
}

interface PatientDetailsPageProps {
  /**
   * Onglets de suivi composés par l'application ; l'onglet « Informations » s'y ajoute en dernier.
   * Sans onglets, le dossier se limite aux informations administratives.
   */
  tabs?: PatientTab[]
  /** Nom du médecin référent, affiché dans les informations du dossier. */
  referentName?: (doctorId: string) => string | undefined
  /** Actions placées dans la carte d'identité, par exemple « Écrire au patient ». */
  renderActions?: (patient: Patient) => ReactNode
}

export function PatientDetailsPage({
  tabs = [],
  referentName,
  renderActions,
}: PatientDetailsPageProps) {
  const { patientId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const state = usePatient(patientId)

  if (state.status !== 'success') {
    return (
      <Page title="Dossier patient" backLink={backLink}>
        <PatientUnavailable status={state.status} />
      </Page>
    )
  }

  const { patient } = state
  const fullName = `${patient.firstName} ${patient.lastName}`
  const initials = `${patient.firstName.charAt(0)}${patient.lastName.charAt(0)}`.toUpperCase()
  const born = patient.sex === 'F' ? 'Née' : 'Né'

  const allTabs = [...tabs, informationTab]
  const requested = searchParams.get(TAB_PARAM)
  // Onglet affiché : celui demandé dans l'adresse s'il existe, sinon le premier.
  const activeId = allTabs.find((tab) => tab.id === requested)?.id ?? allTabs[0].id
  const activeTab = tabs.find((tab) => tab.id === activeId)
  // Changer d'onglet ne crée pas d'étape d'historique : « Retour » ramène à la liste.
  const openTab = (id: string) => setSearchParams({ [TAB_PARAM]: id }, { replace: true })

  return (
    <Page
      title="Dossier patient"
      description={`Dossier n° ${patient.fileNumber}, créé le ${formatDate(patient.createdAt)}`}
      backLink={backLink}
    >
      <Card>
        <div className="flex flex-wrap items-center gap-5">
          <Avatar initials={initials} size="lg" />
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-display text-2xl font-bold text-ink">{fullName}</h2>
              <ConditionBadges condition={patient.condition} />
              {patient.status === 'en_attente_activation' && (
                <Badge tone="amber">Compte à activer</Badge>
              )}
            </div>
            <p className="text-sm text-muted">
              {born} le {formatDate(patient.birthDate)} ({getAge(patient.birthDate)} ans) • Dossier
              n° {patient.fileNumber} • {patient.phone}
            </p>
          </div>
          {renderActions && (
            <div className="flex flex-wrap gap-2 sm:ml-auto">{renderActions(patient)}</div>
          )}
        </div>
      </Card>

      {patient.status === 'en_attente_activation' && <ActivationInstructions patient={patient} />}

      {tabs.length === 0 ? (
        <PatientInformation
          patient={patient}
          referentName={referentName?.(patient.referentDoctorId)}
        />
      ) : (
        <>
          <Tabs label="Rubriques du dossier" tabs={allTabs} active={activeId} onChange={openTab} />
          <div
            key={activeId}
            id={tabPanelId(activeId)}
            role="tabpanel"
            aria-labelledby={tabId(activeId)}
            className="flex animate-enter flex-col gap-6"
          >
            {activeTab ? (
              activeTab.render(patient, openTab)
            ) : (
              <PatientInformation
                patient={patient}
                referentName={referentName?.(patient.referentDoctorId)}
              />
            )}
          </div>
        </>
      )}
    </Page>
  )
}
