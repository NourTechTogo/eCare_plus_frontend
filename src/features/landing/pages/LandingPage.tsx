import type { ReactNode } from 'react'
import { Link } from 'react-router'
import doctorPhoto from '@/assets/landing/medecin-telephone.jpg'
import portalPhoto from '@/assets/landing/saisie-portail.jpg'
import monitorPhoto from '@/assets/landing/tensiometre.jpg'
import logoMark from '@/assets/logo-mark.png'
import { buttonClassName } from '@/components/ui/styles'
import {
  AlertCard,
  AlertsPreview,
  GlycemiaCard,
  NotePreview,
  RecordPreview,
  TrendPreview,
} from '@/features/landing/components/LandingPreviews'

const container = 'mx-auto w-full max-w-7xl px-4 sm:px-8 lg:px-12'
/** Bande pleine largeur : chaque section occupe toute la largeur de l'écran. */
const band = 'py-20 sm:py-28'
const panel = 'rounded-3xl bg-surface shadow-lg shadow-primary/10'
const sectionTitle =
  'font-display text-3xl leading-tight font-bold text-ink sm:text-4xl sm:leading-tight'
const sectionIntro = 'mt-4 text-lg leading-relaxed text-muted'
const eyebrow = 'text-sm font-bold tracking-widest text-primary-strong uppercase'
/** Décalage d'ancre : la barre de navigation reste affichée en haut de l'écran. */
const anchorOffset = 'scroll-mt-16'
const footerLinkClassName =
  'text-sm text-line hover:text-white focus-visible:outline-2 focus-visible:outline-white'
const navLinkClassName =
  'text-sm font-medium text-muted hover:text-primary-strong focus-visible:outline-2 focus-visible:outline-primary'

/* Tracés des pictogrammes, sur une grille de 24 × 24. */
const icons = {
  droplet: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z',
  pulse: 'M3 12h4l2.5-6 4 12 2.5-6h5',
  scale:
    'M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1ZM8.5 10.500a3.5 3.5 0 0 1 7 0ZM12 10.500l1.5-2.5',
  heart: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.600A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z',
  bell: 'M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15L6 16ZM10 20.500a2 2 0 0 0 4 0',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z',
  folder: 'M3 6a1 1 0 0 1 1-1h5l2 2h8a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6Z',
  cross: 'M9.5 3.500h5v6h6v5h-6v6h-5v-6h-6v-5h6v-6Z',
  check: 'm5 12 5 5 9-10',
  arrow: 'M5 12h14M13 6l6 6-6 6',
}

type IconName = keyof typeof icons

