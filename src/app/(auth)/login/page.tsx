'use client'

import { useState } from 'react'
import Link from "next/link"
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileText, Loader2, AlertCircle, Mail, Lock, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get('tab') === 'register' ? 'register' : 'login'

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      })
      if (error) throw error
    } catch (err) {
      setError((err as Error).message)
      setIsLoading(false)
    }
  }

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>, type: 'login' | 'register') => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      if (type === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/dashboard')
        router.refresh()
      } else {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: email.split('@')[0], // Default name
                    plan_type: 'free'
                }
            }
        })
        if (error) throw error
        setSuccess('Kayıt başarılı! Lütfen e-posta adresinizi doğrulayın (Eğer onay e-postası gelmediyse Supabase panelinden e-posta onayını kapatabilirsiniz).')
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container relative h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      {/* Left Side - Visual & Testimonial */}
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <Link href="/" className="flex items-center gap-2">
             <div className="h-8 w-8 rounded bg-white text-zinc-900 flex items-center justify-center">
                <FileText className="h-5 w-5" />
             </div>
             <span>Rapor Asistanı</span>
          </Link>
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;Rapor Asistanı ile toplantı notlarımı saniyeler içinde düzenli raporlara dönüştürebiliyorum. Bana haftada en az 5 saat kazandırdı.&rdquo;
            </p>
            <footer className="text-sm">Sofia Davis, Ürün Yöneticisi</footer>
          </blockquote>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
      </div>

      {/* Right Side - Auth Form */}
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          {/* Mobile Header */}
          <div className="flex flex-col space-y-2 text-center lg:hidden">
             <Link href="/" className="flex items-center justify-center gap-2 font-bold text-xl mb-4">
                <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary-foreground" />
                </div>
                <span>Rapor Asistanı</span>
             </Link>
          </div>

          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Hesabınıza Erişin
            </h1>
            <p className="text-sm text-muted-foreground">
              Raporlarınızı yönetmek için giriş yapın veya kayıt olun.
            </p>
          </div>

          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Giriş Yap</TabsTrigger>
              <TabsTrigger value="register">Kayıt Ol</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <div className="grid gap-6">
                <form onSubmit={(e) => handleAuth(e, 'login')}>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="email">E-posta</Label>
                      <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input id="email" name="email" type="email" placeholder="ornek@sirket.com" className="pl-9" required />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="password">Şifre</Label>
                      <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input id="password" name="password" type="password" className="pl-9" required />
                      </div>
                    </div>
                    <Button disabled={isLoading}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Giriş Yap
                    </Button>
                  </div>
                </form>
              </div>
            </TabsContent>

            <TabsContent value="register">
                <div className="grid gap-6">
                <form onSubmit={(e) => handleAuth(e, 'register')}>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="email">E-posta</Label>
                      <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input id="email" name="email" type="email" placeholder="ornek@sirket.com" className="pl-9" required />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="password">Şifre</Label>
                      <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input id="password" name="password" type="password" className="pl-9" required minLength={6} />
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" /> En az 6 karakter</div>
                        <div className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" /> Ücretsiz plan</div>
                    </div>
                    <Button disabled={isLoading}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Hesap Oluştur
                    </Button>
                  </div>
                </form>
              </div>
            </TabsContent>
          </Tabs>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                veya
              </span>
            </div>
          </div>

          <Button variant="outline" type="button" disabled={isLoading} onClick={handleGoogleLogin} className="w-full">
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                    <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                </svg>
            )}
            Google ile devam et
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="bg-green-50 text-green-900 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <p className="px-8 text-center text-sm text-muted-foreground">
            Devam ederek, <Link href="#" className="underline underline-offset-4 hover:text-primary">Kullanım Şartları</Link> ve <Link href="#" className="underline underline-offset-4 hover:text-primary">Gizlilik Politikamızı</Link> kabul etmiş olursunuz.
          </p>
        </div>
      </div>
    </div>
  )
}
