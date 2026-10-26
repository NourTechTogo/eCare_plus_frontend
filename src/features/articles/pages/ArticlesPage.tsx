import { useState } from 'react'
import { Link } from 'react-router'
import { Page } from '@/components/layouts/Page'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { PageSkeleton } from '@/components/ui/Skeleton'
import { buttonClassName } from '@/components/ui/styles'
import { Tabs } from '@/components/ui/Tabs'
import { tabId, tabPanelId } from '@/components/ui/tabIds'
import { useArticles } from '@/features/articles/hooks/useArticles'
import { categoryLabels, categoryTones, readingMinutes } from '@/features/articles/labels'
import type { Article } from '@/features/articles/types/article'
import { formatDate } from '@/utils/formatDate'

const pageDescription = 'Conseils et bonnes pratiques lus par les patients dans l’application'

const tabs = [
  { id: 'mes-articles', label: 'Mes articles' },
  { id: 'tous', label: 'Tous les articles' },
]

function ArticleCard({ article }: { article: Article }) {
  return (
    <li>
      <Link
        to={`/articles/${article.id}`}
        className="flex h-full flex-col gap-3 rounded-2xl border border-line bg-surface p-5 transition hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={categoryTones[article.category]}>{categoryLabels[article.category]}</Badge>
        </div>
        <p className="font-display text-lg leading-snug font-bold text-ink">{article.title}</p>
        <p className="line-clamp-3 text-sm text-muted">{article.summary}</p>
        <p className="mt-auto text-xs text-muted">
          {article.authorName} · {`publié le ${formatDate(article.publishedAt)}`} ·{' '}
          {readingMinutes(article.content)} min de lecture
        </p>
      </Link>
    </li>
  )
}

export function ArticlesPage({ currentUserId }: { currentUserId: string }) {
  const state = useArticles()
  const [active, setActive] = useState(tabs[0].id)
  const action = (
    <Link to="/articles/nouveau" className={buttonClassName('primary')}>
      Rédiger un article
    </Link>
  )

  if (state.status !== 'success') {
    return (
      <Page title="Articles" description={pageDescription}>
        {state.status === 'loading' ? (
          <PageSkeleton label="Chargement des articles…" />
        ) : (
          <Alert variant="error" title="Les articles n'ont pas pu être chargés.">
            Rechargez la page pour réessayer.
          </Alert>
        )}
      </Page>
    )
  }

  const mine = state.data.filter((article) => article.authorId === currentUserId)
  const shown = active === 'mes-articles' ? mine : state.data

  return (
    <Page title="Articles" description={pageDescription} action={action}>
      <Tabs label="Articles" tabs={tabs} active={active} onChange={setActive} />
      <div
        id={tabPanelId(active)}
        role="tabpanel"
        aria-labelledby={tabId(active)}
        className="animate-enter"
      >
        <Card>
          {shown.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <p className="text-sm text-muted">
                {active === 'mes-articles'
                  ? 'Vous n’avez pas encore rédigé d’article.'
                  : 'Aucun article publié pour le moment.'}
              </p>
              {action}
            </div>
          ) : (
            <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {shown.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </ul>
          )}
        </Card>
      </div>
    </Page>
  )
}
