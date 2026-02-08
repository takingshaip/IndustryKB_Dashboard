import { redirect } from 'next/navigation'
import {
  createSessionCookie,
  isAuthenticated,
  isLoginConfigured,
  setSessionCookie,
  validateCredentials,
} from '@/lib/auth'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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

type LoginPageProps = {
  searchParams?: { error?: string | string[] }
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  if (await isAuthenticated()) {
    redirect('/')
  }

  const loginConfigured = isLoginConfigured()
  const errorParam = Array.isArray(searchParams?.error)
    ? searchParams?.error[0]
    : searchParams?.error

  async function loginAction(formData: FormData) {
    'use server'
    if (!isLoginConfigured()) {
      redirect('/login?error=config')
    }

    const readField = (key: string) => {
      const direct = formData.get(key)
      if (direct !== null) {
        return String(direct)
      }
      const matchKey = Array.from(formData.keys()).find((name) =>
        name.endsWith(`_${key}`),
      )
      return matchKey ? String(formData.get(matchKey) ?? '') : ''
    }

    const username = readField('username').trim()
    const password = readField('password')

    if (!validateCredentials(username, password)) {
      redirect('/login?error=invalid')
    }

    const session = createSessionCookie(username)
    await setSessionCookie(session)
    redirect('/')
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-(--color-background)">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(8,145,178,0.12),_transparent_55%)]" />
      <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-amber-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 left-0 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-(--color-muted-foreground)">
              Aibiliti
            </p>
            <h1 className="mt-3 text-balance text-3xl font-semibold">
              Knowledge Base Dashboard
            </h1>
            <p className="mt-2 text-sm text-(--color-muted-foreground)">
              Sign in to create and manage industry knowledge bases.
            </p>
          </div>

          <Card className="border border-(--color-border) bg-(--color-card)">
            <CardHeader>
              <CardTitle>Sign in</CardTitle>
              <CardDescription>
                Use the environment credentials configured for this instance.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {errorParam === 'invalid' && (
                <Alert variant="destructive">
                  <AlertTitle>Invalid credentials</AlertTitle>
                  <AlertDescription>
                    The username or password you entered is incorrect.
                  </AlertDescription>
                </Alert>
              )}
              {(!loginConfigured || errorParam === 'config') && (
                <Alert variant="destructive">
                  <AlertTitle>Login not configured</AlertTitle>
                  <AlertDescription>
                    Set the login environment variables before signing in.
                  </AlertDescription>
                </Alert>
              )}

              <form action={loginAction} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    autoComplete="username"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={!loginConfigured}>
                  Sign in
                </Button>
              </form>
            </CardContent>
            <CardFooter className="text-xs text-(--color-muted-foreground)">
              Session expires after 8 hours.
            </CardFooter>
          </Card>
        </div>
      </div>
    </main>
  )
}
