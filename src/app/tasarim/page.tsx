'use client'

import { useState } from 'react'
import {
  HardHat,
  Camera,
  Upload,
  Download,
  Save,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  Clock,
  User,
  Search,
  Sparkles,
  Layers,
  LayoutGrid,
  FileText,
  Sliders,
  ChevronRight,
  ShieldCheck,
  Eye,
  Trash2,
  ChevronDown,
} from 'lucide-react'
import Link from 'next/link'

export default function TasarimPage() {
  const [activeConcept, setActiveConcept] = useState<1 | 2 | 3>(1)

  return (
    <div className="min-h-screen bg-[#090b11] text-zinc-100 flex flex-col font-sans antialiased selection:bg-amber-500 selection:text-black">
      {/* Top Floating Control Bar */}
      <header className="sticky top-0 z-50 bg-[#0c0e17]/90 backdrop-blur-xl border-b border-zinc-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-black font-extrabold shadow-lg shadow-amber-500/20">
            <HardHat className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-tight text-white">İSG SAHA</span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Tasarım Stüdyosu
              </span>
            </div>
            <p className="text-xs text-zinc-400">Soldaki klasik sidebar yerine 3 modern vizyon</p>
          </div>
        </div>

        {/* Concept Switcher Pills */}
        <div className="flex items-center bg-zinc-900/90 p-1 rounded-xl border border-zinc-800 shadow-inner">
          <button
            onClick={() => setActiveConcept(1)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeConcept === 1
                ? 'bg-amber-500 text-black shadow-md font-bold'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <span>🏝️</span> Konsept 1: Linear / Vercel Ada
          </button>
          <button
            onClick={() => setActiveConcept(2)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeConcept === 2
                ? 'bg-amber-500 text-black shadow-md font-bold'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <span>🚀</span> Konsept 2: Raycast Yüzen Dock
          </button>
          <button
            onClick={() => setActiveConcept(3)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeConcept === 3
                ? 'bg-amber-500 text-black shadow-md font-bold'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <span>📐</span> Konsept 3: Studio / Belge Odaklı
          </button>
        </div>

        <Link
          href="/dashboard/isg-denetim"
          className="text-xs font-semibold text-zinc-400 hover:text-white border border-zinc-800 px-3 py-1.5 rounded-lg hover:bg-zinc-800/40 transition-colors"
        >
          Mevcut Panele Dön →
        </Link>
      </header>

      {/* Description Strip */}
      <div className="bg-gradient-to-b from-[#0c0e17] to-transparent border-b border-zinc-900 px-4 sm:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          {activeConcept === 1 && (
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>🏝️</span> Linear / Vercel Tarzı: Üst Ada Navigasyon (Önerilen)
              </h2>
              <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                Soldaki hantal ve yer kaplayan klasik sidebar tamamen kalkar. Ekranın üstünde cam efektli zarif bir ada menü durur. İçerik alanı tam ekran ferahlığa kavuşur, fotoğraflar ve denetim kartları tüm ekrana yayılır.
              </p>
            </div>
          )}
          {activeConcept === 2 && (
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>🚀</span> Raycast / Arc Tarzı: Yüzen İnce İkon Dock
              </h2>
              <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                Klasik gri sütun panel yerine, ekranın solunda asılı duran 50px genişliğinde fütüristik bir yüzen ikon dock. Üstte ⌘K hızlı arama çubuğu ile süper hızlı bir mühendislik aracı hissiyatı sunar.
              </p>
            </div>
          )}
          {activeConcept === 3 && (
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>📐</span> Studio / Canvas: Belge Merkezli Canlı Çalışma Masası
              </h2>
              <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                Figma veya Notion gibi doğrudan resmi İSG denetim tutanağının kendisi ortada bir çalışma masası gibi durur. Sağ tarafta hızlı parametre müfettişi, üstte breadcrumb bulunur.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Live Screen Showcase */}
      <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
        <div className="rounded-2xl border border-zinc-800/80 bg-[#0c0e18] shadow-2xl overflow-hidden min-h-[680px] flex flex-col">
          {/* Mock Browser Header */}
          <div className="bg-[#121522] border-b border-zinc-800/80 px-4 py-2.5 flex items-center justify-between">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            </div>
            <div className="text-[11px] font-mono text-zinc-400 bg-zinc-950 border border-zinc-800 px-6 py-1 rounded-md">
              {activeConcept === 1 && 'app.isgsaha.com/linear-island/denetim'}
              {activeConcept === 2 && 'app.isgsaha.com/raycast-dock/denetim'}
              {activeConcept === 3 && 'app.isgsaha.com/studio-canvas/denetim'}
            </div>
            <div className="w-12" />
          </div>

          {/* ========================================================
              KONSEPT 1: LINEAR / VERCEL TOP ISLAND VIEW
              ======================================================== */}
          {activeConcept === 1 && (
            <div className="flex-1 flex flex-col bg-[#0a0c14]">
              {/* Top Island Navbar (No Sidebar) */}
              <nav className="h-16 border-b border-zinc-800/80 bg-[#0e111d]/70 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-amber-500 flex items-center justify-center text-black font-extrabold text-sm">
                    ⚡
                  </div>
                  <span className="font-extrabold text-sm tracking-tight text-white">İSG SAHA</span>
                </div>

                {/* Clean Central Nav Tabs */}
                <div className="flex items-center bg-zinc-900/90 border border-zinc-800 p-1 rounded-xl gap-1">
                  <button className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-black shadow-sm">
                    Saha Denetimi
                  </button>
                  <button className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white">
                    Rapor Arşivi (24)
                  </button>
                  <button className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white">
                    İstatistikler
                  </button>
                  <button className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white">
                    Ayarlar
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <button className="bg-amber-500 text-black font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-md shadow-amber-500/20 hover:bg-amber-400 transition-colors">
                    <Save className="h-3.5 w-3.5" /> Kaydet
                  </button>
                  <div className="h-8 w-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-xs text-amber-400">
                    EG
                  </div>
                </div>
              </nav>

              {/* Wide Canvas Content */}
              <div className="p-6 sm:p-8 max-w-5xl w-full mx-auto flex flex-col gap-6">
                {/* Clean Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-800/80 pb-6">
                  <div>
                    <div className="text-[11px] font-mono font-bold text-amber-400 tracking-wider uppercase">
                      RAPOR-2026-003 • RESMİ SAHA GÖZETİMİ
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
                      Bölen Otomotiv Yeni Depo İnşaatı
                    </h1>
                    <p className="text-xs text-zinc-400 mt-1 flex items-center gap-3">
                      <span>📍 Bolu Organize Sanayi</span>
                      <span>•</span>
                      <span>👷 45 Çalışan Sahada</span>
                      <span>•</span>
                      <span>⏱️ 09:30 - 12:00</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-zinc-900 border border-zinc-800 text-zinc-200 hover:bg-zinc-800 transition-colors flex items-center gap-1.5">
                      <Download className="h-3.5 w-3.5 text-amber-400" /> PDF İndir
                    </button>
                    <button className="px-3.5 py-2 rounded-lg text-xs font-bold bg-emerald-500 text-black hover:bg-emerald-400 transition-colors flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Tamamla & Paylaş
                    </button>
                  </div>
                </div>

                {/* Hero Upload Banner */}
                <div className="border-2 border-dashed border-amber-500/30 bg-amber-500/[0.03] hover:bg-amber-500/[0.06] rounded-2xl p-8 text-center transition-all cursor-pointer">
                  <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-3 border border-amber-500/20">
                    <Camera className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-bold text-white">Saha Fotoğraflarını Ekleyin</h3>
                  <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
                    Kameradan çekin veya galeriden çoklu seçin. Gemini Vision mevzuatı ve risk derecesini otomatik eşleştirir.
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <button className="bg-amber-500 text-black font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5">
                      <Camera className="h-3.5 w-3.5" /> Kamerayı Aç
                    </button>
                    <button className="bg-zinc-900 border border-zinc-700 text-zinc-200 font-semibold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5">
                      <Upload className="h-3.5 w-3.5" /> Dosya Seç
                    </button>
                  </div>
                </div>

                {/* Findings Feed */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">Tespit Edilen Bulgular (2)</span>
                    <span className="text-xs text-zinc-400 font-mono">1 Yüksek Risk • 1 Orta Risk</span>
                  </div>

                  {/* Finding Card 1 */}
                  <div className="rounded-xl border border-zinc-800 bg-[#0f121e] p-4 border-l-4 border-l-red-500 flex gap-4 items-start">
                    <div className="w-16 h-16 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-2xl shrink-0">
                      🏗️
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">3. Kat Cephe İskelesi</span>
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/30">
                            Yüksek Risk
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-zinc-500">Termin: 24 Saat</span>
                      </div>
                      <p className="text-xs text-zinc-300 mt-1.5 leading-relaxed">
                        Çalışan personelin paraşüt tipi emniyet kemerleri yaşam hattına bağlı değil. Merdiven kova boşluklarında standart korkuluk ve topukluk eksik.
                      </p>
                      <div className="flex items-center gap-4 mt-3 text-[11px] text-zinc-400 font-mono">
                        <span>⚖️ Yapı İşlerinde İSG Yön. Ek-4 Md. 12</span>
                        <span>👤 Sorumlu: Saha Şefi</span>
                      </div>
                    </div>
                  </div>

                  {/* Finding Card 2 */}
                  <div className="rounded-xl border border-zinc-800 bg-[#0f121e] p-4 border-l-4 border-l-amber-500 flex gap-4 items-start">
                    <div className="w-16 h-16 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-2xl shrink-0">
                      ⚡
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">Zemin Kat Ana Dağıtım Panosu</span>
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            Orta Risk
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-zinc-500">Termin: 3 Gün</span>
                      </div>
                      <p className="text-xs text-zinc-300 mt-1.5 leading-relaxed">
                        Elektrik panosu önünde yalıtkan paspas bulunmuyor ve kaçak akım rölesi periyodik test etiketi eksik.
                      </p>
                      <div className="flex items-center gap-4 mt-3 text-[11px] text-zinc-400 font-mono">
                        <span>⚖️ Elektrik İç Tesisleri Yön. Md. 25</span>
                        <span>👤 Sorumlu: Elektrik Taşeronu</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              KONSEPT 2: RAYCAST FLOATING SLIM DOCK VIEW
              ======================================================== */}
          {activeConcept === 2 && (
            <div className="flex-1 flex bg-[#090b12] relative overflow-hidden">
              {/* Floating Dock on the Left */}
              <aside className="my-auto ml-4 bg-[#141726]/90 backdrop-blur-xl border border-zinc-700/60 rounded-2xl p-2 flex flex-col gap-2.5 shadow-2xl z-20">
                <button
                  className="w-10 h-10 rounded-xl bg-amber-500 text-black flex items-center justify-center shadow-lg shadow-amber-500/30"
                  title="Saha Denetimi"
                >
                  <Camera className="h-5 w-5" />
                </button>
                <button
                  className="w-10 h-10 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                  title="Rapor Arşivi"
                >
                  <FileText className="h-5 w-5" />
                </button>
                <button
                  className="w-10 h-10 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                  title="İstatistikler"
                >
                  <Layers className="h-5 w-5" />
                </button>
                <div className="h-px bg-zinc-800 mx-1 my-1" />
                <button
                  className="w-10 h-10 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                  title="Ayarlar"
                >
                  <Sliders className="h-5 w-5" />
                </button>
              </aside>

              {/* Main Canvas with Raycast Search Top */}
              <div className="flex-1 p-6 sm:p-8 flex flex-col gap-6 max-w-5xl mx-auto w-full">
                {/* Raycast ⌘K Action Header */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400">
                    <span className="text-white font-bold">İSG SAHA</span>
                    <span>/</span>
                    <span>Hızlı Denetim Modu</span>
                  </div>

                  <div className="flex items-center gap-2 bg-[#121524] border border-zinc-800 px-4 py-1.5 rounded-full text-xs text-zinc-400 w-72">
                    <Search className="h-3.5 w-3.5 text-zinc-500" />
                    <span>Şantiye veya bulgu ara...</span>
                    <span className="ml-auto text-[10px] font-mono bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300">
                      ⌘K
                    </span>
                  </div>
                </div>

                {/* Compact Station Card */}
                <div className="bg-[#101322] border border-zinc-800/80 rounded-2xl p-6 flex flex-col gap-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-white">Bölen Otomotiv Şantiye Panosu</h2>
                      <p className="text-xs text-zinc-400 mt-1">Hızlı bulgu girişi ve görsel kayıt istasyonu</p>
                    </div>
                    <button className="bg-amber-500 text-black font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-2">
                      <Camera className="h-4 w-4" /> Anlık Fotoğraf Analizi
                    </button>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl">
                      <div className="text-xs font-bold text-red-400">Bulgu #1: İskele Yaşam Hattı</div>
                      <p className="text-xs text-zinc-400 mt-1">Emniyet kemeri yaşam hattına takılı değil.</p>
                    </div>
                    <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl">
                      <div className="text-xs font-bold text-amber-400">Bulgu #2: Pano Yalıtımı</div>
                      <p className="text-xs text-zinc-400 mt-1">Yalıtkan paspas bulunmuyor.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              KONSEPT 3: STUDIO / CANVAS BELGE ODAKLI VIEW
              ======================================================== */}
          {activeConcept === 3 && (
            <div className="flex-1 flex flex-col bg-[#08090f]">
              {/* Studio Top Toolbar */}
              <div className="h-12 border-b border-zinc-800/80 bg-[#0d0f18] px-6 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500">Şantiye Arşivi</span>
                  <span className="text-zinc-700">/</span>
                  <div className="flex items-center gap-1.5 font-bold text-white bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-md">
                    <span>🏗️ Bölen Otomotiv Depo</span>
                    <ChevronDown className="h-3 w-3 text-amber-400" />
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                  <span className="px-2.5 py-0.5 rounded bg-zinc-800 text-white font-semibold text-[11px]">
                    Belge Sayfası
                  </span>
                  <span className="px-2.5 py-0.5 rounded text-zinc-400 font-medium text-[11px]">
                    Bulgu Tablosu
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button className="bg-zinc-800 text-white font-semibold px-3 py-1 rounded-md border border-zinc-700 text-xs">
                    Paylaş
                  </button>
                  <button className="bg-amber-500 text-black font-bold px-3 py-1 rounded-md text-xs">
                    PDF Al
                  </button>
                </div>
              </div>

              {/* Studio Grid: Paper Sheet in Middle + Side Inspector */}
              <div className="flex-1 grid lg:grid-cols-[1fr_300px]">
                {/* Paper Canvas */}
                <div className="p-8 overflow-y-auto flex justify-center">
                  <div className="bg-[#11131f] border border-zinc-800 rounded-2xl p-8 max-w-2xl w-full shadow-2xl space-y-6">
                    <div className="border-b border-zinc-800 pb-4 flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-amber-400">
                          RESMİ SAHA DENETİM TUTANAĞI
                        </span>
                        <h2 className="text-xl font-extrabold text-white mt-1">İSG Saha Denetim Raporu</h2>
                        <p className="text-xs text-zinc-400 mt-1">Tarih: 12 Ekim 2026 • No: RAPOR-2026-003</p>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xl">
                        🏢
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="text-xs font-bold text-zinc-300">1. Tespit Edilen Tehlikeler</div>
                      <div className="bg-zinc-900/60 border border-zinc-800 p-3 rounded-lg text-xs space-y-1">
                        <div className="flex justify-between font-bold text-white">
                          <span>#1 İskele Emniyet Kemeri Uygunsuzluğu</span>
                          <span className="text-red-400">Yüksek Risk</span>
                        </div>
                        <p className="text-zinc-400">Mevzuat: Yapı İşlerinde İSG Yönetmeliği Ek-4 Md. 12</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Inspector Panel */}
                <aside className="border-l border-zinc-800/80 bg-[#0b0d15] p-5 flex flex-col gap-4 text-xs">
                  <span className="font-bold text-zinc-400 uppercase tracking-wider text-[10px]">
                    Denetim Parametreleri
                  </span>
                  <div className="bg-zinc-900/80 border border-zinc-800 p-3 rounded-xl space-y-2">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Hava Durumu:</span>
                      <span className="font-semibold text-white">☀️ Güneşli</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Çalışan Sayısı:</span>
                      <span className="font-semibold text-white">45 Kişi</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Saat Aralığı:</span>
                      <span className="font-semibold text-white">09:30 - 12:00</span>
                    </div>
                  </div>

                  <span className="font-bold text-zinc-400 uppercase tracking-wider text-[10px] mt-2">
                    Hızlı İşlemler
                  </span>
                  <button className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 p-2.5 rounded-lg font-semibold text-white text-left flex items-center gap-2">
                    <Camera className="h-4 w-4 text-amber-400" /> Yeni Fotoğraf Ekle
                  </button>
                  <button className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 p-2.5 rounded-lg font-semibold text-white text-left flex items-center gap-2">
                    <FileText className="h-4 w-4 text-amber-400" /> İmzaları Düzenle
                  </button>
                </aside>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer Info */}
      <footer className="border-t border-zinc-900 py-6 px-4 text-center text-xs text-zinc-500">
        İnceledikten sonra hangisini uygulamak istediğini söylersen, projenin tüm sayfalarını bu tasarıma geçirebiliriz.
      </footer>
    </div>
  )
}
