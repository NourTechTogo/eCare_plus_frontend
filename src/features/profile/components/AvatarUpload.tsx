import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { roleLabels, type User } from '@/features/auth'
import { updateAvatar } from '@/features/profile/services/profileService'
import { useFeedback } from '@/hooks/useFeedback'

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5 Mo max
const ACCEPTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp']
const AVATAR_MAX_DIMENSION = 256

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

/**
 * Redimensionne et compresse l'image côté client (canvas) afin d'obtenir un data URL
 * léger (~15-30 Ko) sans saturer l'espace de stockage local de la session.
 */
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      let { width, height } = img

      if (width > height) {
        if (width > AVATAR_MAX_DIMENSION) {
          height = Math.round((height * AVATAR_MAX_DIMENSION) / width)
          width = AVATAR_MAX_DIMENSION
        }
      } else {
        if (height > AVATAR_MAX_DIMENSION) {
          width = Math.round((width * AVATAR_MAX_DIMENSION) / height)
          height = AVATAR_MAX_DIMENSION
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        reject(new Error('Contexte canvas inaccessible'))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error("Impossible de charger l'image"))
    }

    img.src = objectUrl
  })
}

interface AvatarUploadProps {
  user: User
  onAvatarUpdated: (updatedUser: User) => void
}

export function AvatarUpload({ user, onAvatarUpdated }: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const feedback = useFeedback()
  const [loading, setLoading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const processFile = async (file: File) => {
    if (!ACCEPTED_FORMATS.includes(file.type)) {
      feedback.error(
        'Format non supporté',
        'Veuillez sélectionner une image JPEG, PNG ou WebP.',
      )
      return
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      feedback.error(
        'Fichier trop volumineux',
        'La taille maximale acceptée est de 5 Mo.',
      )
      return
    }

    setLoading(true)
    try {
      const compressedDataUrl = await compressImage(file)
      const updatedUser = await updateAvatar(user, compressedDataUrl)
      onAvatarUpdated(updatedUser)
      feedback.success(
        'Photo de profil mise à jour',
        'Votre nouvelle photo est immédiatement active.',
      )
    } catch {
      feedback.error(
        'Échec du traitement',
        'Impossible de charger cette image. Veuillez réessayer avec un autre fichier.',
      )
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) await processFile(file)
  }

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    const file = event.dataTransfer.files?.[0]
    if (file) await processFile(file)
  }

  const handleRemoveAvatar = async () => {
    setLoading(true)
    try {
      const updatedUser = await updateAvatar(user, null)
      onAvatarUpdated(updatedUser)
      feedback.success(
        'Photo de profil supprimée',
        'Votre profil affiche à nouveau vos initiales.',
      )
    } catch {
      feedback.error(
        'Échec de la suppression',
        'Impossible de supprimer la photo. Veuillez réessayer.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
      {/* Zone Avatar cliquable et glisser-déposer */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => void handleDrop(e)}
          className="relative self-start group"
        >
          {/* Input fichier masqué */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => void handleFileChange(e)}
          />

          {/* Bouton cliquable pour ajouter/changer la photo */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            aria-label="Changer la photo de profil"
            title="Cliquer pour choisir une photo ou glisser-déposer une image"
            className={`relative block rounded-full transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary ${
              isDragging ? 'ring-4 ring-primary scale-105' : 'hover:opacity-95'
            }`}
          >
            <Avatar initials={getInitials(user.name)} src={user.avatarUrl} size="2xl" />

            {/* Pastille caméra au survol en bas à droite */}
            <span
              className="absolute right-0 bottom-0 flex size-8 items-center justify-center rounded-full border-2 border-surface bg-primary text-white shadow-md transition-transform duration-150 group-hover:scale-110"
              aria-hidden="true"
            >
              <svg
                className="size-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </span>
          </button>

          {/* Petite croix en haut à droite pour supprimer la photo */}
          {user.avatarUrl && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                void handleRemoveAvatar()
              }}
              disabled={loading}
              aria-label="Supprimer la photo de profil"
              title="Supprimer la photo de profil"
              className="absolute -top-1 -right-1 z-10 flex size-7 items-center justify-center rounded-full border-2 border-surface bg-white text-danger shadow-md transition-all duration-150 hover:bg-danger-soft hover:scale-110 focus-visible:outline-2 focus-visible:outline-danger"
            >
              <svg
                className="size-3.5 stroke-[2.5]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Coordonnées principales & Badges */}
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              {user.name}
            </h2>
            <Badge tone="blue">{roleLabels[user.role]}</Badge>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-semibold text-success">
              <span className="size-1.5 rounded-full bg-success animate-pulse" />
              Compte actif
            </span>
          </div>

          {user.specialty && (
            <p className="flex items-center gap-2 text-sm font-medium text-primary-strong">
              <svg
                className="size-4 shrink-0 text-primary"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
              {user.specialty}
            </p>
          )}

          {/* Bandeau méta avec icônes */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted sm:text-sm">
            {user.email && (
              <span className="flex items-center gap-1.5">
                <svg
                  className="size-4 text-control"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                {user.email}
              </span>
            )}
            {user.phone && (
              <span className="flex items-center gap-1.5">
                <svg
                  className="size-4 text-control"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                {user.phone}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-control">
              <span>ID :</span>
              <code className="font-mono text-xs text-ink">{user.id}</code>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
