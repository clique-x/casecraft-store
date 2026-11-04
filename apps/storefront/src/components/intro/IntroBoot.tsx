import { introBootScript } from './intro-boot';

/**
 * The brand intro's controller, inline in <head> so it runs before first paint. It does nothing outside the
 * home page or after the first visit in a tab session.
 */
export function IntroBoot() {
  return <script id="gh-intro-boot" dangerouslySetInnerHTML={{ __html: introBootScript() }} />;
}

export default IntroBoot;
