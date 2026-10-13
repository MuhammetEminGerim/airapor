'use client'

import Link from 'next/link'
import { useState } from 'react'
import LandingDesignOne from '@/components/landing/design-one'
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Camera,
  Check,
  ClipboardCheck,
  Download,
  FileCheck2,
  FileText,
  HardHat,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Wrench,
} from 'lucide-react'

type Direction = 1 | 2 | 3

const signUpHref = '/login?tab=register'

function Brand() {
  return (
    <Link className="lpv-brand" href="/" aria-label="İSG Saha Asistanı ana sayfa">
      <span className="lpv-brand-icon"><HardHat size={22} strokeWidth={2.1} /></span>
      <span>İSG <b>SAHA ASİSTANI</b></span>
    </Link>
  )
}

function SiteNav() {
  return (
    <header className="lpv-site-nav">
      <Brand />
      <nav aria-label="Ana menü">
        <a href="#nasil-calisir">Nasıl çalışır</a>
        <a href="#mevzuat">Mevzuat</a>
        <a href="#rapor">Rapor örneği</a>
        <a href="#sorular">SSS</a>
      </nav>
      <div className="lpv-nav-actions">
        <Link className="lpv-login" href="/login">Giriş yap</Link>
        <Link className="lpv-button lpv-button-small" href={signUpHref}>Ücretsiz beta <ArrowRight size={15} /></Link>
      </div>
    </header>
  )
}
function PreviewBar({ direction, onChange }: { direction: Direction; onChange: (direction: Direction) => void }) {
  return (
    <div className="lpv-preview-bar">
      <div className="lpv-preview-label"><span className="lpv-live-dot" /> CANLI TASARIM ÖNİZLEMESİ <span className="lpv-preview-divider">/</span> İSG SAHA ASİSTANI</div>
      <div className="lpv-switcher" role="group" aria-label="Landing page tasarımı seç">
        {([1, 2, 3] as Direction[]).map((option) => (
          <button
            key={option}
            type="button"
            className={direction === option ? 'is-active' : ''}
            aria-pressed={direction === option}
            onClick={() => onChange(option)}
          >
            <span className="lpv-option-num">0{option}</span>
            <span>{['Saha hikâyesi', 'Ürün önizlemesi', 'Sarı saha defteri'][option - 1]}</span>
          </button>
        ))}
      </div>
      <Link href="/" className="lpv-exit-preview">Önizlemeden çık <ArrowUpRight size={14} /></Link>
    </div>
  )
}

function TrustLine({ dark = false }: { dark?: boolean }) {
  return (
    <div className={`lpv-trust-line${dark ? ' on-dark' : ''}`}>
      <span><ShieldCheck size={16} /> 6331 sayılı Kanun ve ilgili mevzuat</span>
      <i />
      <span><FileCheck2 size={16} /> İmzaya hazır PDF rapor</span>
    </div>
  )
}

function ReportSheet({ compact = false }: { compact?: boolean }) {
  return (
    <article className={`lpv-report-sheet${compact ? ' compact' : ''}`}>
      <div className="lpv-report-head">
        <div className="lpv-report-brand"><span><HardHat size={17} /></span><b>İSG SAHA ASİSTANI</b></div>
        <div className="lpv-report-type">SAHA DENETİM RAPORU <small>RAPOR NO · 2026-0418/A</small></div>
      </div>
      <div className="lpv-report-meta"><span>PROJE / ŞANTİYE<strong>Merkez Konutları · B Blok</strong></span><span>DENETİM TARİHİ<strong>14 Nisan 2026</strong></span><span>HAZIRLAYAN<strong>İSG Uzmanı</strong></span></div>
      <div className="lpv-report-rule" />
      <div className="lpv-report-finding-title"><span>01 — BULGULAR VE DEĞERLENDİRME</span><b>1 / 4</b></div>
      <div className="lpv-report-finding">
        <div className="lpv-report-thumb"><img src="/landing-preview/saha-fotografi.png" alt="İskele platformundaki korkuluk eksiği" /></div>
        <div className="lpv-report-finding-copy"><span className="lpv-risk-tag"><i /> YÜKSEK RİSK</span><h4>İskelede korkuluk eksikliği</h4><p>Çalışma platformunda düşmeye karşı üst korkuluk ve topuk levhası bulunmuyor.</p><div className="lpv-law-ref"><BookOpen size={12} /> Yapı İşlerinde İSG Yönetmeliği · Ek-4</div></div>
      </div>
      <div className="lpv-report-action"><Wrench size={13} /><span><b>Düzeltici faaliyet:</b> Eksik korkuluk ve topuk levhası tamamlanana kadar iskele kullanıma kapatılmalıdır.</span><b>24 saat</b></div>
      <div className="lpv-report-signatures"><span>İSG Uzmanı <i /></span><span>İşveren / Şantiye Şefi <i /></span></div>
      <div className="lpv-report-foot"><span>6331 UYUMLU · SAHA DENETİMİ</span><span>1 / 4</span></div>
    </article>
  )
}

