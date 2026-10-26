import { getArticle, listArticles } from '@/features/articles/services/articleService'
import { useAsyncData } from '@/hooks/useAsyncData'

export function useArticles() {
  return useAsyncData('articles', listArticles)
}

/** `data` vaut `null` quand aucun article visible ne porte cet identifiant. */
export function useArticle(id: string | undefined) {
  return useAsyncData(`article:${id ?? ''}`, async () =>
    id ? ((await getArticle(id)) ?? null) : null,
  )
}
