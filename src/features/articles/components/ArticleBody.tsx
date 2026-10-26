import { Badge } from '@/components/ui/Badge'
import {
  categoryLabels,
  categoryTones,
  paragraphs,
  readingMinutes,
} from '@/features/articles/labels'
import type { ArticleInput } from '@/features/articles/types/article'

interface ArticleBodyProps {
  article: ArticleInput
  authorName: string
  /** Date de publication, ou mention d'un aperçu. */
  dateLabel: string
}

/** Article tel que les patients le lisent dans l'application. */
export function ArticleBody({ article, authorName, dateLabel }: ArticleBodyProps) {
  return (
    <article className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={categoryTones[article.category]}>{categoryLabels[article.category]}</Badge>
        <span className="text-xs text-muted">{readingMinutes(article.content)} min de lecture</span>
      </div>
      <h2 className="font-display text-2xl leading-tight font-bold text-ink sm:text-3xl">
        {article.title || 'Titre de l’article'}
      </h2>
      {article.summary && <p className="text-base leading-relaxed text-muted">{article.summary}</p>}
      <p className="text-sm font-semibold text-ink">
        {authorName} <span className="font-normal text-muted">· {dateLabel}</span>
      </p>
      <div className="flex flex-col gap-4 border-t border-line pt-5">
        {paragraphs(article.content).map((paragraph, index) => (
          <p key={index} className="text-base leading-relaxed whitespace-pre-line text-ink">
            {paragraph}
          </p>
        ))}
      </div>
      <p className="rounded-2xl bg-page px-4 py-3 text-xs text-muted">
        Ces conseils ne remplacent pas l'avis de votre médecin. En cas d'urgence, contactez les
        services d'urgence.
      </p>
    </article>
  )
}