function Steps({ direction }: { direction: Direction }) {
  const steps = direction === 1
    ? [
        ['Saha fotoğraflarını ekleyin', 'Telefonunuzdan çektiğiniz görüntüleri denetime yükleyin.', Camera],
        ['Riskleri gözden geçirin', 'Tespitleri ve mevzuat eşleşmelerini kontrol edin.', ClipboardCheck],
        ['Raporu paylaşın', 'PDF indirin veya süreli bağlantı gönderin.', FileText],
      ] as const
    : [
        ['Sahada kaydedin', 'Fotoğrafı ve kısa notunuzu ekleyin.', Camera],
        ['Yapay zekâ eşleştirsin', 'Bulgu ve ilgili mevzuat tek yerde buluşsun.', Sparkles],
        ['İmzaya hazır rapor', 'PDF çıktınızı indirin ve ekibinizle paylaşın.', FileText],
      ] as const
  return (
    <section className="lpv-steps" id="nasil-calisir">
      <div className="lpv-section-intro"><span className="lpv-kicker">SAHADAN RAPORA · 3 ADIM</span><h2>Denetimden rapora,<br />tek bir akışta.</h2></div>
      <div className="lpv-step-list">
        {steps.map(([title, body, Icon], index) => (
          <article className="lpv-step" key={title}><span className="lpv-step-number">0{index + 1}</span><Icon size={23} strokeWidth={1.7} /><h3>{title}</h3><p>{body}</p></article>
        ))}
      </div>
    </section>
  )
}

function CommonFooter({ direction }: { direction: Direction }) {
  return (
    <>
      <section className={`lpv-close${direction === 3 ? ' lpv-close-yellow' : ''}`} id="sorular">
        <div><span className="lpv-kicker">SAHA EKİBİNİZ İÇİN</span><h2>Bir sonraki denetimin<br />raporu hazır olsun.</h2><p>İSG Saha Asistanı’nı beta süresince ücretsiz deneyin.</p></div>
        <Link className="lpv-button" href={signUpHref}>Ücretsiz beta’ya katıl <ArrowRight size={17} /></Link>
      </section>
      <footer className="lpv-footer"><Brand /><span>SAHADA DAHA AZ EVRAK, DAHA ÇOK GÖRÜNÜRLÜK.</span><span>© 2026 İSG Saha Asistanı</span></footer>
    </>
  )
}

function DirectionOne() {
  return <LandingDesignOne />
}

function WorkspacePreview() {
  return (
    <div className="lpv-workspace" aria-label="İSG Saha Asistanı ürün arayüzü önizlemesi">
      <aside className="lpv-workspace-sidebar"><Brand /><span className="lpv-workspace-caption">ÇALIŞMA ALANI</span><a className="selected"><ClipboardCheck size={15} /> Yeni denetim</a><a><FileText size={15} /> Raporlar</a><a><BookOpen size={15} /> Mevzuat</a><div className="lpv-workspace-profile"><span>MK</span><div><b>Murat K.</b><small>İSG Uzmanı</small></div></div></aside>
      <section className="lpv-workspace-editor"><div className="lpv-editor-top"><span>Denetim / <b>Merkez Konutları</b></span><span><i /> Taslak kaydedildi</span></div><h3>Bulgu detayı <small>03 / 12</small></h3><div className="lpv-editor-photo"><img src="/landing-preview/saha-fotografi.png" alt="İskele fotoğrafı bulgu analizinde" /><span>Fotoğrafı değiştir</span></div><div className="lpv-finding-title"><span>RİSK SEVİYESİ</span><b><i /> Yüksek risk</b></div><label>Tespit açıklaması</label><p>Çalışma platformunda üst korkuluk ve topuk levhası bulunmuyor.</p><div className="lpv-law-box"><BookOpen size={16} /><span><small>İLGİLİ MEVZUAT</small><b>Yapı İşlerinde İSG Yönetmeliği</b><em>Ek-4 · Madde 12</em></span><ArrowRight size={14} /></div><div className="lpv-action-box"><Wrench size={15} /><span><small>DÜZELTİCİ FAALİYET ÖNERİSİ</small>İskele kullanıma kapatılmalı; eksik korkuluklar tamamlanmalı.</span></div></section>
      <aside className="lpv-workspace-report"><div className="lpv-report-toolbar"><span>Rapor önizleme</span><span className="lpv-download-look"><Download size={13} /> PDF indir</span></div><ReportSheet compact /></aside>
    </div>
  )
}

