'use client'

import { useEffect, useState } from 'react'
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
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [userId, setUserId] = useState('')

  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setEmail(user.email || '')
        setUserId(user.id)
        const { data } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
        if (data) setFullName(data.full_name || '')
      }
      setLoading(false)
    }
    getProfile()
  }, [])

  const updateProfile = async () => {
    if (!userId) return
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
        console.error(error)
        toast.error('Hata oluştu: ' + error.message)
    }
    setUpdating(false)
  }

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-muted-foreground" /></div>

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Ayarlar</h1>
      </div>

      <Tabs defaultValue="account" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="account">Hesap</TabsTrigger>
          <TabsTrigger value="app">Uygulama</TabsTrigger>
          <TabsTrigger value="api">API & Entegrasyon</TabsTrigger>
        </TabsList>

        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Hesap Bilgileri</CardTitle>
              <CardDescription>
                Profil bilgilerinizi buradan güncelleyebilirsiniz.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-xl">{fullName ? fullName[0].toUpperCase() : 'U'}</AvatarFallback>
                </Avatar>
                <Button variant="outline" disabled>Fotoğrafı Değiştir (Yakında)</Button>
              </div>
              <div className="space-y-1">
                <Label htmlFor="name">Ad Soyad</Label>
                <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email">E-posta</Label>
                <Input id="email" value={email} disabled />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={updateProfile} disabled={updating}>
                {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Değişiklikleri Kaydet
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="app">
          <Card>
            <CardHeader>
              <CardTitle>Uygulama Ayarları</CardTitle>
              <CardDescription>
                Görünüm ve bildirim tercihleri.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="dark-mode" className="flex flex-col space-y-1">
                    <span>Karanlık Mod</span>
                    <span className="font-normal text-xs text-muted-foreground">Uygulamayı koyu temada kullan.</span>
                  </Label>
                  <Switch id="dark-mode" disabled />
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="notifications" className="flex flex-col space-y-1">
                    <span>E-posta Bildirimleri</span>
                    <span className="font-normal text-xs text-muted-foreground">Rapor tamamlandığında mail al.</span>
                  </Label>
                  <Switch id="notifications" defaultChecked />
                </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>API Anahtarları</CardTitle>
              <CardDescription>
                Kendi Google Gemini API anahtarınızı buradan yönetebilirsiniz.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="api-key">Google Gemini API Key</Label>
                <Input id="api-key" type="password" placeholder="AIzaSy..." disabled />
                <p className="text-xs text-muted-foreground">
                    Bu ayar şimdilik .env dosyasından yönetilmektedir.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="secondary" disabled>Anahtarı Güncelle</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
