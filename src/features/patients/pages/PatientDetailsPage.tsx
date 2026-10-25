import type { ReactNode } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { Page } from '@/components/layouts/Page'
import { Avatar } from '@/components/ui/Avatar'
import { Card } from '@/components/ui/Card'
import { tabId, tabPanelId } from '@/components/ui/tabIds'
import { Tabs } from '@/components/ui/Tabs'
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
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-xs font-semibold tracking-wide text-muted uppercase">{label}</dt>
      <dd className={`text-sm leading-relaxed [overflow-wrap:anywhere] ${value ? 'text-ink' : 'text-muted'}`}>{value?.trim() ? value : 'Non renseigné'}</dd>
    </div>
  )
}

function PatientInformation({ patient }: { patient: Patient }) {
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
          <Item label="Ville" value={patient.city}/>
          <Item label="Pays" value={patient.country}/>
        </Details>
      </Card>

      <Card title="Suivi">
        <Details>
          <Item label="Pathologie suivie" value={conditionLabels[patient.condition]} />
          <Item label="Médecin référent" value={patient.professionalName}/>
          <Item label="Consentement patient" value={patient.consentAccepted ? 'Accepté' : 'À recueillir dans l’application mobile'}/>
          <Item label="Groupe sanguin" value={patient.bloodGroup}/>
          <Item label="Taille (cm)" value={patient.heightCm}/>
          <Item label="Poids (kg)" value={patient.weightKg}/>
          <Item label="Allergies" value={patient.allergies}/>
          <Item label="Antécédents" value={patient.history}/>
        </Details>
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
}

export function PatientDetailsPage({ tabs = [] }: PatientDetailsPageProps) {
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
  const age = patient.birthDate ? getAge(patient.birthDate) : null
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
      contentClassName="mx-auto w-full max-w-7xl"
    >
      <Card>
        <div className="flex min-w-0 items-start gap-4 sm:items-center sm:gap-5">
          <Avatar initials={initials} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2"><h2 className="font-display text-xl leading-snug font-bold text-ink [overflow-wrap:anywhere] sm:text-2xl">{fullName}</h2><ConditionBadges condition={patient.condition}/></div>
            <dl className="mt-3 flex min-w-0 flex-col gap-2 text-sm text-muted sm:flex-row sm:flex-wrap sm:gap-x-4 sm:gap-y-1">
              <div className="min-w-0 [overflow-wrap:anywhere]"><dt className="sr-only">Date de naissance</dt><dd>{patient.birthDate?`${born} le ${formatDate(patient.birthDate)}${age!==null&&Number.isFinite(age)?` (${age} ans)`:''}`:'Date de naissance non renseignée'}</dd></div>
              <div className="min-w-0 [overflow-wrap:anywhere]"><dt className="sr-only">Numéro de dossier</dt><dd>Dossier n° {patient.fileNumber}</dd></div>
              <div className="min-w-0 [overflow-wrap:anywhere]"><dt className="sr-only">Téléphone</dt><dd>{patient.phone||'Téléphone non renseigné'}</dd></div>
            </dl>
          </div>
        </div>
      </Card>

      {tabs.length === 0 ? (
        <PatientInformation patient={patient} />
      ) : (
        <>
          <Tabs
            label="Rubriques du dossier"
            wrap
            tabs={allTabs}
            active={activeId}
            onChange={openTab}
          />
          <div
            key={activeId}
            id={tabPanelId(activeId)}
            role="tabpanel"
            aria-labelledby={tabId(activeId)}
            className="flex min-w-0 animate-enter scroll-mt-40 flex-col gap-6 sm:scroll-mt-24"
          >
            {activeTab ? activeTab.render(patient, openTab) : <PatientInformation patient={patient} />}
          </div>
        </>
      )}
    </Page>
  )
}
