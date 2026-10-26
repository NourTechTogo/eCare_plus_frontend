export type ArticleCategory =
  'diabete' | 'hypertension' | 'nutrition' | 'activite_physique' | 'traitement' | 'prevention'

/**
 * Conseil ou bonne pratique rédigé par un médecin, lisible par les patients (EF-W3-15).
 * Un article est publié dès son envoi : il n'y a pas de brouillon.
 */
export interface ArticleInput {
  title: string
  category: ArticleCategory
  /** Accroche affichée dans la liste des articles. */
  summary: string
  /** Texte de l'article ; une ligne vide sépare deux paragraphes. */
  content: string
}

export interface Article extends ArticleInput {
  id: string
  authorId: string
  authorName: string
  publishedAt: string
  updatedAt: string
}
