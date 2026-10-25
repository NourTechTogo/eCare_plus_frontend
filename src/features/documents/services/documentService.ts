import { apiRequest, apiUpload, downloadPrivate } from '@/lib/apiClient'
export interface DocumentDto { id:string; titre:string; typeDocument:string; dateDocument:string; nomOriginal:string; tailleOctets:number }
export interface DocumentPage { content:DocumentDto[]; totalPages:number; totalElements:number }
export const documentTypes = {ORDONNANCE:'Ordonnance',RESULTAT_ANALYSE:'Résultat d’analyse',COMPTE_RENDU:'Compte rendu',CARNET:'Carnet',AUTRE:'Autre'}
export const listDocuments = (patientId:string,page=0) => apiRequest<DocumentPage>(`/portail/patients/${patientId}/documents?page=${page}&size=20&sort=dateCreation,desc`)
export const downloadDocument = (patientId:string,document:DocumentDto) => downloadPrivate(`/portail/patients/${patientId}/documents/${document.id}/contenu`,document.nomOriginal)
export function uploadDocument(patientId:string,file:File,title:string,type:string,date:string,sourceRef:string) {
  if (!file.size || file.size>5*1024*1024) throw new Error('Choisissez un fichier non vide de 5 Mo maximum.')
  if (!/\.(pdf|jpe?g|png)$/i.test(file.name)) throw new Error('Formats autorisés : PDF, JPG et PNG.')
  const form=new FormData()
  form.set('fichier',file); form.set('titre',title.trim());form.set('typeDocument',type);form.set('dateDocument',date);form.set('sourceRef',sourceRef)
  return apiUpload<DocumentDto>(`/portail/patients/${patientId}/documents`,form)
}
