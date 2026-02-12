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
import { Loader2, Info, Settings, Shield, Palette } from 'lucide-react'
import { toast } from 'sonner'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { StatusBanner } from '@/components/features/status-banner'
import { getReadableErrorMessage } from '@/lib/user-feedback'

type BannerState = {
  state: 'loading' | 'success' | 'error' | 'info'
  title: string
  message?: string
}

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

        if (authError || !user) {
          throw authError ?? new Error('Oturum bulunamadı.')
        }

        setEmail(user.email || '')
        setUserId(user.id)

        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, gemini_api_key')
          .eq('id', user.id)
          .single()

        if (error) throw error

        setFullName(data?.full_name || '')
        setHasStoredApiKey(Boolean(data?.gemini_api_key))
        setApiKey('')
        setProfileBanner(null)
      } catch (error) {
        const message = getReadableErrorMessage(error, 'Profil bilgileri alınamadı.')
        setProfileBanner({ state: 'error', title: 'Profil yüklenemedi', message })
        toast.error(message)
      } finally {
        setLoading(false)
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
      <div className="p-8 flex justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
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
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px] mb-6">
          <TabsTrigger value="account" className="flex items-center gap-2">
            <Settings className="h-4 w-4" /> Hesap
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

