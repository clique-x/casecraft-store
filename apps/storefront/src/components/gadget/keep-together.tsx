import { Fragment, type ReactNode } from 'react';

/** Terms that read wrong when a line breaks at their hyphen ("USB-" / "C", "Wi-" / "Fi"). */
const TERMS = /(USB-C|USB-A|Wi-Fi|M\.2)/;

/** Wraps connector names in a no-wrap span so titles never break inside them. */
export function keepTogether(text: string): ReactNode {
  return text.split(TERMS).map((part, i) =>
    TERMS.test(part) ? (
      <span key={i} className="whitespace-nowrap">
        {part}
      </span>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}
