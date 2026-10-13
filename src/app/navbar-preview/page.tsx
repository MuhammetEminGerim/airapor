'use client'

import Link from 'next/link'
import { useState } from 'react'
import LandingDesignOne from '@/components/landing/design-one'
import SiteNav from '@/components/landing/site-nav'

const concepts = [
  { id: 'visor', name: 'Saha vizörü' },
  { id: 'hazard', name: 'Uyarı bandı' },
  { id: 'tag', name: 'Kontrol etiketi' },
] as const

type Concept = typeof concepts[number]['id']

export default function NavbarPreviewPage() {
  const [selected, setSelected] = useState<Concept>('visor')

  return (
    <div className="lpv-shell lpv-nav-preview-page">
      <header className="nav-preview-controls">
        <div><span>İSG SAHA ASİSTANI</span><b>Navbar fikirleri</b></div>
        <nav aria-label="Navbar tasarımları">
          {concepts.map((concept, index) => (
            <button key={concept.id} type="button" className={selected === concept.id ? 'active' : ''} aria-pressed={selected === concept.id} onClick={() => setSelected(concept.id)}>
              <small>0{index + 1}</small>{concept.name}
            </button>
          ))}
        </nav>
        <Link href="/">Ana sayfa ↗</Link>
      </header>

      <SiteNav variant={selected} />
      <LandingDesignOne showNav={false} />
    </div>
  )
}