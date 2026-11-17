'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from '@/lib/account/actions';

export function SignOutButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await signOut();
          router.refresh();
        })
      }
      className="font-semibold text-brand underline-offset-4 hover:underline disabled:opacity-60"
    >
      Sign out
    </button>
  );
}
