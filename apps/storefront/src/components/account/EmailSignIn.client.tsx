'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Mail } from 'lucide-react';
import { requestSignInCode, verifySignInCode } from '@/lib/account/actions';

const INPUT =
  'h-12 w-full rounded-[10px] border border-border bg-paper px-3.5 text-base text-fg outline-none transition-colors focus:border-fg focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand';
const BUTTON =
  'inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-[10px] bg-fg px-6 text-sm font-semibold text-paper hover:bg-[#2b2b2b] disabled:bg-fg/50';
const RESEND_AFTER_S = 30;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Sign-in without a password: the shopper types the email they ordered with, we email a 6-digit code, and
 * the code signs them in on this browser. Every order already made an account for that email.
 */
export function EmailSignIn({ initialEmail = '' }: { initialEmail?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (wait <= 0) return;
    const id = window.setTimeout(() => setWait((w) => w - 1), 1000);
    return () => window.clearTimeout(id);
  }, [wait]);

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const to = email.trim().toLowerCase();
    if (!EMAIL_RE.test(to)) return setError('Enter a valid email address.');
    setBusy(true);
    setError(null);
    const res = await requestSignInCode(to);
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setSentTo(to);
    setCode('');
    setWait(RESEND_AFTER_S);
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sentTo || code.length !== 6) return;
    setBusy(true);
    setError(null);
    const res = await verifySignInCode(sentTo, code);
    if (!res.ok) {
      setBusy(false);
      return setError(res.error);
    }
    router.refresh();
  };

  if (!sentTo) {
    return (
      <form onSubmit={send} className="flex flex-col gap-3" noValidate>
        <label htmlFor="signin-email" className="text-sm font-medium text-fg">
          Email you ordered with
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="signin-email"
            className={INPUT}
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit" disabled={busy} className={BUTTON}>
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Mail className="size-4" aria-hidden="true" />}
            Email me a code
          </button>
        </div>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
      </form>
    );
  }

  return (
    <form onSubmit={verify} className="flex flex-col gap-3" noValidate>
      <label htmlFor="signin-code" className="text-sm text-fg">
        Enter the 6-digit code we emailed to <strong className="break-all">{sentTo}</strong>
      </label>
      <div className="flex gap-3">
        <input
          id="signin-code"
          className={`${INPUT} max-w-[11rem] text-center text-lg font-bold tracking-[0.35em] tabular-nums`}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          autoFocus
        />
        <button type="submit" disabled={busy || code.length !== 6} className={BUTTON}>
          {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          Sign in
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <p className="text-caption text-fg-muted">Not in your inbox? Check spam or promotions. The code works for 10 minutes.</p>
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-caption font-semibold">
        <button
          type="button"
          onClick={() => void send()}
          disabled={wait > 0 || busy}
          className="text-brand underline-offset-4 hover:underline disabled:text-fg-muted disabled:no-underline"
        >
          {wait > 0 ? `Resend code in ${wait}s` : 'Resend code'}
        </button>
        <button
          type="button"
          onClick={() => {
            setSentTo(null);
            setError(null);
          }}
          className="text-brand underline-offset-4 hover:underline"
        >
          Use a different email
        </button>
      </div>
    </form>
  );
}
