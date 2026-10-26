import { MAIN_DOCTOR_ID } from '@/demo/seed/people'
import { at } from '@/demo/time'
import type { Article } from '@/features/articles/types/article'

/*
 * Conseils généraux rédigés pour le jeu de données. Ils restent prudents et renvoient vers le
 * médecin : eCare+ ne pose aucun diagnostic et ne remplace pas une consultation.
 */
export const articles: Article[] = [
  {
    id: 'art-glycemie',
    authorId: MAIN_DOCTOR_ID,
    authorName: 'Dr Kofi Agbeko',
    title: 'Bien mesurer sa glycémie à la maison',
    category: 'diabete',
    summary: 'Les gestes simples pour obtenir une mesure fiable et la transmettre à votre médecin.',
    content:
      'Une mesure fiable commence par des mains propres et sèches : lavez-les à l’eau et au savon, sans alcool, puis séchez-les bien. Un reste de sucre sur le doigt suffit à fausser le résultat.\n\nPiquez sur le côté du bout du doigt plutôt qu’au centre : c’est moins douloureux. Changez de doigt d’une mesure à l’autre.\n\nNotez le moment de la mesure : à jeun le matin, ou deux heures après un repas. Ces deux valeurs ne s’interprètent pas de la même façon, et l’application vous demande de les distinguer.\n\nSi une valeur vous paraît inhabituelle, refaites la mesure avant de vous inquiéter. En cas de malaise, de sueurs ou de confusion, suivez les consignes données par votre médecin et contactez les services d’urgence si nécessaire.',
    publishedAt: at(-34, '18:30'),
    updatedAt: at(-34, '18:00'),
  },
  {
    id: 'art-sel',
    authorId: 'med-lawson',
    authorName: 'Dr Akossiwa Lawson',
    title: 'Hypertension : réduire le sel sans perdre le goût',
    category: 'hypertension',
    summary: 'Le sel caché est partout. Quelques habitudes pour en consommer moins au quotidien.',
    content:
      'Une grande partie du sel que nous consommons ne vient pas de la salière mais des cubes d’assaisonnement, des sauces industrielles, du poisson fumé ou séché et du pain.\n\nPour relever vos plats, misez sur les aromates : ail, oignon, gingembre, citron, piment doux, herbes fraîches. Réduisez progressivement la quantité de cubes : le goût s’habitue en quelques semaines.\n\nGoûtez avant de saler à table, et évitez d’ajouter du sel en fin de cuisson par habitude.\n\nCes conseils complètent votre traitement : ne modifiez jamais vos médicaments sans l’avis de votre médecin.',
    publishedAt: at(-21, '12:15'),
    updatedAt: at(-21, '12:00'),
  },
  {
    id: 'art-marche',
    authorId: 'med-amouzou',
    authorName: 'Dr Yao Amouzou',
    title: 'Trente minutes de marche, un vrai traitement',
    category: 'activite_physique',
    summary:
      'L’activité physique régulière aide à équilibrer la glycémie et la tension. Par où commencer ?',
    content:
      'Marcher d’un bon pas trente minutes par jour, cinq jours par semaine, est l’un des gestes les plus utiles pour votre santé. Vous pouvez fractionner : trois fois dix minutes comptent aussi.\n\nChoisissez les heures fraîches, le matin tôt ou en fin de journée, et buvez de l’eau avant et après.\n\nSi vous êtes sous insuline ou sous certains traitements du diabète, mesurez votre glycémie avant de partir et gardez du sucre sur vous.\n\nAvant de reprendre une activité plus intense, parlez-en à votre médecin, surtout en cas de douleur dans la poitrine ou d’essoufflement inhabituel.',
    publishedAt: at(-12, '09:00'),
    updatedAt: at(-12, '08:30'),
  },
  {
    id: 'art-traitement',
    authorId: MAIN_DOCTOR_ID,
    authorName: 'Dr Kofi Agbeko',
    title: 'Ne pas oublier son traitement : les rappels de l’application',
    category: 'traitement',
    summary: 'Comment les rappels de prise vous aident, et pourquoi votre réponse compte.',
    content:
      'À chaque heure de prise, l’application vous envoie un rappel, même sans connexion internet. Répondez « Pris » une fois le médicament avalé, ou « Reporter » si vous le prendrez un peu plus tard.\n\nVos réponses permettent à votre médecin de suivre l’observance, c’est-à-dire la régularité de vos prises. Un traitement pris irrégulièrement peut sembler inefficace alors qu’il ne l’est pas.\n\nSi un effet indésirable vous gêne, ne l’arrêtez pas de vous-même : écrivez à votre médecin dans la messagerie de l’application.',
    publishedAt: at(-4, '19:20'),
    updatedAt: at(-4, '19:00'),
  },
  {
    id: 'art-ramadan',
    authorId: MAIN_DOCTOR_ID,
    authorName: 'Dr Kofi Agbeko',
    title: 'Diabète et période de jeûne : se préparer avec son médecin',
    category: 'diabete',
    summary: 'Avant un jeûne, un échange avec votre médecin permet d’adapter le traitement.',
    content:
      'Le jeûne modifie les horaires des repas et peut exposer à des hypoglycémies, surtout sous insuline.\n\nPrenez rendez-vous quelques semaines avant pour faire le point sur votre traitement et vos horaires de prise.',
    publishedAt: at(-1, '22:10'),
    updatedAt: at(-1, '22:10'),
  },
]
