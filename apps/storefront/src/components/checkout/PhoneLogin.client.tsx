'use client';

import { useEffect, useState } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import { phoneLoginAvailable, sendLoginCode, verifyLoginCode } from '@/lib/cart/phone-login';
import type { CartAddress } from '@/lib/cart/types';
import { INPUT } from './AddressFields.client';

interface Props {
  /** 10 digits, without +91. */
  phone: string;
  onFound: (email: string | null, addresses: CartAddress[]) => void;
}

const RESEND_AFTER_S = 30;

/**
 * "Find my saved addresses": an SMS code proves the visitor owns this number, then the addresses of
 * past orders placed with it become cards. Hidden unless the backend has Twilio Verify configured.
 */
export function PhoneLogin({ phone, onFound }: Props) {
  const [available, setAvailable] = useState(false);
  const [stage, setStage] = useState<'idle' | 'sending' | 'code' | 'checking' | 'done'>('idle');
  const [code, setCode] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [wait, setWait] = useState(0);

  useEffect(() => {
    let live = true;
    phoneLoginAvailable().then((ok) => live && setAvailable(ok));
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (wait <= 0) return;
    const id = window.setTimeout(() => setWait((w) => w - 1), 1000);
    return () => window.clearTimeout(id);
  }, [wait]);

  const valid = /^[6-9]\d{9}$/.test(phone);
  if (!available || !valid || stage === 'done') return null;
  // A different number than the one the code went to starts over.
  const codeStage = (stage === 'code' || stage === 'checking') && sentTo === phone;

  const send = async () => {
    setStage('sending');
    setMessage(null);
    const res = await sendLoginCode(phone);
    if (!res.ok) {
      setStage('idle');
      setMessage(res.error);
      return;
    }
    setSentTo(phone);
    setCode('');
    setStage('code');
    setWait(RESEND_AFTER_S);
  };

  const verify = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    if (code.length < 4) return;
    setStage('checking');
    setMessage(null);
    const res = await verifyLoginCode(phone, code);
    if (!res.ok) {
      setStage('code');
      setMessage(res.error);
      return;
    }
    setStage('done');
    onFound(res.value.email, res.value.addresses);
  };

  if (!codeStage) {
    return (
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={send}
          disabled={stage === 'sending'}
          className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-brand underline-offset-4 hover:underline disabled:opacity-60"
        >
          {stage === 'sending' ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <ShieldCheck className="size-4" aria-hidden="true" />}
          Ordered before? Find my saved addresses
        </button>
        {message && <p className="text-caption text-danger">{message}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-[10px] bg-surface-2 p-3.5">
      <p className="text-sm text-fg">
        Enter the code we sent to <strong className="tabular-nums">+91 {sentTo}</strong>
      </p>
      <div className="flex gap-2">
        <input
          className={`${INPUT} max-w-[10rem] tracking-[0.3em] tabular-nums`}
          inputMode="numeric"
          autoComplete="one-time-code"
          aria-label="Code from the SMS"
          maxLength={8}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void verify(e as unknown as React.FormEvent);
          }}
          autoFocus
        />
        <button
          type="button"
          onClick={verify}
          disabled={code.length < 4 || stage === 'checking'}
          className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-fg px-5 text-sm font-semibold text-paper hover:bg-[#2b2b2b] disabled:bg-fg/50"
        >
          {stage === 'checking' && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          Verify
        </button>
      </div>
      {message && <p className="text-caption text-danger">{message}</p>}
      <button
        type="button"
        onClick={send}
        disabled={wait > 0}
        className="self-start text-caption font-semibold text-brand underline-offset-4 hover:underline disabled:text-fg-muted disabled:no-underline"
      >
        {wait > 0 ? `Resend code in ${wait}s` : 'Resend code'}
      </button>
    </div>
  );
}