function Icon({ name, className = 'size-6' }: { name: IconName; className?: string }) {
  return (
    <svg
      className={`shrink-0 ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={icons[name]} />
    </svg>
  )
}

function IconTile({ name }: { name: IconName }) {
  return (
    <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary-strong">
      <Icon name={name} />
    </span>
  )
}

const sectionLinks = [
  { href: '#plateforme', label: 'La plateforme' },
  { href: '#mesures', label: 'Les mesures' },
  { href: '#portail', label: 'Le portail' },
  { href: '#roles', label: 'Les rôles' },
  { href: '#questions', label: 'Questions' },
]

const keyFacts: { icon: IconName; label: string; value: string }[] = [
  { icon: 'heart', label: 'Pathologies suivies', value: 'Diabète et hypertension' },
  { icon: 'pulse', label: 'Mesures', value: 'Glycémie, tension, poids, pouls' },
  { icon: 'bell', label: 'Alertes', value: 'Classées par priorité' },
  { icon: 'lock', label: 'Accès', value: 'Réservé aux professionnels' },
]

const platformPoints = [
  'Les dossiers des patients réunis au même endroit',
  "Les mesures et leur évolution, lisibles d'un coup d'œil",
  'Les situations à vérifier signalées par une alerte',
]

const measures: { icon: IconName; name: string; detail: string }[] = [
  { icon: 'droplet', name: 'Glycémie', detail: 'À jeun et post-prandiale, en g/L' },
  { icon: 'pulse', name: 'Tension artérielle', detail: 'Systolique et diastolique, en mmHg' },
  { icon: 'scale', name: 'Poids', detail: 'En kilogrammes' },
  { icon: 'heart', name: 'Fréquence cardiaque', detail: 'En battements par minute' },
]

const steps = [
  {
    title: 'Le dossier est créé',
    text: "Le personnel de l'établissement enregistre le patient et lui affecte un médecin référent.",
  },
  {
    title: 'Les mesures arrivent',
    text: 'Les relevés de glycémie et de tension artérielle sont ajoutés au dossier.',
  },
  {
    title: 'Les écarts sont signalés',
    text: "Une alerte apparaît lorsqu'une mesure dépasse le seuil de suivi.",
  },
  {
    title: 'Le médecin fait le point',
    text: "Il consulte l'évolution, vérifie l'alerte et consigne ses observations.",
  },
]

const portalFeatures: { title: string; text: string; preview: ReactNode }[] = [
  {
    title: "Des courbes pour lire l'évolution",
    text: "Chaque mesure s'affiche dans le temps, avec le seuil d'alerte en repère.",
    preview: <TrendPreview />,
  },
  {
    title: 'Une file des alertes',
    text: 'Les mesures qui dépassent un seuil sont regroupées, les plus prioritaires en premier.',
    preview: <AlertsPreview />,
  },
  {
    title: 'Un dossier par patient',
    text: 'Informations administratives, pathologies suivies et historique des mesures.',
    preview: <RecordPreview />,
  },
  {
    title: 'Des observations consignées',
    text: "Le médecin note ses observations dans le dossier et à la clôture d'une alerte.",
    preview: <NotePreview />,
  },
]

const roles: { icon: IconName; name: string; summary: string; home: string; tasks: string[] }[] = [
  {
    icon: 'lock',
    name: 'Administrateur',
    summary: 'Gère les accès au portail.',
    home: 'Médecins',
    tasks: [
      'Créer les comptes des médecins',
      'Créer les comptes du personnel',
      'Désactiver un compte qui ne doit plus servir',
    ],
  },
  {
    icon: 'folder',
    name: "Personnel de l'établissement",
    summary: 'Tient à jour les dossiers des patients.',
    home: 'Liste des patients',
    tasks: [
      'Créer un dossier patient et affecter son médecin référent',
      'Référencer un patient inscrit depuis l’application',
      'Modifier les informations administratives',
    ],
  },
  {
    icon: 'cross',
    name: 'Médecin',
    summary: 'Assure le suivi médical des patients.',
    home: 'Tableau de bord',
    tasks: [
      'Consulter les dossiers et les mesures enregistrées',
      "Suivre l'évolution de la glycémie et de la tension",
      'Traiter les alertes et noter ses observations',
    ],
  },
]

const commitments = [
  {
    title: 'Un accès réservé',
    text: 'Le portail est destiné aux professionnels de santé et au personnel autorisé, avec des identifiants professionnels.',
  },
  {
    title: 'Le secret médical',
    text: "Chaque utilisateur s'engage à respecter le secret médical et la protection des données de santé des patients.",
  },
  {
    title: 'Un outil de suivi, pas de diagnostic',
    text: "Les alertes signalent des mesures à vérifier. L'interprétation et les décisions médicales reviennent toujours au professionnel de santé.",
  },
]

const questions = [
  {
    question: "À qui s'adresse eCare+ ?",
    answer:
      'Aux professionnels de santé et au personnel autorisé des structures sanitaires qui suivent des patients vivant avec un diabète ou une hypertension.',
  },
  {
    question: 'Quelles mesures peut-on suivre ?',
    answer:
      'La glycémie, à jeun et post-prandiale, la tension artérielle, le poids et la fréquence cardiaque.',
  },
  {
    question: 'eCare+ pose-t-il un diagnostic ?',
    answer:
      "Non. eCare+ affiche les mesures et signale celles qui dépassent un seuil de suivi. L'analyse et la décision restent celles du médecin.",
  },
  {
    question: 'Tout le monde voit-il les mêmes écrans ?',
    answer:
      "Non. L'administrateur gère les comptes, le personnel de l'établissement crée les dossiers et affecte le médecin référent. Le médecin consulte les dossiers, les mesures et les alertes pour assurer le suivi médical.",
  },
]

const currentYear = new Date().getFullYear()

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <img src={logoMark} alt="" className="size-10" />
      <span className="font-display text-2xl font-extrabold text-primary">ecare+</span>
    </div>
  )
}

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="sticky top-0 z-20 border-b border-line bg-surface">
        <div className={`${container} flex items-center justify-between gap-8 py-4`}>
          <Brand />
          <nav aria-label="Sections de la page" className="hidden lg:block">
            <ul className="flex gap-9">
              {sectionLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className={navLinkClassName}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <Link to="/connexion" className={buttonClassName('primary', 'md')}>
            Se connecter
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden lg:flex lg:min-h-[min(calc(100dvh-4.5rem),60rem)] lg:items-center">
          <img
            src={doctorPhoto}
            alt="Médecin en blouse blanche consultant son téléphone"
            className="h-64 w-full object-cover sm:h-80 lg:absolute lg:inset-y-0 lg:right-0 lg:h-full lg:w-[55%]"
          />
          {/* Fondu de la photo vers le fond blanc, pour garder le texte lisible. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 hidden bg-linear-to-r from-surface from-45% via-surface/70 via-58% to-transparent to-72% lg:block"
          />
          <div className="absolute top-16 right-12 hidden lg:block">
            <GlycemiaCard />
          </div>
          <div className="absolute bottom-20 left-1/2 hidden lg:block">
            <AlertCard />
          </div>

          <div className={`${container} relative py-12 lg:py-24`}>
            <div className="flex flex-col items-start gap-7 lg:max-w-2xl">
              <h1 className="font-display text-4xl leading-tight font-bold text-ink sm:text-6xl sm:leading-tight">
                Suivez vos patients <span className="text-primary">entre deux consultations</span>
              </h1>
              <p className="max-w-lg text-xl leading-relaxed text-muted">
                eCare+ accompagne les équipes de santé dans le suivi des personnes vivant avec un
                diabète ou une hypertension.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link to="/connexion" className={buttonClassName('primary', 'lg')}>
                  Se connecter au portail
                </Link>
                <a href="#plateforme" className={buttonClassName('soft', 'lg')}>
                  Découvrir la plateforme
                </a>
              </div>
            </div>
          </div>
        </section>

        <div className="border-y border-line">
          <dl className={`${container} grid gap-6 py-8 sm:grid-cols-2 lg:grid-cols-4`}>
            {keyFacts.map((fact) => (
              <div key={fact.label} className="flex items-center gap-3">
                <IconTile name={fact.icon} />
                <div>
                  <dt className="text-xs font-semibold text-muted">{fact.label}</dt>
                  <dd className="text-sm font-semibold text-ink">{fact.value}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>

        <section id="plateforme" className={`${band} ${anchorOffset} bg-primary-soft`}>
          <div className={`${container} grid items-center gap-10 lg:grid-cols-2 lg:gap-20`}>
            <img
              src={portalPhoto}
              alt="Professionnel de santé saisissant des informations sur un ordinateur portable, un stéthoscope posé à côté"
              className="aspect-4/3 w-full rounded-3xl object-cover shadow-lg shadow-primary/10"
            />
            <div>
              <p className={eyebrow}>La plateforme</p>
              <h2 className={`mt-3 ${sectionTitle}`}>
                Un seul portail pour <span className="text-primary">tout le suivi</span>
              </h2>
              <p className={sectionIntro}>
                eCare+ rassemble ce dont l'équipe a besoin pour suivre un patient chronique dans la
                durée, sans passer d'un outil à l'autre.
              </p>
              <ul className="mt-6 flex flex-col gap-3">
                {platformPoints.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-ink">
                    <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                      <Icon name="check" className="size-3.5" />
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
              <a href="#portail" className={`mt-8 ${buttonClassName('primary', 'lg')}`}>
                Voir le portail
              </a>
            </div>
          </div>
        </section>

        <section id="mesures" className={`${band} ${anchorOffset}`}>
          <div className={`${container} grid items-center gap-10 lg:grid-cols-2 lg:gap-20`}>
            <div>
              <h2 className={sectionTitle}>
                Les mesures qui comptent,{' '}
                <span className="text-primary">suivies dans le temps</span>
              </h2>
              <p className={sectionIntro}>
                Chaque relevé est daté et rattaché au dossier du patient. Le médecin voit la
                dernière valeur et la tendance.
              </p>
              <ul className="mt-8 grid gap-4 sm:grid-cols-2">
                {measures.map((measure) => (
                  <li
                    key={measure.name}
                    className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5"
                  >
                    <IconTile name={measure.icon} />
                    <div>
                      <h3 className="font-display text-base font-bold text-ink">{measure.name}</h3>
                      <p className="mt-1 text-sm text-muted">{measure.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <img
              src={monitorPhoto}
              alt="Prise de tension artérielle avec un tensiomètre électronique au bras"
              className="aspect-4/3 w-full rounded-3xl object-cover lg:aspect-square"
            />
          </div>
        </section>

        <section className={`${band} bg-linear-to-br from-primary to-primary-strong`}>
          <div className={container}>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-3xl leading-tight font-bold text-white sm:text-4xl">
                Comment fonctionne le suivi
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-white">
                De la création du dossier à l'observation du médecin, en quatre étapes.
              </p>
            </div>
            <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, index) => (
                <li key={step.title} className="rounded-2xl bg-white/15 p-6">
                  <p
                    aria-hidden="true"
                    className="inline-flex size-11 items-center justify-center rounded-full bg-surface font-display text-lg font-bold text-primary-strong"
                  >
                    {index + 1}
                  </p>
                  <h3 className="mt-4 font-display text-lg font-bold text-white">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="portail" className={`${band} ${anchorOffset} bg-primary-soft`}>
          <div className={container}>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className={sectionTitle}>
                Ce que vous retrouvez <span className="text-primary">dans le portail</span>
              </h2>
              <p className={sectionIntro}>
                Des écrans pensés pour aller à l'essentiel pendant le suivi.
              </p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {portalFeatures.map((feature) => (
                <article key={feature.title} className={`${panel} flex flex-col overflow-hidden`}>
                  <div className="flex flex-1 items-center bg-primary-soft-hover p-6 sm:p-10">
                    <div className="w-full">{feature.preview}</div>
                  </div>
                  <div className="p-6 sm:px-10 sm:py-8">
                    <h3 className="font-display text-xl font-bold text-ink">{feature.title}</h3>
                    <p className="mt-2 leading-relaxed text-muted">{feature.text}</p>
                  </div>
                </article>
              ))}
            </div>
            <p className="mt-6 text-center text-sm text-muted">
              Aperçus illustratifs. Toutes les données affichées sont fictives.
            </p>
          </div>
        </section>

        <section id="roles" className={`${band} ${anchorOffset}`}>
          <div className={container}>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className={sectionTitle}>
                Un espace adapté <span className="text-primary">à chaque rôle</span>
              </h2>
              <p className={sectionIntro}>
                Chaque professionnel accède uniquement aux écrans utiles à sa mission.
              </p>
            </div>
            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {roles.map((role) => (
                <article
                  key={role.name}
                  className="flex flex-col rounded-3xl border border-line bg-surface p-6 sm:p-10"
                >
                  <div className="flex items-center gap-4">
                    <IconTile name={role.icon} />
                    <div>
                      <h3 className="font-display text-xl font-bold text-ink">{role.name}</h3>
                      <p className="text-sm text-muted">{role.summary}</p>
                    </div>
                  </div>
                  <ul className="mt-6 flex flex-1 flex-col gap-3">
                    {role.tasks.map((task) => (
                      <li key={task} className="flex items-start gap-3 text-ink">
                        <Icon name="check" className="mt-1 size-4 text-primary" />
                        {task}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-6 rounded-xl bg-primary-soft px-4 py-3 text-sm text-muted">
                    Écran d'accueil : <span className="font-semibold text-ink">{role.home}</span>
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="confidentialite" className={`${band} ${anchorOffset} bg-primary-soft`}>
          <div className={`${container} grid gap-10 lg:grid-cols-5 lg:gap-20`}>
            <div className="lg:col-span-2">
              <h2 className={sectionTitle}>
                Confidentialité et <span className="text-primary">cadre d'utilisation</span>
              </h2>
              <p className={sectionIntro}>
                Les informations suivies dans eCare+ sont des données de santé. Leur consultation
                est encadrée.
              </p>
            </div>
            <dl className="flex flex-col gap-4 lg:col-span-3">
              {commitments.map((commitment) => (
                <div key={commitment.title} className="rounded-2xl bg-surface p-6">
                  <dt className="font-display text-lg font-bold text-ink">{commitment.title}</dt>
                  <dd className="mt-2 leading-relaxed text-muted">{commitment.text}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section id="questions" className={`${band} ${anchorOffset}`}>
          <div className="mx-auto w-full max-w-3xl px-4 sm:px-8">
            <h2 className={`text-center ${sectionTitle}`}>Questions fréquentes</h2>
            <div className="mt-10 flex flex-col gap-3">
              {questions.map((item) => (
                <details
                  key={item.question}
                  className="rounded-2xl border border-line bg-surface px-6 py-5"
                >
                  <summary className="cursor-pointer font-display font-semibold text-ink marker:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
                    {item.question}
                  </summary>
                  <p className="mt-3 leading-relaxed text-muted">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-20 sm:pb-28">
          <div className="mx-auto w-full max-w-5xl px-4 sm:px-8">
            <div className="relative overflow-hidden rounded-3xl bg-primary-strong px-6 py-12 shadow-xl shadow-primary/25 sm:px-14 sm:py-16">
              {/* Cercles décoratifs dans l'angle de la carte. */}
              <div aria-hidden="true" className="absolute -top-24 -right-24 hidden sm:block">
                <div className="flex size-96 items-center justify-center rounded-full border border-white/15">
                  <div className="flex size-72 items-center justify-center rounded-full border border-white/20">
                    <div className="size-48 rounded-full bg-white/10" />
                  </div>
                </div>
              </div>

              <div className="relative flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between">
                <div className="max-w-lg">
                  <h2 className="font-display text-3xl leading-tight font-bold text-white sm:text-4xl sm:leading-tight">
                    Votre structure utilise eCare+ ?
                  </h2>
                  <p className="mt-4 text-lg leading-relaxed text-white">
                    Connectez-vous avec vos identifiants professionnels pour retrouver vos patients.
                  </p>
                </div>
                <Link
                  to="/connexion"
                  className="inline-flex h-14 items-center gap-3 rounded-full bg-surface pr-2 pl-7 font-semibold whitespace-nowrap text-primary-strong transition-colors hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Se connecter au portail
                  <span className="inline-flex size-10 items-center justify-center rounded-full bg-primary text-white">
                    <Icon name="arrow" className="size-5" />
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-ink">
        <div className={`${container} flex flex-wrap justify-between gap-10 py-14`}>
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <img src={logoMark} alt="" className="size-10" />
              <span className="font-display text-2xl font-extrabold text-white">ecare+</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-line">
              Plateforme de suivi des personnes vivant avec un diabète ou une hypertension, à
              l'usage des professionnels de santé.
            </p>
          </div>
          <nav aria-label="Pied de page" className="flex flex-wrap gap-x-20 gap-y-8">
            <div>
              <p className="text-sm font-semibold text-white">Découvrir</p>
              <ul className="mt-4 flex flex-col gap-2.5">
                {sectionLinks.map((link) => (
                  <li key={link.href}>
                    <a href={link.href} className={footerLinkClassName}>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Accès</p>
              <ul className="mt-4 flex flex-col gap-2.5">
                <li>
                  <Link to="/connexion" className={footerLinkClassName}>
                    Connexion professionnelle
                  </Link>
                </li>
                <li>
                  <a href="#confidentialite" className={footerLinkClassName}>
                    Confidentialité
                  </a>
                </li>
              </ul>
            </div>
          </nav>
        </div>
        <div className="border-t border-white/15">
          <p className={`${container} py-6 text-xs text-line`}>
            © {currentYear} eCare+. Outil de suivi, sans valeur de diagnostic.
          </p>
        </div>
      </footer>
    </div>
  )
}
