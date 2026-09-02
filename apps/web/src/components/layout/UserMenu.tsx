import { useState } from 'react';
import { LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAuth } from '@/features/auth/useAuth';
import { ApiError } from '@/lib/api';

export function UserMenu() {
  const { user, logout } = useAuth();

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <div className="hidden text-right sm:block">
          <div className="text-xs font-500 leading-tight">{user.name}</div>
          <Badge tone={user.role === 'admin' ? 'signal' : 'neutral'}>{user.role}</Badge>
        </div>
        <Button variant="ghost" size="icon" onClick={logout} aria-label="Sign out" title="Sign out">
          <LogOut />
        </Button>
      </div>
    );
  }

  return <SignInDialog />;
}

function SignInDialog() {
  const { login, register } = useAuth();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const email = String(form.get('email'));
    const password = String(form.get('password'));

    try {
      if (mode === 'login') {
        await login({ email, password });
      } else {
        await register({ name: String(form.get('name')), email, password });
      }
      setOpen(false);
      toast.success(mode === 'login' ? 'Signed in' : 'Account created');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach the server');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <LogIn />
          Sign in
        </Button>
      </DialogTrigger>

      <DialogContent className="w-[min(420px,calc(100vw-2rem))]">
        <DialogTitle>{mode === 'login' ? 'Sign in' : 'Create an account'}</DialogTitle>
        <DialogDescription>
          {mode === 'login'
            ? 'Seeded accounts use the password "password".'
            : 'The first account created becomes the admin.'}
        </DialogDescription>

        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          {mode === 'register' && (
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required minLength={2} autoComplete="name" />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              defaultValue={mode === 'login' ? 'admin@gvhax.dev' : ''}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              defaultValue={mode === 'login' ? 'password' : ''}
            />
          </div>

          {error && (
            <p role="alert" className="text-xs text-[var(--color-danger)]">
              {error}
            </p>
          )}

          <div className="flex items-center gap-2 pt-1">
            <Button type="submit" disabled={busy}>
              <UserIcon />
              {busy ? 'Working…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </Button>
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError(null);
              }}
            >
              {mode === 'login' ? 'Create an account' : 'I already have an account'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
