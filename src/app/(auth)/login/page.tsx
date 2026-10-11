'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { HardHat, Loader2, AlertCircle, Mail, Lock, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getReadableErrorMessage, isValidEmail } from '@/lib/user-feedback'
import { StatusBanner } from '@/components/features/status-banner'

type AuthMode = 'login' | 'register'

type FormErrors = {
  email?: string
  password?: string
}

export default function LoginPage() {
  const [authLoading, setAuthLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get('tab') === 'register' ? 'register' : 'login'

  const validateForm = (email: string, password: string, mode: AuthMode): FormErrors => {
    const nextErrors: FormErrors = {}

    if (!isValidEmail(email)) {
      nextErrors.email = 'Geçerli bir e-posta adresi girin.'
    }

    if (!password || password.length < 6) {
      nextErrors.password = 'Şifre en az 6 karakter olmalıdır.'
    }

    if (mode === 'login' && !password) {
      nextErrors.password = 'Şifre alanı zorunludur.'
    }

    return nextErrors
  }

  const handleGoogleLogin = async () => {
    setOauthLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (oauthError) throw oauthError
    } catch (err) {
      setError(getReadableErrorMessage(err, 'Google ile giriş sırasında bir sorun oluştu.'))
      setOauthLoading(false)
    }
  }

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>, type: AuthMode) => {
    e.preventDefault()
    setAuthLoading(true)
    setError(null)
    setSuccess(null)

    const formData = new FormData(e.currentTarget)
    const email = String(formData.get('email') ?? '').trim()
    const password = String(formData.get('password') ?? '')

    const nextErrors = validateForm(email, password, type)
    setFormErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setAuthLoading(false)
      return
    }

    try {
      if (type === 'login') {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) throw signInError

        router.push('/dashboard')
        router.refresh()
        return
      }

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: email.split('@')[0],
            plan_type: 'free',
          },
        },
      })

      if (signUpError) throw signUpError

      if (signUpData?.session) {
        router.push('/dashboard')
        router.refresh()
        return
      }

      setSuccess('Kayıt başarılı. E-posta doğrulaması sonrası giriş yapabilirsiniz.')
      setFormErrors({})
    } catch (err) {
      setError(getReadableErrorMessage(err))
    } finally {
      setAuthLoading(false)
    }
  }

  return (
    <div className="container relative h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-amber-600 text-white flex items-center justify-center">
              <HardHat className="h-5 w-5" />
            </div>
            <span>İSG Asistanı</span>
          </Link>
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;Şantiyede çektiğim uygunsuzluk fotoğraflarını 6331 sayılı kanuna ve Yapı İşleri Yönetmeliğine uygun resmi denetim raporlarına saniyeler içinde dönüştürüyor.&rdquo;
            </p>
            <footer className="text-sm">Murat Yıldırım, A Sınıfı İSG Baş Denetçisi</footer>
          </blockquote>
        </div>
      </div>

      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center lg:hidden">
            <Link href="/" className="flex items-center justify-center gap-2 font-bold text-xl mb-4">
              <div className="h-8 w-8 rounded bg-amber-600 text-white flex items-center justify-center">
                <HardHat className="h-5 w-5" />
              </div>
              <span>İSG Asistanı</span>
            </Link>
          </div>

          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Hesabınıza Erişin</h1>
            <p className="text-sm text-muted-foreground">Giriş yapın veya yeni bir hesap oluşturun.</p>
          </div>

          {(authLoading || oauthLoading) && (
            <StatusBanner
              state="loading"
              title="İşlem sürüyor"
              message="Kimlik doğrulama işlemi tamamlanana kadar lütfen bekleyin."
            />
          )}

          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Giriş Yap</TabsTrigger>
              <TabsTrigger value="register">Kayıt Ol</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={(e) => handleAuth(e, 'login')} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="login-email">E-posta</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-email"
                      name="email"
                      type="email"
                      placeholder="ornek@sirket.com"
                      className="pl-9"
                      required
                      autoComplete="email"
                    />
                  </div>
                  {formErrors.email ? <p className="text-xs text-red-600">{formErrors.email}</p> : null}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="login-password">Şifre</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-password"
                      name="password"
                      type="password"
                      className="pl-9"
                      required
                      autoComplete="current-password"
                    />
                  </div>
                  {formErrors.password ? <p className="text-xs text-red-600">{formErrors.password}</p> : null}
                </div>

                <Button disabled={authLoading || oauthLoading}>
                  {authLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Giriş Yap
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={(e) => handleAuth(e, 'register')} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="register-email">E-posta</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="register-email"
                      name="email"
                      type="email"
                      placeholder="ornek@sirket.com"
                      className="pl-9"
                      required
                      autoComplete="email"
                    />
                  </div>
                  {formErrors.email ? <p className="text-xs text-red-600">{formErrors.email}</p> : null}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="register-password">Şifre</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="register-password"
                      name="password"
                      type="password"
                      className="pl-9"
                      required
                      minLength={6}
                      autoComplete="new-password"
                    />
                  </div>
                  {formErrors.password ? <p className="text-xs text-red-600">{formErrors.password}</p> : null}
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-500" /> En az 6 karakter
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-500" /> Ücretsiz plan
                  </div>
                </div>

                <Button disabled={authLoading || oauthLoading}>
                  {authLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Hesap Oluştur
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">veya</span>
            </div>
          </div>

          <Button
            variant="outline"
            type="button"
            disabled={authLoading || oauthLoading}
            onClick={handleGoogleLogin}
            className="w-full"
          >
            {oauthLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Google ile devam et
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 text-green-900 border-green-200 dark:bg-green-950/20 dark:text-green-100 dark:border-green-900/40">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <p className="px-8 text-center text-sm text-muted-foreground">
            Devam ederek{' '}
            <Link href="#" className="underline underline-offset-4 hover:text-primary">
              Kullanım Şartları
            </Link>{' '}
            ve{' '}
            <Link href="#" className="underline underline-offset-4 hover:text-primary">
              Gizlilik Politikası
            </Link>{' '}
            metinlerini kabul etmiş olursunuz.
          </p>
        </div>
      </div>
    </div>
  )
}

