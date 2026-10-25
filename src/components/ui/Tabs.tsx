import type { KeyboardEvent } from 'react'
import { tabId, tabPanelId } from '@/components/ui/tabIds'

interface TabsProps {
  /** Intitulé du groupe d'onglets, lu par les lecteurs d'écran. */
  label: string
  wrap?: boolean
  tabs: { id: string; label: string }[]
  active: string
  onChange: (id: string) => void
}

/** Barre d'onglets en pilule ; l'onglet actif est plein, comme l'entrée active du menu. */
export function Tabs({ label, tabs, active, onChange, wrap = false }: TabsProps) {
  // Flèches gauche et droite : passage à l'onglet voisin, comme le veut l'usage au clavier.
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowRight','ArrowLeft','Home','End'].includes(event.key)) return
    event.preventDefault()
    const index = tabs.findIndex((tab) => tab.id === active)
    const step = event.key === 'ArrowRight' ? 1 : -1
    const next = event.key==='Home'?tabs[0]:event.key==='End'?tabs[tabs.length-1]:tabs[(index + step + tabs.length) % tabs.length]
    onChange(next.id)
    document.getElementById(tabId(next.id))?.focus({preventScroll:true})
  }

  return (
    <div className={wrap?'min-w-0':'overflow-x-auto'}>
      <div
        role="tablist"
        aria-label={label}
        onKeyDown={handleKeyDown}
        // Grille adaptative pour le dossier patient ; barre défilante pour les autres usages.
        className={`${wrap?'grid grid-cols-2 rounded-3xl min-[480px]:grid-cols-3 min-[1100px]:grid-cols-4 min-[1180px]:grid-cols-7':'flex min-w-max rounded-full'} w-full gap-1 border border-line bg-surface p-1.5 shadow-sm`}
      >
        {tabs.map((tab) => {
          const selected = tab.id === active
          return (
            <button
              key={tab.id}
              id={tabId(tab.id)}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={tabPanelId(tab.id)}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(tab.id)}
              className={`min-h-10 min-w-0 flex-1 rounded-full px-3 py-2 text-sm transition duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-[0.97] ${
                selected
                  ? 'bg-primary-strong font-semibold text-white shadow-md'
                  : 'font-medium text-muted hover:bg-page hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
