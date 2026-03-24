'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';

export function AppNav() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (!user) return null;

  const link = (href: string, label: string) => (
    <Link
      href={href}
      className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        pathname === href || pathname.startsWith(href + '/')
          ? 'bg-zinc-200 dark:bg-zinc-800'
          : 'hover:bg-zinc-100 dark:hover:bg-zinc-900'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex flex-wrap items-center gap-1">
          <span className="mr-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">ArmFlow</span>
          {link('/calendar', 'Календарь')}
          {user.role === 'ADMIN' ? link('/admin', 'Админка') : null}
        </div>
        <div className="flex items-center gap-3">
          <span className="max-w-[200px] truncate text-xs text-zinc-600 dark:text-zinc-400">
            {user.name} · {user.role}
          </span>
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() => {
              logout();
              router.push('/login');
            }}
          >
            Выйти
          </Button>
        </div>
      </div>
    </header>
  );
}
