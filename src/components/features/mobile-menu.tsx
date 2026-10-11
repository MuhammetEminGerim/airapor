'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Menu } from 'lucide-react'

export function MobileMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  const close = () => setOpen(false)

  return (
    <div className="mobile-menu" ref={ref}>
      <button type="button" aria-label="Menüyü aç" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <Menu size={21} />
      </button>
      {open ? (
        <div className="mobile-menu-pop">
          <Link href="#nasil-calisir" onClick={close}>Nasıl çalışır</Link>
          <Link href="#araclar" onClick={close}>Araçlar</Link>
          <Link href="#fiyatlar" onClick={close}>Fiyatlar</Link>
          <Link href="/login" onClick={close}>Giriş yap</Link>
        </div>
      ) : null}
    </div>
  )
}
