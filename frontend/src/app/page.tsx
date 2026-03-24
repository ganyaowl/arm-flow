'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/login');
    else router.replace('/calendar');
  }, [user, loading, router]);

  return (
    <div className="flex flex-1 items-center justify-center p-8 text-sm text-zinc-500">Загрузка…</div>
  );
}
