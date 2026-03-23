'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type AuthMode = 'login' | 'signup';
type Role = 'hod' | 'staff' | 'students';

const roleOptions: Array<{ value: Role; label: string }> = [
  { value: 'hod', label: 'HOD' },
  { value: 'staff', label: 'Staff' },
  { value: 'students', label: 'Students' },
];

const roleRouteMap: Record<Role, string> = {
  hod: '/hod',
  staff: '/staff',
  students: '/student',
};

const roleDescription: Record<Role, string> = {
  hod: 'Manage dashboards and monitor student risk insights.',
  staff: 'Track classes, progress, and academic support actions.',
  students: 'Continue your syllabus tracking and study planning journey.',
};

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('students');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | null>(null);

  const title = useMemo(
    () => (mode === 'login' ? 'Welcome back to Cursus' : 'Create your Cursus account'),
    [mode]
  );

  const subtitle = useMemo(() => {
    const prefix = mode === 'login' ? 'Log in as' : 'Sign up as';
    return `${prefix} ${roleOptions.find((option) => option.value === role)?.label}. ${roleDescription[role]}`;
  }, [mode, role]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);
    setFeedbackType(null);

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
      const payload =
        mode === 'login'
          ? { email, password, role }
          : { name, email, password, role };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setFeedback(data.message ?? 'Request failed.');
        setFeedbackType('error');
        return;
      }

      if (mode === 'signup') {
        setFeedback('Account created. You can now log in.');
        setFeedbackType('success');
        setMode('login');
        return;
      }

      setFeedbackType('success');
      setFeedback('Login successful. Redirecting...');

      const userRole = (data.user?.role as Role | undefined) ?? role;
      router.push(roleRouteMap[userRole]);
    } catch {
      setFeedback('Something went wrong. Please try again.');
      setFeedbackType('error');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-app-bg px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-neutral-200/60 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-neutral-300/40 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="border border-app-border bg-white/95 shadow-xl backdrop-blur-sm">
          <CardHeader className="space-y-4 border-b border-app-border pb-5">
            <div className="flex items-center justify-between">
              <Link href="/" className="text-sm font-medium text-app-muted hover:text-app-text">
                Back to home
              </Link>
              <div className="inline-flex rounded-lg border border-app-border bg-neutral-50 p-1">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                    mode === 'login'
                      ? 'bg-black text-white'
                      : 'text-app-muted hover:text-app-text'
                  }`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                    mode === 'signup'
                      ? 'bg-black text-white'
                      : 'text-app-muted hover:text-app-text'
                  }`}
                >
                  Sign up
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-app-text">Account type</label>
              <Tabs value={role} onValueChange={(value) => setRole(value as Role)}>
                <TabsList className="h-auto w-full rounded-lg border border-app-border bg-neutral-50 p-1">
                  {roleOptions.map((option) => (
                    <TabsTrigger
                      key={option.value}
                      value={option.value}
                      className="rounded-md px-3 py-1.5 text-xs font-semibold data-[state=active]:bg-black data-[state=active]:text-white"
                    >
                      {option.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            <div>
              <CardTitle className="text-2xl font-bold tracking-tight">{title}</CardTitle>
              <p className="mt-1 text-sm text-app-muted">{subtitle}</p>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-app-text" htmlFor="name">
                    Full name
                  </label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="John Mathew"
                    required
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-app-text" htmlFor="email">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-app-text" htmlFor="password">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  minLength={8}
                  required
                />
              </div>

              {feedback && (
                <p
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    feedbackType === 'success'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-red-200 bg-red-50 text-red-700'
                  }`}
                >
                  {feedback}
                </p>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-10 w-full rounded-lg bg-black text-white hover:bg-neutral-800"
              >
                {isSubmitting
                  ? 'Please wait...'
                  : mode === 'login'
                    ? 'Login'
                    : 'Create account'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
