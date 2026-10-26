import type { ConversationRecord } from '@/demo/database'
import { MAIN_DOCTOR_ID } from '@/demo/seed/people'
import { at, minutesAgo } from '@/demo/time'
import type { CallRecord } from '@/features/messaging/types/call'
import type { Message } from '@/features/messaging/types/message'

export const conversations: ConversationRecord[] = [
  { id: 'conv-adjovi', patientId: 'pat-adjovi', doctorId: MAIN_DOCTOR_ID },
  { id: 'conv-akakpo', patientId: 'pat-akakpo', doctorId: MAIN_DOCTOR_ID },
  { id: 'conv-gbeassor', patientId: 'pat-gbeassor', doctorId: MAIN_DOCTOR_ID },
  { id: 'conv-sossou', patientId: 'pat-sossou', doctorId: MAIN_DOCTOR_ID },
  { id: 'conv-amegah', patientId: 'pat-amegah', doctorId: MAIN_DOCTOR_ID },
  { id: 'conv-kpodar', patientId: 'pat-kpodar', doctorId: 'med-lawson' },
]

type MessageSeed = Omit<Message, 'id'>

const message = (
  conversationId: string,
  author: Message['author'],
  sentAt: string,
  text: string,
  read = true,
): MessageSeed => ({
  conversationId,
  author,
  sentAt,
  text,
  readAt: read ? new Date(new Date(sentAt).getTime() + 12 * 60_000).toISOString() : undefined,
})

export const messages: Message[] = [
  message(
    'conv-adjovi',
    'professionnel',
    at(-6, '18:40'),
    'Bonsoir M. Adjovi, vos glycémies du soir sont un peu plus hautes cette semaine. Pouvez-vous noter ce que vous mangez le soir pendant quelques jours ?',
  ),
  message(
    'conv-adjovi',
    'patient',
    at(-6, '19:55'),
    'Bonsoir docteur, c’est noté. Je le mettrai dans les notes de l’application.',
  ),
  message(
    'conv-adjovi',
    'patient',
    at(-1, '21:00'),
    'Docteur, ma glycémie était haute ce soir, c’était un repas de fête chez ma fille.',
  ),
  message(
    'conv-adjovi',
    'professionnel',
    at(-1, '21:30'),
    'Merci de m’avoir prévenu. Refaites une mesure demain matin à jeun et transmettez-la.',
  ),
  message(
    'conv-adjovi',
    'patient',
    minutesAgo(95),
    'Bonjour docteur, la tension de ce matin est à 15/9. Je dois m’inquiéter ?',
    false,
  ),
  message(
    'conv-akakpo',
    'professionnel',
    at(-20, '10:40'),
    'Bonjour M. Akakpo, j’ai ajusté vos seuils de tension. Continuez la mesure chaque matin.',
  ),
  message('conv-akakpo', 'patient', at(-20, '11:02'), 'Bien reçu docteur, merci.'),
  message(
    'conv-akakpo',
    'patient',
    minutesAgo(40),
    'Docteur, j’ai mal à la tête depuis ce matin et la tension est très haute.',
    false,
  ),
  message(
    'conv-gbeassor',
    'patient',
    at(-1, '18:40'),
    'Bonsoir docteur, j’ai le cœur qui bat vite depuis cet après-midi.',
  ),
  message(
    'conv-gbeassor',
    'professionnel',
    at(-1, '19:05'),
    'Bonsoir Mme Gbeassor. Asseyez-vous au calme dix minutes puis reprenez votre pouls. S’il reste au-dessus de 120 ou si vous avez une douleur dans la poitrine, rendez-vous aux urgences.',
  ),
  message(
    'conv-gbeassor',
    'patient',
    minutesAgo(180),
    'Ce matin ma glycémie est à 2,06. La fièvre a un peu baissé.',
    false,
  ),
  message(
    'conv-sossou',
    'patient',
    at(-8, '11:30'),
    'Docteur, j’ai fait un malaise ce matin, j’avais sauté le petit déjeuner.',
  ),
  message(
    'conv-sossou',
    'professionnel',
    at(-8, '12:55'),
    'Vous avez bien fait de vous resucrer. Ne sautez pas de repas après l’injection. Je vous ai laissé une note dans votre dossier.',
  ),
  message('conv-sossou', 'patient', at(-8, '13:10'), 'D’accord, merci beaucoup docteur.'),
  message(
    'conv-amegah',
    'professionnel',
    at(-5, '09:15'),
    'Bonjour M. Amegah, la glycémie de ce matin est un peu élevée. Avez-vous dîné tard hier ?',
  ),
  message('conv-amegah', 'patient', at(-5, '09:48'), 'Oui docteur, vers 23 h. Je ferai attention.'),
  message(
    'conv-kpodar',
    'patient',
    at(-2, '08:30'),
    'Bonjour docteure, je voulais confirmer mon rendez-vous de la semaine prochaine.',
  ),
].map((seed, index) => ({ ...seed, id: `msg-${String(index + 1).padStart(3, '0')}` }))

export const calls: CallRecord[] = [
  {
    id: 'call-1',
    conversationId: 'conv-adjovi',
    type: 'audio',
    initiator: 'professionnel',
    startedAt: at(-2, '07:05'),
    durationSeconds: 252,
  },
  {
    id: 'call-2',
    conversationId: 'conv-sossou',
    type: 'video',
    initiator: 'patient',
    startedAt: at(-8, '12:30'),
    durationSeconds: 418,
  },
  {
    id: 'call-3',
    conversationId: 'conv-akakpo',
    type: 'audio',
    initiator: 'professionnel',
    startedAt: at(-3, '16:20'),
  },
]
