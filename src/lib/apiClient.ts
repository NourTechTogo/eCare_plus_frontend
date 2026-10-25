import { API_BASE_URL } from '@/config/api'
export class ApiError extends Error { readonly status: number; constructor(status: number, message: string) { super(message); this.status = status } }
let accessToken: string | null = null
let revision = 0
let onUnauthorized: (() => void) | null = null
export const sessionRevision = () => revision
export function setAccessToken(token: string | null) { revision++; accessToken = token }
export function setUnauthorizedHandler(handler: (() => void) | null) { onUnauthorized = handler }
interface RequestOptions { method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; body?: unknown; anonymous?: boolean }
export async function apiRequest<T>(path: string, { method = 'GET', body, anonymous = false }: RequestOptions = {}): Promise<T> {
  const version = revision
  const token = anonymous ? null : accessToken
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`
  const response = await fetch(`${API_BASE_URL}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
  const text = await response.text()
  if (version !== revision) throw new ApiError(409, 'Session modifiée. Reconnectez-vous.')
  let data: unknown
  try { data = text ? JSON.parse(text) : undefined } catch { if (response.ok) throw new ApiError(response.status, 'Réponse serveur invalide.') }
  if (!response.ok) {
    if (response.status === 401 && token) onUnauthorized?.()
    const problem = data as { erreurs?: { champ: string; message: string }[]; detail?: string } | undefined
    const fields = Array.isArray(problem?.erreurs) ? problem.erreurs.map(e => `${e.champ} : ${e.message}`).join(' ; ') : undefined
    throw new ApiError(response.status, fields || problem?.detail || response.statusText || `Erreur HTTP ${response.status}`)
  }
  return data as T
}
export async function apiCollection<T>(path: string): Promise<T[]> {
  const version = revision
  const items: T[] = []
  for (let page = 0; ; page++) {
    const result = await apiRequest<{ content: T[]; totalPages: number }>(`${path}${path.includes('?') ? '&' : '?'}page=${page}&size=100`)
    if (version !== revision) throw new ApiError(409, 'Session modifiée.')
    if (!result || !Array.isArray(result.content) || !Number.isInteger(result.totalPages) || result.totalPages < 0) throw new ApiError(502, 'Pagination serveur invalide.')
    items.push(...result.content)
    if (page + 1 >= result.totalPages) return items
  }
}

async function privateTransfer(path: string, form?: FormData): Promise<Response> {
  const version = revision
  const token = accessToken
  if (!token) throw new ApiError(401, 'Reconnectez-vous pour accéder au fichier.')
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: form ? 'POST' : 'GET', headers: { Authorization: `Bearer ${token}` },
    body: form, cache: 'no-store',
  })
  if (version !== revision) throw new ApiError(409, 'Session modifiée. Reconnectez-vous.')
  if (!response.ok) {
    if (response.status === 401) onUnauthorized?.()
    const problem = await response.json().catch(() => null) as { detail?: string } | null
    throw new ApiError(response.status, problem?.detail || `Transfert refusé (${response.status}).`)
  }
  return response
}
export async function apiUpload<T>(path: string, form: FormData): Promise<T> {
  const file=form.get('fichier')
  if(file instanceof File){
    const extension=file.name.split('.').at(-1)?.toLowerCase()
    const mime=extension==='pdf'?'application/pdf':extension==='jpg'||extension==='jpeg'?'image/jpeg':extension==='png'?'image/png':undefined
    if(mime&&file.type!==mime)form.set('fichier',new File([file],file.name,{type:mime,lastModified:file.lastModified}))
  }
  const version = revision
  const data: T = await (await privateTransfer(path, form)).json()
  if (version !== revision) throw new ApiError(409, 'Session modifiée.')
  return data
}
export async function apiBlob(path: string): Promise<Blob> {
  const version = revision
  const data = await (await privateTransfer(path)).blob()
  if (version !== revision) throw new ApiError(409, 'Session modifiée.')
  return data
}
export async function downloadPrivate(path: string, name: string): Promise<void> {
  const blob = await apiBlob(path)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url; link.download = name; link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
