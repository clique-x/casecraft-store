import { installBootScript } from '@/lib/install/install';

/**
 * Inline in <head>, so it is listening before the browser announces that the store can be installed
 * (lib/install/install.ts). It only keeps that event for the install pop-up; it shows nothing itself.
 */
export function InstallBoot() {
  return <script id="gh-install-boot" dangerouslySetInnerHTML={{ __html: installBootScript() }} />;
}

export default InstallBoot;
