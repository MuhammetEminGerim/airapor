'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { supabase } from '@/lib/supabase'
import { Loader2, Info, Settings, Shield, Bell, Palette } from 'lucide-react'
import { toast } from 'sonner'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [userId, setUserId] = useState('')
  const [apiKey, setApiKey] = useState('')
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setEmail(user.email || '')
        setUserId(user.id)
        const { data } = await supabase.from('profiles').select('full_name, gemini_api_key').eq('id', user.id).single()
        if (data) {
            setFullName(data.full_name || '')
            setApiKey(data.gemini_api_key || '')
        }
      }
      setLoading(false)
    }
    getProfile()
  }, [])

  const updateProfile = async () => {
    if (!userId) return

    if (fullName.length < 3) {
        toast.error('Ad Soyad en az 3 karakter olmalıdır.')
        return
    }

    setUpdating(true)

    const updates = {
        id: userId,
        full_name: fullName,
        updated_at: new Date().toISOString(),
    }

    const { error } = await supabase.from('profiles').upsert(updates)

    if (!error) {
        toast.success('Profil güncellendi!')
    } else {
        console.error('Update Profile Error:', JSON.stringify(error, null, 2))
        toast.error('Hata oluştu: ' + (error.message || 'Bilinmeyen hata'))
    }
    setUpdating(false)
  }

  const updateApiKey = async () => {
    if (!userId) return
    setUpdating(true)

    const updates = {
        id: userId,
        gemini_api_key: apiKey,
        updated_at: new Date().toISOString(),
    }

    const { error } = await supabase.from('profiles').upsert(updates)

    if (!error) {
        toast.success('API Anahtarı güncellendi!')
    } else {
        console.error(error)
        toast.error('Hata oluştu: ' + error.message)
    }
    setUpdating(false)
  }

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-muted-foreground" /></div>

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
              <CardDescription>
                Profil bilgilerinizi buradan güncelleyebilirsiniz.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20 border-2 border-border">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-xl bg-muted">{fullName ? fullName[0].toUpperCase() : 'U'}</AvatarFallback>
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
                                <p>Profil fotoğrafınız Gravatar üzerinden e-posta adresinize göre otomatik çekilir.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
              </div>
              <div className="grid gap-4 max-w-sm">
                <div className="space-y-2">
                    <Label htmlFor="name">Ad Soyad</Label>
                    <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-background" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">E-posta</Label>
                    <Input id="email" value={email} disabled className="bg-muted text-muted-foreground" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/20 border-t border-border/50 py-4">
              <Button onClick={updateProfile} disabled={updating}>
                {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Değişiklikleri Kaydet
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="app">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Uygulama Tercihleri</CardTitle>
              <CardDescription>
                Uygulamanın görünümünü ve davranışını özelleştirin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="flex items-center justify-between space-x-2 border p-4 rounded-lg bg-card">
                  <Label htmlFor="dark-mode" className="flex flex-col space-y-1 cursor-pointer">
                    <span className="font-medium">Karanlık Mod</span>
                    <span className="font-normal text-xs text-muted-foreground">Göz yormayan koyu temaya geçiş yap.</span>
                  </Label>
                  <Switch
                    id="dark-mode"
                    checked={theme === 'dark'}
                    onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                  />
                </div>
                <div className="flex items-center justify-between space-x-2 border p-4 rounded-lg bg-card">
                  <Label htmlFor="notifications" className="flex flex-col space-y-1 cursor-pointer">
                    <span className="font-medium">E-posta Bildirimleri</span>
                    <span className="font-normal text-xs text-muted-foreground">Rapor tamamlandığında mail al.</span>
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
              <CardDescription>
                Kendi Google Gemini API anahtarınızı kullanarak limitlere takılmadan işlem yapın.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                <p className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 p-3 rounded-md flex gap-2 items-start mt-2">
                    <Info className="h-4 w-4 shrink-0 mt-0.5" />
                    Kendi anahtarınızı girerseniz, sistem varsayılan anahtar yerine sizin anahtarınızı kullanacaktır. Bu sayede daha yüksek hız limitlerine sahip olabilirsiniz.
                </p>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/20 border-t border-border/50 py-4">
              <Button onClick={updateApiKey} disabled={updating}>
                {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Anahtarı Güncelle
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