function DirectionTwo() {
  return (
    <div className="lpv-direction lpv-direction-two">
      <SiteNav />
      <main>
        <section className="lpv-product-hero"><div className="lpv-product-copy"><span className="lpv-kicker">SAHA BİLGİSİ · MEVZUAT DESTEĞİ · HAZIR RAPOR</span><h1>Sahadaki bulgudan<br />imzaya hazır rapora.</h1><p>Denetim bulgularınızı yapay zekâ ile mevzuata göre düzenleyin. Raporunuzu dakikalar içinde oluşturun.</p><Link className="lpv-button" href={signUpHref}>Ücretsiz beta’ya katıl <ArrowRight size={17} /></Link><div className="lpv-beta-points"><span><Check /> Kredi kartı gerekmez</span><span><Check /> Beta süresince ücretsiz</span><span><Check /> Hemen kullanmaya başlayın</span></div></div><WorkspacePreview /></section>
        <Steps direction={2} />
        <section className="lpv-proof-row lpv-proof-large" id="mevzuat"><span><ShieldCheck /><b>Mevzuat desteği</b><small>6331 sayılı Kanun ve ilgili yönetmelikler raporunuzda.</small></span><span><UsersRound /><b>Uzmanlar için</b><small>Bağımsız İSG uzmanları ve OSGB ekipleriyle çalışın.</small></span><span><LockKeyhole /><b>Güvenli paylaşım</b><small>Raporları güvenli ve süreli bağlantılarla paylaşın.</small></span></section>
        <section className="lpv-example-strip" id="rapor"><div><span className="lpv-kicker">RAPOR ÖRNEĞİ</span><h2>Bulgu, dayanak ve aksiyon<br />aynı sayfada.</h2><p>Denetim raporunun yapısını inceleyin.</p></div><ReportSheet compact /><a className="lpv-text-link" href="#sorular">Beta’ya katıl <ArrowRight size={15} /></a></section>
        <CommonFooter direction={2} />
      </main>
    </div>
  )
}

function DirectionThree() {
  return (
    <div className="lpv-direction lpv-direction-three">
      <SiteNav />
      <main>
        <section className="lpv-notebook-hero"><div className="lpv-notebook-copy"><span className="lpv-kicker">SAHADA SIZINLE · MASADA YANINIZDA</span><h1>Denetim biter.<br />Raporunuz<br /><em>hazır.</em></h1><p>Sahada aldığınız notlar, fotoğraflar ve tespitler mevzuata uygun, resmî formatta bir rapora dönüşsün.</p><Link className="lpv-button lpv-button-green" href={signUpHref}>Ücretsiz beta’ya katıl <ArrowRight size={17} /></Link><small>Beta süresince ücretsiz · Kredi kartı gerekmez</small><div className="lpv-yellow-facts"><span><b>AZALTIN</b>Rapor düzenleme</span><span><b>EŞLEŞTİRİN</b>Mevzuat dayanağı</span><span><b>PAYLAŞIN</b>Güvenli PDF</span></div></div><div className="lpv-notebook-art"><img src="/landing-preview/iskele-teknik-illust.png" alt="Eksik iskele korkuluğu teknik saha çizimi" /><span className="lpv-art-note lpv-art-note-one">01 · Korkuluk eksik</span><span className="lpv-art-note lpv-art-note-two">02 · Düzeltici aksiyon</span><span className="lpv-art-stamp">SAHA NOTU<br /><b>İSG / 2026</b></span></div></section>
        <section className="lpv-before-after" id="rapor"><div className="lpv-before-head"><span className="lpv-kicker">AYNI SAHA · DAHA AZ İŞ YÜKÜ</span><h2>Dağınık notlardan,<br />düzenli rapora.</h2><p>Bulgunuzu, yasal dayanağını ve aksiyonunu tek dosyada birleştirin.</p></div><div className="lpv-before-paper"><span className="lpv-kicker">SAHA DEFTERİ · 14 NİSAN</span><p>— İskelede korkuluk eksik<br />— Fotoğraf eklendi<br />— Acil aksiyon gerekli</p><span className="lpv-hand-note">denetim notu</span></div><div className="lpv-convert-arrow"><ArrowRight size={24} /><span>İSG Saha Asistanı</span></div><div className="lpv-after-paper"><ReportSheet compact /></div></section>
        <Steps direction={3} />
        <section className="lpv-notebook-proof" id="mevzuat"><span><ShieldCheck /><b>Mevzuata dayalı</b><small>Bulgunun ilgili yasal dayanağı raporda görünür.</small></span><span><FileCheck2 /><b>Raporlamaya hazır</b><small>Fotoğraflı PDF çıktınızı inceleyip indirin.</small></span><span><UsersRound /><b>Saha ekipleri için</b><small>Bağımsız uzmanlar ve OSGB ekipleriyle çalışın.</small></span></section>
        <CommonFooter direction={3} />
      </main>
    </div>
  )
}

export default function LandingPreviewPage() {
  const [direction, setDirection] = useState<Direction>(1)
  return (
    <div className="lpv-shell">
      <PreviewBar direction={direction} onChange={setDirection} />
      {direction === 1 ? <DirectionOne /> : direction === 2 ? <DirectionTwo /> : <DirectionThree />}
    </div>
  )
}
