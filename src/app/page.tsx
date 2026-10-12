import Link from 'next/link'
import {
  ArrowDownRight,
  ArrowRight,
  BookOpen,
  Check,
  ClipboardCheck,
  FileText,
  HardHat,
  Lock,
  ShieldCheck,
  Upload,
  UsersRound,
} from 'lucide-react'
import { MobileMenu } from '@/components/features/mobile-menu'

const features = [
  {
    number: '01',
    icon: ClipboardCheck,
    title: 'Fotoğraftan risk tespiti',
    body: 'Saha fotoğraflarını yükleyin. Görünen tehlikeleri, risk düzeyini ve önerilen düzeltici faaliyeti rapor taslağında inceleyin.',
  },
  {
    number: '02',
    icon: BookOpen,
    title: 'Mevzuatla birlikte',
    body: 'Tespitleri ilgili İSG mevzuat referanslarıyla aynı dosyada düzenleyin; sahadaki bulgu ile yasal dayanak birbirinden kopmasın.',
  },
  {
    number: '03',
    icon: FileText,
    title: 'İmzaya hazır rapor',
    body: 'Firma bilgileri, fotoğraflar ve imza alanlarıyla raporunuzu PDF olarak indirin veya süreli bağlantıyla paylaşın.',
  },
]

const plans = [
  {
    name: 'Erken Erişim (Beta)',
    audience: 'Lansman süresince tüm bağımsız uzmanlar için',
    price: '0',
    features: ['Sınırsız saha denetim raporu', 'Gemini Vision fotoğraf ve risk analizi', 'Firma ve OSGB logolu resmî PDF', 'Süreli web paylaşım bağlantısı'],
    action: 'Ücretsiz başla',
    href: '/login?tab=register',
    featured: true,
  },
  {
    name: 'İSG Uzmanı (Gelecek)',
    audience: 'Gelişmiş DÖF takibi ve otomasyonlar için',
    price: '399',
    features: ['Tüm erken erişim özellikleri', 'Otomatik mevzuat güncelleme alarmları', 'WhatsApp entegrasyonu', 'Öncelikli yapay zeka kotası'],
    action: 'Beta süresince ücretsiz',
    href: '/login?tab=register',
    featured: false,
  },
  {
    name: 'Kurumsal / OSGB',
    audience: 'Çoklu şantiye ve uzman ekipleri için',
    price: 'Özel',
    features: ['Çoklu uzman ve şantiye yönetimi', 'Merkezi arşiv ve denetim görünümü', 'Şirkete özel şablonlar', 'Öncelikli teknik destek'],
    action: 'İletişime geç',
    href: '/login?tab=register',
    featured: false,
  },
]

