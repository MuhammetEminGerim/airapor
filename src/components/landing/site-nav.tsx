'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, HardHat } from 'lucide-react'

type NavbarVariant = "island" | "visor" | "hazard" | "tag"

export default function SiteNav({ variant }: { variant?: NavbarVariant }) {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const updateScrollState = () => setIsScrolled(window.scrollY > 8)
    updateScrollState()
    window.addEventListener('scroll', updateScrollState, { passive: true })
    return () => window.removeEventListener('scroll', updateScrollState)
  }, [])

  return (
    <header className={`lpv-site-nav${isScrolled ? ' is-scrolled' : ''}${variant ? ` lpv-nav-${variant}` : ''}`}>
      <Link className="lpv-brand" href="/" aria-label="İSG Saha Asistanı ana sayfa">
        <span className="lpv-brand-icon"><HardHat size={22} strokeWidth={2.1} /></span>
        <span>İSG <b>SAHA ASİSTANI</b></span>
      </Link>
      <nav aria-label="Ana menü">
        <a href="#nasil-calisir">Nasıl çalışır</a>
        <a href="#mevzuat">Mevzuat</a>
        <a href="#rapor">Rapor örneği</a>
        <a href="#sorular">SSS</a>
      </nav>
      <div className="lpv-nav-actions">
        <Link className="lpv-login" href="/login">Giriş yap</Link>
        <Link className="lpv-button lpv-button-small" href="/login?tab=register">Ücretsiz beta <ArrowRight size={15} /></Link>
      </div>
    </header>
  )
}