import { useState } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { SelectField } from '@/components/ui/SelectField'
import { ListSkeleton } from '@/components/ui/Skeleton'
import { buttonClassName } from '@/components/ui/styles'
import { listDocuments } from '@/features/documents/services/documentService'
import type {
  DocumentOrigin,
  DocumentType,
  PatientDocument,
} from '@/features/documents/types/document'
import { useAsyncData } from '@/hooks/useAsyncData'
import { formatDate } from '@/utils/formatDate'

const documentTypeLabels: Record<DocumentType, string> = {
  ordonnance: 'Ordonnance',
  resultat_analyse: "Résultat d'analyse",
  compte_rendu: 'Compte rendu',
  carnet_suivi: 'Carnet de suivi',
  autre: 'Autre document',
}

const originLabels: Record<DocumentOrigin, string> = {
  numerisation: 'Numérisé à la création du dossier',
  ajout: 'Ajouté par le patient',
}

const typeOptions = Object.entries(documentTypeLabels).map(([value, label]) => ({ value, label }))

const sizeFormatter = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 })
const formatSize = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} Ko`
    : `${sizeFormatter.format(bytes / (1024 * 1024))} Mo`

const isImage = (document: PatientDocument) => document.mimeType.startsWith('image/')

const documentIconPath =
  'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm-1 7V3.5L18.5 9H13ZM8 13h8v2H8v-2Zm0 4h5v2H8v-2Z'

function DocumentViewer({ document, onClose }: { document: PatientDocument; onClose: () => void }) {
  return (
    <Dialog
      title={document.title}
      description={`${documentTypeLabels[document.type]} du ${formatDate(document.documentDate)}`}
      size="lg"
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        {isImage(document) ? (
          <img
            src={document.url}
            alt={document.title}
            className="w-full rounded-2xl border border-line"
          />
        ) : (
          <iframe
            src={document.url}
            title={document.title}
            className="h-[65vh] w-full rounded-2xl border border-line"
          />
        )}
        <div className="flex justify-end">
          <a href={document.url} download className={buttonClassName('secondary')}>
            Télécharger
          </a>
        </div>
      </div>
    </Dialog>
  )
}

/** Documents du patient, numérisés ou ajoutés depuis l'application (EF-W1-5, EF-W1-8, EF-W1-14). */
export function PatientDocuments({ patientId }: { patientId: string }) {
  const state = useAsyncData(`documents:${patientId}`, () => listDocuments(patientId))
  const [type, setType] = useState('')
  const [open, setOpen] = useState<PatientDocument>()

  if (state.status === 'loading') {
    return (
      <Card title="Documents">
        <ListSkeleton label="Chargement des documents…" />
      </Card>
    )
  }
  if (state.status === 'error') {
    return (
      <Alert variant="error" title="Les documents n'ont pas pu être chargés.">
        Rechargez la page pour réessayer.
      </Alert>
    )
  }

  const shown = type ? state.data.filter((document) => document.type === type) : state.data

  return (
    <Card title="Documents">
      <div className="flex flex-col gap-5">
        {state.data.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">
            Aucun document pour l'instant. Le patient peut numériser ses ordonnances et résultats
            depuis l'application.
          </p>
        ) : (
          <>
            <div className="w-full max-w-xs">
              <SelectField
                label="Type de document"
                placeholder="Tous les documents"
                options={typeOptions}
                showRequirement={false}
                value={type}
                onChange={(event) => setType(event.target.value)}
              />
            </div>
            {shown.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">Aucun document de ce type.</p>
            ) : (
              <ul className="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-4">
                {shown.map((document) => (
                  <li key={document.id}>
                    <button
                      type="button"
                      onClick={() => setOpen(document)}
                      aria-label={`Ouvrir ${document.title}`}
                      className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-line bg-surface text-left transition hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      <div className="flex h-40 items-center justify-center overflow-hidden bg-page">
                        {isImage(document) ? (
                          <img
                            src={document.url}
                            alt=""
                            className="size-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.03]"
                          />
                        ) : (
                          <span
                            aria-hidden="true"
                            className="inline-flex size-16 items-center justify-center rounded-2xl bg-danger text-white"
                          >
                            <svg className="size-8" viewBox="0 0 24 24" fill="currentColor">
                              <path d={documentIconPath} />
                            </svg>
                          </span>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col gap-2 p-4">
                        <Badge
                          tone={
                            document.type === 'ordonnance'
                              ? 'blue'
                              : document.type === 'resultat_analyse'
                                ? 'violet'
                                : 'amber'
                          }
                        >
                          {documentTypeLabels[document.type]}
                        </Badge>
                        <p className="font-semibold text-ink">{document.title}</p>
                        <p className="text-xs text-muted">
                          {formatDate(document.documentDate)} · {formatSize(document.sizeBytes)}
                        </p>
                        <p className="mt-auto text-xs text-muted">
                          {originLabels[document.origin]}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
      {open && <DocumentViewer document={open} onClose={() => setOpen(undefined)} />}
    </Card>
  )
}
