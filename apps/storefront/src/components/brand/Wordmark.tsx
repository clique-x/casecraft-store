import { BRAND_NAME } from '@/lib/brand';
import { cn } from '@/lib/utils';

/** "GadgetsHub" with the last word in brand teal; falls back to the plain name for other brand names. */
export function Wordmark({ className, hubClassName }: { className?: string; hubClassName?: string }) {
  const m = /^(.*?)(Hub)$/.exec(BRAND_NAME);
  return (
    <span className={cn('font-sans leading-none font-extrabold tracking-[-0.02em]', className)}>
      {m ? (
        <>
          {m[1]}
          <span className={cn('text-brand', hubClassName)}>{m[2]}</span>
        </>
      ) : (
        BRAND_NAME
      )}
    </span>
  );
}