function InspectionSheet() {
  return (
    <div className="inspection-stack" role="img" aria-label="Resmi İSG Saha Denetim Raporu Örneği">
      <div className="inspection-back inspection-back-one" />
      <div className="inspection-back inspection-back-two" />
      <article className="doc-sheet">
        {/* Top Header with Dual Logos */}
        <div className="doc-top-bar">
          <div className="doc-company-badge">
            <div className="doc-company-logo">Kİ</div>
            <div className="doc-badge-text">
              <strong>KUZEY İNŞAAT A.Ş.</strong>
              <span>ANA YÜKLENİCİ</span>
            </div>
          </div>

          <div className="doc-center-title">
            <h3>İSG Saha Denetim Raporu</h3>
            <span>EVRAK NO: 2026-0418/A</span>
          </div>

          <div className="doc-osgb-badge">
            <div className="doc-osgb-logo">OSGB</div>
            <div className="doc-badge-text">
              <strong>KORU ORTAK SAĞLIK GÜV.</strong>
              <span>YETKİLİ KURUM</span>
            </div>
          </div>
        </div>

        {/* Technical Meta Grid */}
        <div className="doc-meta-grid">
          <div className="doc-meta-item">
            <span>Şantiye / Proje</span>
            <strong>Merkez Konutları · B Blok</strong>
          </div>
          <div className="doc-meta-item">
            <span>İSG Denetmeni</span>
            <strong>Murat K. (A Sınıfı · 48192)</strong>
          </div>
          <div className="doc-meta-item">
            <span>Tarih & Saat</span>
            <strong>14.04.2026 · 10:30</strong>
          </div>
          <div className="doc-meta-item">
            <span>Saha Mevcudu</span>
            <strong>142 Çalışan · Açık Hava</strong>
          </div>
        </div>

        {/* Primary Finding Card */}
        <div className="doc-finding-card">
          <div className="doc-finding-header">
            <span className="doc-risk-pill">🔴 YÜKSEK RİSK</span>
            <span className="doc-finding-loc">12. Kat Dış Cephe İskelesi</span>
            <span className="doc-finding-no">Bulgu 01 / 04</span>
          </div>

          <p className="doc-finding-body">
            12. Kat çalışma iskelesinde çift sıra yatay koruma korkuluğu ve topuk levhası (tekmelik) bulunmuyor. Yüksekten malzeme ve çalışan düşme riski mevcut.
          </p>

          <div className="doc-finding-chips">
            <span className="doc-law-chip">
              <BookOpen size={12} />
              Yapı İşlerinde İSG Yönetmeliği · Ek-4 / Md. 12
            </span>
          </div>

          <div className="doc-dof-strip">
            <span><strong>DÖF Aksiyonu:</strong> İskele derhal kullanıma kapatılmalı, korkuluklar ve emniyet ağları tamamlanmalıdır.</span>
            <span className="doc-dof-deadline">Termin: 24 Saat (Acil)</span>
          </div>
        </div>

        {/* Secondary Finding Preview */}
        <div className="doc-mini-finding">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-amber-600 font-mono">🟡 ORTA RİSK</span>
            <span>Bulgu 02: Seyyar panolarda kaçak akım rölesi test etiketi eksik.</span>
          </div>
          <span className="text-[10px] text-muted-foreground font-mono">Termin: 48 Saat</span>
        </div>

        {/* Dual Signatures */}
        <div className="doc-signatures">
          <div className="doc-sig-box">
            <span className="doc-sig-role">Tebellüğ Eden (Şantiye Şefi)</span>
            <span className="doc-sig-name">Engin V. (İnşaat Müh.)</span>
            <div className="doc-sig-sign">
              <span>Firma Kaşesi & Islak İmza</span>
              <span>14.04.2026</span>
            </div>
          </div>

          <div className="doc-sig-box">
            <span className="doc-sig-role">Denetimi Yapan İSG Uzmanı</span>
            <span className="doc-sig-name">Murat K. (A Sınıfı Uzman)</span>
            <div className="doc-sig-sign">
              <span>Bakanlık Kaşesi & Paraf</span>
              <span>14.04.2026</span>
            </div>
          </div>
        </div>

        {/* Official Stamp */}
        <div className="doc-stamp">
          RESMÎ İSG EVRAKI<br />6331 UYUMLU · DÖF TAKİBİ
        </div>
      </article>
      <span className="paper-clip" aria-hidden="true" />
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <Link href="/" className="brand-lockup" aria-label="İSG Saha Asistanı ana sayfa">
          <span className="brand-mark"><HardHat size={20} strokeWidth={2.2} /></span>
          <span>İSG <b>SAHA ASİSTANI</b></span>
        </Link>
        <nav className="landing-nav" aria-label="Ana menü">
          <Link href="#nasil-calisir">Nasıl çalışır</Link>
          <Link href="#araclar">Araçlar</Link>
          <Link href="#fiyatlar">Fiyatlar</Link>
        </nav>
        <div className="header-actions">
          <Link className="sign-in-link" href="/login">Giriş yap</Link>
          <Link className="safety-button header-cta" href="/login?tab=register">Ücretsiz başla <ArrowRight size={16} /></Link>
          <MobileMenu />
        </div>
      </header>

      <main>
        <section className="landing-hero">
          <div className="hero-copy">
            <div className="eyebrow"><span /> SAHA NOTLARI · 01 / DENETİM</div>
            <h1>Sahada tespit et.<br />Mevzuatla eşleştir.<br /><em>Raporla.</em></h1>
            <p className="hero-description">Saha fotoğraflarını yükleyin; riskleri, mevzuat referanslarını ve düzeltici faaliyetleri tek raporda toplayın.</p>
            <div className="hero-actions">
              <Link className="safety-button hero-button" href="/login?tab=register">Denetim başlat <ArrowRight size={17} /></Link>
              <Link className="text-link" href="#nasil-calisir">Nasıl çalıştığını gör <ArrowDownRight size={16} /></Link>
            </div>
            <div className="hero-proof">
              <span><ShieldCheck size={16} /> 6331 & Yapı İşleri Mevzuatı</span>
              <span><FileText size={16} /> Çift Logolu Resmî PDF</span>
              <span><Lock size={16} /> WhatsApp & Süreli Paylaşım</span>
            </div>
          </div>
          <div className="hero-visual"><InspectionSheet /></div>
          <div className="hero-caption"><span>ŞANTİYE DEFTERİ</span><span>İSG / 2026</span></div>
        </section>

        <section className="process-strip" id="nasil-calisir">
          <div className="section-label"><span>01 — İŞ AKIŞI</span><span>SAHADAN RAPORA, 3 ADIMDA</span></div>
          <div className="process-grid">
            <article className="process-step"><span className="step-number">1</span><div><h2>Fotoğrafları yükle</h2><p>Telefonundan saha görüntülerini ekle, gerekli notları iliştir.</p></div><Upload className="step-icon" size={21} /></article>
            <article className="process-step"><span className="step-number">2</span><div><h2>Riskleri gözden geçir</h2><p>Bulgu taslaklarını ve mevzuat eşleşmelerini kontrol et.</p></div><ClipboardCheck className="step-icon" size={21} /></article>
            <article className="process-step"><span className="step-number">3</span><div><h2>Raporu paylaş</h2><p>PDF çıktını indir veya rapor bağlantısını ekibine gönder.</p></div><ArrowRight className="step-icon" size={21} /></article>
          </div>
        </section>

        <section className="tools-section" id="araclar">
          <div className="section-intro"><span className="section-overline">02 — SAHA ARAÇLARI</span><h2>Denetimin her adımı<br />aynı dosyada.</h2><p>Sahadaki bulguyu, yasal dayanağı ve aksiyonu birlikte tut. Akşam raporu baştan yazmak zorunda kalma.</p></div>
          <div className="feature-list">
            {features.map(({ number, icon: Icon, title, body }) => (
              <article className="feature-row" key={number}><span className="feature-number">{number}</span><span className="feature-icon"><Icon size={19} /></span><div><h3>{title}</h3><p>{body}</p></div><ArrowRight className="feature-arrow" size={17} /></article>
            ))}
          </div>
        </section>

        <section className="pricing-section" id="fiyatlar">
          <div className="pricing-heading"><div><span className="section-overline">03 — PLANLAR & ERKEN ERİŞİM</span><h2>Sahanın ölçeğine göre.</h2></div><p>Beta lansmanı boyunca tüm temel İSG denetim ve mevzuat özellikleri tamamen ücretsizdir.</p></div>
          <div className="pricing-grid">
            {plans.map((plan) => (
              <article className={`price-sheet${plan.featured ? ' price-sheet-featured' : ''}`} key={plan.name}>
                {plan.featured && <span className="plan-stamp">LANSMANA ÖZEL ÜCRETSİZ</span>}
                <h3>{plan.name}</h3><p className="plan-audience">{plan.audience}</p>
                <div className="plan-price"><strong>{plan.price}</strong><span>{plan.price === 'Özel' ? 'Teklif' : '₺ / ay'}</span></div>
                <ul>{plan.features.map((item) => <li key={item}><Check size={15} />{item}</li>)}</ul>
                <Link className={plan.featured ? 'safety-button plan-button' : 'plan-link'} href={plan.href}>{plan.action}<ArrowRight size={15} /></Link>
              </article>
            ))}
          </div>
        </section>

        <section className="closing-note">
          <div className="closing-symbol"><UsersRound size={22} /></div>
          <div><span className="section-overline">SAHA EKİBİNE NOT</span><h2>Bir sonraki denetimin<br />raporu hazır olsun.</h2></div>
          <Link className="safety-button" href="/login?tab=register">Ücretsiz dene <ArrowRight size={17} /></Link>
        </section>
      </main>

      <footer className="landing-footer">
        <Link href="/" className="brand-lockup"><span className="brand-mark"><HardHat size={17} /></span><span>İSG <b>SAHA ASİSTANI</b></span></Link>
        <span>SAHADA DAHA AZ EVRAK, DAHA ÇOK GÖRÜNÜRLÜK.</span>
        <span>© 2026 İSG Saha Asistanı</span>
      </footer>
    </div>
  )
}
