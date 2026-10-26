import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Page } from '@/components/layouts/Page'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { SelectField } from '@/components/ui/SelectField'
import { PageSkeleton } from '@/components/ui/Skeleton'
import { TextareaField } from '@/components/ui/TextareaField'
import { TextField } from '@/components/ui/TextField'
import { ArticleBody } from '@/features/articles/components/ArticleBody'
import { useArticle } from '@/features/articles/hooks/useArticles'
import {
  categoryLabels,
  CONTENT_MAX_LENGTH,
  SUMMARY_MAX_LENGTH,
  TITLE_MAX_LENGTH,
} from '@/features/articles/labels'
import { createArticle, updateArticle } from '@/features/articles/services/articleService'
import type { Article, ArticleCategory, ArticleInput } from '@/features/articles/types/article'
import { useFeedback } from '@/hooks/useFeedback'

const categoryOptions = Object.entries(categoryLabels).map(([value, label]) => ({ value, label }))
const backLink = { to: '/articles', label: 'Retour aux articles' }

type Field = keyof ArticleInput

function validate(values: Record<Field, string>) {
  const errors: Partial<Record<Field, string>> = {}
  if (values.title.trim().length < 5) errors.title = 'Donnez un titre d’au moins 5 caractères.'
  if (!values.category) errors.category = 'Choisissez une catégorie.'
  if (values.summary.trim().length < 10)
    errors.summary = 'Résumez l’article en une ou deux phrases.'
  if (values.content.trim().length < 50)
    errors.content = 'Le texte doit compter au moins 50 caractères.'
  return errors
}

function Editor({ article, authorName }: { article?: Article; authorName: string }) {
  const navigate = useNavigate()
  const feedback = useFeedback()
  const [values, setValues] = useState<Record<Field, string>>({
    title: article?.title ?? '',
    category: article?.category ?? '',
    summary: article?.summary ?? '',
    content: article?.content ?? '',
  })
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({})
  const [saving, setSaving] = useState(false)

  const bind = (field: Field) => ({
    value: values[field],
    error: errors[field],
    onChange: (event: { target: { value: string } }) => {
      setValues((current) => ({ ...current, [field]: event.target.value }))
      if (errors[field]) setErrors(({ [field]: _fixed, ...rest }) => rest)
    },
  })

  const save = async () => {
    const nextErrors = validate(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    const input: ArticleInput = {
      title: values.title.trim(),
      category: values.category as ArticleCategory,
      summary: values.summary.trim(),
      content: values.content.trim(),
    }
    setSaving(true)
    try {
      const saved = article ? await updateArticle(article.id, input) : await createArticle(input)
      feedback.success(
        article ? 'Article modifié' : 'Article publié',
        'Les patients peuvent le lire dans l’application.',
      )
      await navigate(`/articles/${saved.id}`)
    } catch {
      feedback.error("L'article n'a pas pu être enregistré", 'Votre texte est conservé. Réessayez.')
      setSaving(false)
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void save()
  }

  return (
    <div className="grid items-start gap-6 xl:grid-cols-2">
      <Card title="Rédaction">
        <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
          <fieldset disabled={saving} className="flex min-w-0 flex-col gap-5">
            <TextField label="Titre" required maxLength={TITLE_MAX_LENGTH} {...bind('title')} />
            <SelectField
              label="Catégorie"
              required
              placeholder="Choisir"
              options={categoryOptions}
              {...bind('category')}
            />
            <TextareaField
              label="Résumé"
              required
              rows={2}
              maxLength={SUMMARY_MAX_LENGTH}
              hint="Affiché dans la liste des articles de l’application."
              {...bind('summary')}
            />
            <TextareaField
              label="Texte"
              required
              rows={14}
              maxLength={CONTENT_MAX_LENGTH}
              hint="Séparez les paragraphes par une ligne vide. Restez général : un article ne pose pas de diagnostic."
              {...bind('content')}
            />
          </fieldset>
          <div className="flex flex-wrap justify-end gap-3">
            <Button type="submit" loading={saving}>
              {article ? 'Enregistrer les modifications' : 'Publier'}
            </Button>
          </div>
        </form>
      </Card>
      <Card title="Aperçu pour les patients">
        <ArticleBody
          article={{ ...values, category: (values.category || 'prevention') as ArticleCategory }}
          authorName={authorName}
          dateLabel="aperçu"
        />
      </Card>
    </div>
  )
}

/** Rédaction d'un nouvel article, ou modification d'un des siens. */
export function ArticleEditorPage({ authorName }: { authorName: string }) {
  const { articleId } = useParams()
  const state = useArticle(articleId)
  const title = articleId ? 'Modifier l’article' : 'Rédiger un article'

  if (!articleId) {
    return (
      <Page
        title={title}
        description="Un conseil clair et général, publié dès l’envoi"
        backLink={backLink}
      >
        <Editor authorName={authorName} />
      </Page>
    )
  }

  return (
    <Page title={title} backLink={{ to: `/articles/${articleId}`, label: 'Retour à l’article' }}>
      {state.status === 'loading' ? (
        <PageSkeleton label="Chargement de l'article…" />
      ) : state.status === 'error' || !state.data ? (
        <Alert variant="error" title="Cet article est introuvable.">
          Revenez à la liste des articles.
        </Alert>
      ) : (
        <Editor article={state.data} authorName={authorName} />
      )}
    </Page>
  )
}
