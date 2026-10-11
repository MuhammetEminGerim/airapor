'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { supabase } from '@/lib/supabase'
import { Loader2, Info, Settings, Shield, Palette, Building2, HardHat, UploadCloud, Trash2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { StatusBanner } from '@/components/features/status-banner'
import { getReadableErrorMessage } from '@/lib/user-feedback'
import { createDevTimer } from '@/lib/dev-timing'

type BannerState = {
  state: 'loading' | 'success' | 'error' | 'info'
  title: string
  message?: string
}

const SAMPLE_COMPANY_LOGO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHgAAAA8CAIAAAAiz+n/AAAApElEQVR4nO3WsQmAUAxF0b+Mk7m4vWAtIugCFhYSQ3Lgdq8Jp8rYj1MBjd8vaBJo0LUCDbpWoEHXKhR62a5sgQYNGjRo0KCbQE/zGhlo0KBBgwadD/qN+ydr968DNGjQoEGDBg0aNGjQoEGDBg0aNGjQoEGDBg0aNGjQXaEfXWICDRo0aNCgc0AnCTRo0KBBgwYNGjTo9NCdAw26VqBB1wo06FrdPXHq0v5nM0IAAAAASUVORK5CYII='

const SAMPLE_OSGB_LOGO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHgAAAA8CAIAAAAiz+n/AAAAoUlEQVR4nO3QwQmAMBAAwZRgy5ZlL5bgXxEfFiCYECGRy8AWsEw6zksNSt0PBgk06FiBBh0r0KBj1QF63bc/BBo0aNCgQYMG/Wxa5vdAgwYNGjRo0KBBgwYNGjRo0AXQWcfvgQYNGjRo0KBBgwYNGjRo0KALqnDMBho0aNCgQYMGDRo0aNCgQYNuEmjQoEGDBg06PPSYgQYdK9CgYwUadKxu0WmE/OtPHSMAAAAASUVORK5CYII='

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [profileUpdating, setProfileUpdating] = useState(false)
  const [apiUpdating, setApiUpdating] = useState(false)
  const [profileBanner, setProfileBanner] = useState<BannerState | null>(null)
  const [apiBanner, setApiBanner] = useState<BannerState | null>(null)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [userId, setUserId] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [hasStoredApiKey, setHasStoredApiKey] = useState(false)
  const [companyName, setCompanyName] = useState('')
  const [companyLogoUrl, setCompanyLogoUrl] = useState('')
  const [osgbName, setOsgbName] = useState('')
  const [osgbLogoUrl, setOsgbLogoUrl] = useState('')
  const [inspectorTitle, setInspectorTitle] = useState('İş Güvenliği Uzmanı')
  const [certificateNo, setCertificateNo] = useState('')
  const [isgUpdating, setIsgUpdating] = useState(false)
  const [isgBanner, setIsgBanner] = useState<BannerState | null>(null)
  const { theme, setTheme } = useTheme()

  const trimmedName = fullName.trim()
  const trimmedApiKey = apiKey.trim()

  const nameError = useMemo(() => {
    if (!trimmedName) return 'Ad Soyad alanı boş bırakılamaz.'
    if (trimmedName.length < 3) return 'Ad Soyad en az 3 karakter olmalıdır.'
    if (trimmedName.length > 80) return 'Ad Soyad en fazla 80 karakter olabilir.'
    return ''
  }, [trimmedName])

  const apiKeyError = useMemo(() => {
    if (!trimmedApiKey) return ''
    if (!trimmedApiKey.startsWith('AIza')) return 'Gemini anahtarı AIza ile başlamalıdır.'
    if (trimmedApiKey.length < 30) return 'Gemini anahtarı beklenenden kısa görünüyor.'
    return ''
  }, [trimmedApiKey])

  useEffect(() => {
    async function getProfile() {
      const timer = createDevTimer('dashboard-settings')
      setProfileBanner({
        state: 'loading',
        title: 'Profil yükleniyor',
        message: 'Hesap bilgileri getiriliyor.',
      })

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()
        timer.mark('auth-ready', { hasUser: Boolean(user), hasAuthError: Boolean(authError) })

        if (authError || !user) {
          throw authError ?? new Error('Oturum bulunamadı.')
        }

        setEmail(user.email || '')
        setUserId(user.id)

        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, gemini_api_key, company_name, company_logo_url, osgb_name, osgb_logo_url, inspector_title, certificate_no')
          .eq('id', user.id)
          .single()

        if (error) throw error

        setFullName(data?.full_name || '')
        const hasSavedISG = Boolean(data?.company_name || data?.osgb_name || data?.certificate_no)
        if (hasSavedISG) {
          setCompanyName(data?.company_name || '')
          setCompanyLogoUrl(data?.company_logo_url || '')
          setOsgbName(data?.osgb_name || '')
          setOsgbLogoUrl(data?.osgb_logo_url || '')
          setInspectorTitle(data?.inspector_title || 'A Sınıfı İş Güvenliği Uzmanı')
          setCertificateNo(data?.certificate_no || '')
        } else {
          setCompanyName('Bölen İnşaat ve Taahhüt A.Ş.')
          setCompanyLogoUrl(SAMPLE_COMPANY_LOGO)
          setOsgbName('Kuzey Ortak Sağlık Güvenlik Birimi (OSGB)')
          setOsgbLogoUrl(SAMPLE_OSGB_LOGO)
          setInspectorTitle('A Sınıfı İş Güvenliği Uzmanı')
          setCertificateNo('142857')
        }
        setHasStoredApiKey(Boolean(data?.gemini_api_key))
        setApiKey('')
        setProfileBanner(null)
        timer.mark('profile-ready', { hasProfile: Boolean(data), hasKey: Boolean(data?.gemini_api_key) })
      } catch (error) {
        const message = getReadableErrorMessage(error, 'Profil bilgileri alınamadı.')
        setProfileBanner({ state: 'error', title: 'Profil yüklenemedi', message })
        toast.error(message)
        timer.mark('profile-error')
      } finally {
        setLoading(false)
        timer.end()
      }
    }

    getProfile()
  }, [])

  const updateProfile = async () => {
    if (!userId || nameError) {
      setProfileBanner({
        state: 'error',
        title: 'Profil kaydedilemedi',
        message: nameError || 'Oturum bulunamadı.',
      })
      return
    }

    setProfileUpdating(true)
    setProfileBanner({
      state: 'loading',
      title: 'Profil güncelleniyor',
      message: 'Değişiklikler kaydediliyor.',
    })

    try {
      const { error } = await supabase.from('profiles').upsert({
        id: userId,
        full_name: trimmedName,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error

      setProfileBanner({
        state: 'success',
        title: 'Profil güncellendi',
        message: 'Hesap bilgileriniz başarıyla kaydedildi.',
      })
      toast.success('Profil güncellendi.')
    } catch (error) {
      const message = getReadableErrorMessage(error, 'Profil güncellenemedi.')
      setProfileBanner({ state: 'error', title: 'Profil güncellenemedi', message })
      toast.error(message)
    } finally {
      setProfileUpdating(false)
    }
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'company' | 'osgb') => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo dosyası en fazla 2MB olabilir.')
      return
    }
    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      if (target === 'company') setCompanyLogoUrl(base64)
      else setOsgbLogoUrl(base64)
      toast.success(`${target === 'company' ? 'Firma' : 'OSGB'} logosu seçildi. Kaydetmeyi unutmayın.`)
    }
    reader.readAsDataURL(file)
  }

  const updateIsgProfile = async () => {
    if (!userId) {
      setIsgBanner({ state: 'error', title: 'Hata', message: 'Oturum bulunamadı.' })
      return
    }

    setIsgUpdating(true)
    setIsgBanner({ state: 'loading', title: 'Kaydediliyor', message: 'İSG ve kurumsal bilgiler kaydediliyor.' })

    try {
      const { error } = await supabase.from('profiles').upsert({
        id: userId,
        company_name: companyName.trim() || null,
        company_logo_url: companyLogoUrl || null,
        osgb_name: osgbName.trim() || null,
        osgb_logo_url: osgbLogoUrl || null,
        inspector_title: inspectorTitle.trim() || 'İş Güvenliği Uzmanı',
        certificate_no: certificateNo.trim() || null,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error

      setIsgBanner({
        state: 'success',
        title: 'Başarılı',
        message: 'İSG ve kurumsal bilgiler başarıyla kaydedildi. Rapor başlıklarında kullanılacak.',
      })
      toast.success('İSG ve kurumsal profil güncellendi.')
    } catch (error) {
      const message = getReadableErrorMessage(error, 'İSG bilgileri güncellenemedi.')
      setIsgBanner({ state: 'error', title: 'Hata', message })
      toast.error(message)
    } finally {
      setIsgUpdating(false)
    }
  }

  const fillSampleISGData = async () => {
    setInspectorTitle('A Sınıfı İş Güvenliği Uzmanı')
    setCertificateNo('142857')
    setCompanyName('Bölen İnşaat ve Taahhüt A.Ş.')
    setCompanyLogoUrl(SAMPLE_COMPANY_LOGO)
    setOsgbName('Kuzey Ortak Sağlık Güvenlik Birimi (OSGB)')
    setOsgbLogoUrl(SAMPLE_OSGB_LOGO)

    if (userId) {
      setIsgUpdating(true)
      setIsgBanner({ state: 'loading', title: 'Kaydediliyor', message: 'Örnek kurumsal İSG bilgileri kaydediliyor.' })
      try {
        const { error } = await supabase.from('profiles').upsert({
          id: userId,
          inspector_title: 'A Sınıfı İş Güvenliği Uzmanı',
          certificate_no: '142857',
          company_name: 'Bölen İnşaat ve Taahhüt A.Ş.',
          company_logo_url: SAMPLE_COMPANY_LOGO,
          osgb_name: 'Kuzey Ortak Sağlık Güvenlik Birimi (OSGB)',
          osgb_logo_url: SAMPLE_OSGB_LOGO,
          updated_at: new Date().toISOString(),
        })

        if (error) throw error

        setIsgBanner({
          state: 'success',
          title: 'Örnek Bilgiler Kaydedildi',
          message: 'Firma, OSGB ve uzman bilgileri başarıyla kaydedildi.',
        })
        toast.success('Örnek kurumsal İSG bilgileri başarıyla kaydedildi!')
      } catch (err) {
        const message = getReadableErrorMessage(err, 'Bilgiler kaydedilemedi.')
        setIsgBanner({ state: 'error', title: 'Hata', message })
        toast.error(message)
      } finally {
        setIsgUpdating(false)
      }
    }
  }

  const updateApiKey = async () => {
    if (!userId || apiKeyError) {
      setApiBanner({
        state: 'error',
        title: 'Anahtar kaydedilemedi',
        message: apiKeyError || 'Oturum bulunamadı.',
      })
      return
    }

    setApiUpdating(true)
    setApiBanner({
      state: 'loading',
      title: 'API anahtarı güncelleniyor',
      message: 'Güvenli şekilde kaydediliyor.',
    })

    try {
      const res = await fetch('/api/settings/api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: trimmedApiKey }),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error || 'API anahtarı kaydedilemedi.')
      }

      setApiKey('')
      setHasStoredApiKey(Boolean(data.hasApiKey))
      setApiBanner({
        state: 'success',
        title: 'API anahtarı güncellendi',
        message: data.hasApiKey
          ? 'Yeni anahtar güvenli şekilde kaydedildi.'
          : 'Kayıtlı API anahtarı kaldırıldı.',
      })
      toast.success('API anahtarı güncellendi.')
    } catch (error) {
      const message = getReadableErrorMessage(error, 'API anahtarı güncellenemedi.')
      setApiBanner({ state: 'error', title: 'API anahtarı güncellenemedi', message })
      toast.error(message)
    } finally {
      setApiUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <div className="h-7 w-36 rounded-md bg-muted animate-pulse" />
        <div className="h-4 w-64 rounded-md bg-muted/80 animate-pulse" />
        <div className="h-64 w-full rounded-xl border bg-muted/40 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Ayarlar</h1>
        <p className="text-sm text-muted-foreground mt-1">Hesabınızı ve uygulama tercihlerinizi yönetin.</p>
      </div>

      <Tabs defaultValue="account" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:w-[580px] mb-6">
          <TabsTrigger value="account" className="flex items-center gap-2">
            <Settings className="h-4 w-4" /> Hesap
          </TabsTrigger>
          <TabsTrigger value="isg" className="flex items-center gap-2">
            <HardHat className="h-4 w-4" /> İSG & Firma
          </TabsTrigger>
          <TabsTrigger value="app" className="flex items-center gap-2">
            <Palette className="h-4 w-4" /> Görünüm
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <Shield className="h-4 w-4" /> API
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Hesap Bilgileri</CardTitle>
              <CardDescription>Profil bilgilerinizi buradan güncelleyebilirsiniz.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {profileBanner ? (
                <StatusBanner state={profileBanner.state} title={profileBanner.title} message={profileBanner.message} />
              ) : null}

              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20 border-2 border-border">
                  <AvatarImage src="" />
                  <AvatarFallback className="text-xl bg-muted">
                    {trimmedName ? trimmedName[0].toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-2">
                  <h3 className="font-medium">Profil Fotoğrafı</h3>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-sm text-muted-foreground flex items-center gap-2 cursor-help bg-muted/50 px-3 py-1 rounded-full w-fit">
                          <Info className="h-3 w-3" />
                          Otomatik Yönetilir
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Profil fotoğrafı Gravatar üzerinden e-posta adresinize göre otomatik çekilir.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              <div className="grid gap-4 max-w-sm">
                <div className="space-y-2">
                  <Label htmlFor="name">Ad Soyad</Label>
                  <Input
                    id="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="bg-background"
                    maxLength={80}
                  />
                  <div className="flex items-center justify-between">
                    {nameError ? <p className="text-xs text-red-600">{nameError}</p> : <span />}
                    <p className="text-xs text-muted-foreground">{trimmedName.length}/80</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-posta</Label>
                  <Input id="email" value={email} disabled className="bg-muted text-muted-foreground" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/20 border-t border-border/50 py-4">
              <Button onClick={updateProfile} disabled={profileUpdating || Boolean(nameError)}>
                {profileUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Değişiklikleri Kaydet
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="isg">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <HardHat className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>İSG & Kurumsal Ayarlar</CardTitle>
                    <CardDescription>
                      Saha raporlarınızın üst bilgisinde (Header) ve imza bölümünde yer alacak firma, OSGB ve uzman bilgileri.
                    </CardDescription>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={fillSampleISGData}
                  disabled={isgUpdating}
                  className="gap-2 border-amber-500/50 text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950/40 shrink-0"
                >
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Örnek Bilgileri Doldur
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {isgBanner ? (
                <StatusBanner state={isgBanner.state} title={isgBanner.title} message={isgBanner.message} />
              ) : null}

              <div className="space-y-4 border p-4 rounded-xl bg-card/50">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <HardHat className="h-4 w-4 text-amber-500" /> İSG Uzmanı Bilgileri
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="inspector-title">Uzmanlık Unvanı</Label>
                    <Input
                      id="inspector-title"
                      placeholder="Örn: A Sınıfı İş Güvenliği Uzmanı"
                      value={inspectorTitle}
                      onChange={(e) => setInspectorTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="certificate-no">İSG-KATİP Belge / Sertifika No</Label>
                    <Input
                      id="certificate-no"
                      placeholder="Örn: 142857"
                      value={certificateNo}
                      onChange={(e) => setCertificateNo(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 border p-4 rounded-xl bg-card/50">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-500" /> Hizmet Verilen Firma (Müşteri)
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="company-name">Firma / Şirket Adı</Label>
                    <Input
                      id="company-name"
                      placeholder="Örn: ABC İnşaat Sanayi ve Ticaret A.Ş."
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Firma Logosu (PDF Sol Üst Başlık)</Label>
                    <div className="flex items-center gap-4">
                      {companyLogoUrl ? (
                        <div className="relative h-16 w-32 border rounded-lg overflow-hidden bg-white flex items-center justify-center p-1">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={companyLogoUrl} alt="Firma Logosu" className="max-h-full max-w-full object-contain" />
                          <button
                            type="button"
                            onClick={() => setCompanyLogoUrl('')}
                            className="absolute top-1 right-1 p-1 bg-red-500/80 hover:bg-red-600 text-white rounded-full text-xs"
                            title="Logoyu kaldır"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="h-16 w-32 border border-dashed rounded-lg flex items-center justify-center text-xs text-muted-foreground bg-muted/30">
                          Logo Yok
                        </div>
                      )}
                      <div>
                        <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md border bg-background hover:bg-muted transition-colors">
                          <UploadCloud className="h-4 w-4" /> Logo Yükle
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleLogoUpload(e, 'company')}
                          />
                        </label>
                        <p className="text-[11px] text-muted-foreground mt-1">PNG veya JPEG, max 2MB</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 border p-4 rounded-xl bg-card/50">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-500" /> OSGB Bilgileri (Varsa)
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="osgb-name">OSGB Adı</Label>
                    <Input
                      id="osgb-name"
                      placeholder="Örn: Kuzey Ortak Sağlık Güvenlik Birimi"
                      value={osgbName}
                      onChange={(e) => setOsgbName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>OSGB Logosu (PDF Sağ Üst Başlık)</Label>
                    <div className="flex items-center gap-4">
                      {osgbLogoUrl ? (
                        <div className="relative h-16 w-32 border rounded-lg overflow-hidden bg-white flex items-center justify-center p-1">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={osgbLogoUrl} alt="OSGB Logosu" className="max-h-full max-w-full object-contain" />
                          <button
                            type="button"
                            onClick={() => setOsgbLogoUrl('')}
                            className="absolute top-1 right-1 p-1 bg-red-500/80 hover:bg-red-600 text-white rounded-full text-xs"
                            title="Logoyu kaldır"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="h-16 w-32 border border-dashed rounded-lg flex items-center justify-center text-xs text-muted-foreground bg-muted/30">
                          Logo Yok
                        </div>
                      )}
                      <div>
                        <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md border bg-background hover:bg-muted transition-colors">
                          <UploadCloud className="h-4 w-4" /> Logo Yükle
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleLogoUpload(e, 'osgb')}
                          />
                        </label>
                        <p className="text-[11px] text-muted-foreground mt-1">PNG veya JPEG, max 2MB</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/20 border-t border-border/50 py-4">
              <Button onClick={updateIsgProfile} disabled={isgUpdating}>
                {isgUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                İSG Ayarlarını Kaydet
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="app">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Uygulama Tercihleri</CardTitle>
              <CardDescription>Uygulamanın görünümünü ve davranışını özelleştirin.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between space-x-2 border p-4 rounded-lg bg-card">
                <Label htmlFor="dark-mode" className="flex flex-col space-y-1 cursor-pointer">
                  <span className="font-medium">Karanlık Mod</span>
                  <span className="font-normal text-xs text-muted-foreground">Koyu temaya geçiş yap.</span>
                </Label>
                <Switch id="dark-mode" checked={theme === 'dark'} onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')} />
              </div>
              <div className="flex items-center justify-between space-x-2 border p-4 rounded-lg bg-card">
                <Label htmlFor="notifications" className="flex flex-col space-y-1 cursor-pointer">
                  <span className="font-medium">E-posta Bildirimleri</span>
                  <span className="font-normal text-xs text-muted-foreground">Rapor tamamlandığında e-posta al.</span>
                </Label>
                <Switch id="notifications" defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>API Yapılandırması</CardTitle>
              <CardDescription>Kendi Gemini API anahtarınızı kullanabilirsiniz.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {apiBanner ? <StatusBanner state={apiBanner.state} title={apiBanner.title} message={apiBanner.message} /> : null}

              <div className="space-y-2">
                <Label htmlFor="api-key">Google Gemini API Key</Label>
                <div className="relative">
                  <Input
                    id="api-key"
                    type="password"
                    placeholder="AIzaSy..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="font-mono bg-background pr-10"
                  />
                  <Shield className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                </div>

                {apiKeyError ? <p className="text-xs text-red-600">{apiKeyError}</p> : null}

                <p className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 p-3 rounded-md flex gap-2 items-start mt-2">
                  <Info className="h-4 w-4 shrink-0 mt-0.5" />
                  Anahtarınız veritabanında şifreli saklanır. Boş bırakıp güncellerseniz kayıtlı anahtar kaldırılır.
                </p>

                {hasStoredApiKey && !trimmedApiKey ? (
                  <p className="text-xs text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-300 p-3 rounded-md">
                    Kayıtlı bir API anahtarı mevcut.
                  </p>
                ) : null}
              </div>
            </CardContent>
            <CardFooter className="bg-muted/20 border-t border-border/50 py-4">
              <Button onClick={updateApiKey} disabled={apiUpdating || Boolean(apiKeyError)}>
                {apiUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Anahtarı Güncelle
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

