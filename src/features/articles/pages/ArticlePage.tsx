import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Page } from '@/components/layouts/Page'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { PageSkeleton } from '@/components/ui/Skeleton'
import { buttonClassName } from '@/components/ui/styles'
import { ArticleBody } from '@/features/articles/components/ArticleBody'
import { useArticle } from '@/features/articles/hooks/useArticles'
import { deleteArticle } from '@/features/articles/services/articleService'
import { useFeedback } from '@/hooks/useFeedback'
import { formatDate } from '@/utils/formatDate'

const backLink = { to: '/articles', label: 'Retour aux articles' }

/** Lecture d'un article ; son auteur peut le modifier ou le supprimer. */
export function ArticlePage({ currentUserId }: { currentUserId: string }) {
  const { articleId } = useParams()
  const state = useArticle(articleId)
  const navigate = useNavigate()
  const feedback = useFeedback()
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (state.status === 'loading') {
    return (
      <Page title="Article" backLink={backLink}>
        <PageSkeleton label="Chargement de l'article…" />
      </Page>
    )
  }
  if (state.status === 'error' || !state.data) {
    return (
      <Page title="Article" backLink={backLink}>
        <Alert variant="error" title="Cet article est introuvable.">
          Il a peut-être été retiré par son auteur.
        </Alert>
      </Page>
    )
  }

  const article = state.data
  const mine = article.authorId === currentUserId

  const remove = async () => {
    setBusy(true)
    try {
      await deleteArticle(article.id)
      feedback.success('Article supprimé')
      await navigate('/articles')
    } catch {
      feedback.error(
        "L'article n'a pas pu être supprimé",
        'Vérifiez votre connexion puis réessayez.',
      )
      setBusy(false)
    }
  }

  return (
    <Page
      title="Article"
      description={mine ? 'Votre article, visible des patients dans l’application' : undefined}
      backLink={backLink}
    >
      <div className="grid items-start gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Card>
            <ArticleBody
              article={article}
              authorName={article.authorName}
              dateLabel={`publié le ${formatDate(article.publishedAt)}`}
            />
          </Card>
        </div>
        {mine && (
          <Card title="Gestion de l'article">
            <div className="flex flex-col gap-3">
              <Link
                to={`/articles/${article.id}/modifier`}
                className={buttonClassName('secondary')}
              >
                Modifier
              </Link>
              <Button variant="secondary" disabled={busy} onClick={() => setConfirmDelete(true)}>
                Supprimer
              </Button>
              <p className="text-xs text-muted">
                Dernière modification le {formatDate(article.updatedAt)}.
              </p>
            </div>
          </Card>
        )}
      </div>

      {confirmDelete && (
        <Dialog
          title="Supprimer l'article ?"
          description={article.title}
          onClose={() => setConfirmDelete(false)}
        >
          <div className="flex flex-col gap-5">
            <p className="text-sm text-ink">
              L'article sera définitivement supprimé et retiré de l’application des patients.
            </p>
            <div className="flex flex-wrap justify-end gap-3">
              <Button variant="secondary" disabled={busy} onClick={() => setConfirmDelete(false)}>
                Annuler
              </Button>
              <Button loading={busy} onClick={() => void remove()}>
                Supprimer
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </Page>
  )
}
