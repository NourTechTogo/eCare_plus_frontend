import { requireDoctor } from '@/demo/access'
import { mutate, PlatformError, query, type Database } from '@/demo/database'
import { currentAccount, displayName } from '@/demo/session'
import type { Article, ArticleInput } from '@/features/articles/types/article'

/*
 * Articles de conseils publiés par les médecins et lus par les patients dans l'application (EF-W3-15).
 * Un article est publié dès son envoi. Routes attendues : GET|POST /articles,
 * GET|PUT|DELETE /articles/{id} (voir docs/CONTRAT_API.md).
 */

/** Articles de tous les médecins de la plateforme. */
function visibleArticles(db: Database) {
  currentAccount(db)
  return db.articles
}

function ownArticle(db: Database, id: string) {
  const doctor = requireDoctor(db)
  const article = db.articles.find((candidate) => candidate.id === id)
  if (!article || article.authorId !== doctor.id) throw new PlatformError('Article introuvable')
  return article
}

/** Du plus récemment publié au plus ancien. */
export async function listArticles(): Promise<Article[]> {
  return query((db) =>
    [...visibleArticles(db)].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)),
  )
}

export async function getArticle(id: string): Promise<Article | undefined> {
  return query((db) => visibleArticles(db).find((article) => article.id === id))
}

/** Nouvel article, publié tout de suite. */
export async function createArticle(input: ArticleInput): Promise<Article> {
  return mutate((db) => {
    const doctor = requireDoctor(db)
    const now = new Date().toISOString()
    const article: Article = {
      ...input,
      id: `art-${crypto.randomUUID().slice(0, 8)}`,
      authorId: doctor.id,
      authorName: displayName(doctor),
      publishedAt: now,
      updatedAt: now,
    }
    db.articles.push(article)
    return article
  })
}

export async function updateArticle(id: string, input: ArticleInput): Promise<Article> {
  return mutate((db) => {
    const article = ownArticle(db, id)
    Object.assign(article, input, { updatedAt: new Date().toISOString() })
    return article
  })
}

export async function deleteArticle(id: string): Promise<void> {
  await mutate((db) => {
    ownArticle(db, id)
    db.articles = db.articles.filter((article) => article.id !== id)
  })
}
