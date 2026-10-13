'use client'

import Link from 'next/link'
import SiteNav from '@/components/landing/site-nav'
import {
  ArrowDownRight,
  ArrowRight,
  BookOpen,
  Camera,
  ClipboardCheck,
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

export default function LandingDesignOne({ showNav = true }: { showNav?: boolean }) {
  return (
    <div className="lpv-direction lpv-direction-one">
      {showNav && <SiteNav variant="island" />}
      <main>
        <section className="lpv-photo-hero">
          <div className="lpv-photo-copy">

            <h1>Saha fotoğraflarınız<br />anında analiz edilsin,<br /><em>riskler netleşsin.</em></h1>
            <p>Şantiye fotoğraflarını yükleyin; tehlikeleri, ilgili mevzuatı ve düzeltici faaliyetleri tek raporda toplayın.</p>
            <div className="lpv-hero-actions"><Link className="lpv-button" href={signUpHref}>Ücretsiz beta’ya katıl <ArrowRight size={17} /></Link><a className="lpv-text-link" href="#nasil-calisir">Nasıl çalıştığını gör <ArrowDownRight size={15} /></a></div>
            <TrustLine />
          </div>
          <div className="lpv-photo-visual"><img src="/landing-preview/saha-fotografi.png" alt="İş güvenliği uzmanı iskeledeki açık kenarı fotoğraflıyor" />
            <div className="lpv-scan-box"><span>01</span><i /></div>
            <article className="lpv-detection-note"><span className="lpv-risk-tag"><i /> YÜKSEK RİSK</span><h3>Korkuluk eksikliği</h3><p>Yüksekten düşme riski belirlenmiştir.</p><div><BookOpen size={14} /><span>Yapı İşleri İSG Yönetmeliği<br /><b>Ek-4 · Madde 12</b></span></div></article>
            <span className="lpv-image-caption">SAHA DENETİMİ · ÖRNEK GÖRSEL</span>
          </div>
        </section>
        <Steps direction={1} />
        <section className="lpv-report-section" id="rapor"><div className="lpv-report-copy"><span className="lpv-kicker">SADECE TESPİT DEĞİL · RESMÎ RAPOR</span><h2>Mevzuata dayalı,<br />hazır PDF raporlar.</h2><p>Bulgular, ilgili mevzuat maddeleri ve düzeltici faaliyet önerileriyle birlikte raporunuza eklenir.</p><a href="#mevzuat" className="lpv-text-link">Mevzuat desteğini inceleyin <ArrowRight size={15} /></a></div><ReportSheet /></section>
        <TrustLine />
        <section className="lpv-proof-row" id="mevzuat"><span><ShieldCheck /><b>Mevzuatla birlikte</b><small>Tespit ve dayanağı aynı raporda görün.</small></span><span><LockKeyhole /><b>Kontrollü paylaşım</b><small>Güvenli, süreli bağlantılar oluşturun.</small></span><span><UsersRound /><b>Uzmanlar için tasarlandı</b><small>Bağımsız İSG uzmanları ve OSGB ekipleri için.</small></span></section>
        <CommonFooter direction={1} />
      </main>
    </div>
  )
}

