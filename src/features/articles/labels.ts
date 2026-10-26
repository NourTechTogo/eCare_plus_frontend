import type { ArticleCategory } from '@/features/articles/types/article'

export const categoryLabels: Record<ArticleCategory, string> = {
  diabete: 'Diabète',
  hypertension: 'Hypertension',
  nutrition: 'Nutrition',
  activite_physique: 'Activité physique',
  traitement: 'Traitement',
  prevention: 'Prévention',
}

export const categoryTones: Record<ArticleCategory, 'blue' | 'violet' | 'green' | 'amber' | 'red'> =
  {
    diabete: 'blue',
    hypertension: 'violet',
    nutrition: 'green',
    activite_physique: 'green',
    traitement: 'amber',
    prevention: 'blue',
  }

export const TITLE_MAX_LENGTH = 120
export const SUMMARY_MAX_LENGTH = 200
export const CONTENT_MAX_LENGTH = 8000

/** Temps de lecture estimé, à raison de 200 mots par minute. */
export function readingMinutes(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

/** Paragraphes du texte : une ligne vide sépare deux paragraphes. */
export const paragraphs = (content: string) =>
  content
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
