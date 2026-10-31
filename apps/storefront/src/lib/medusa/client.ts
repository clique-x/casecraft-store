import 'server-only';
import Medusa from '@medusajs/js-sdk';

/**
 * Medusa is used when all three variables are set (see apps/storefront/.env.example);
 * otherwise the storefront keeps running on the built-in sample catalogue in fixtures.ts.
 */
const BACKEND_URL = process.env.MEDUSA_BACKEND_URL;
const PUBLISHABLE_KEY = process.env.MEDUSA_PUBLISHABLE_KEY;
export const MEDUSA_REGION_ID = process.env.MEDUSA_REGION_ID ?? '';

export const medusaEnabled = Boolean(BACKEND_URL && PUBLISHABLE_KEY && MEDUSA_REGION_ID);

if (!medusaEnabled && (BACKEND_URL || PUBLISHABLE_KEY || MEDUSA_REGION_ID)) {
  console.warn(
    '[medusa] MEDUSA_BACKEND_URL, MEDUSA_PUBLISHABLE_KEY and MEDUSA_REGION_ID must all be set; using the sample catalogue.',
  );
}

export const sdk: Medusa | null = medusaEnabled
  ? new Medusa({ baseUrl: BACKEND_URL!, publishableKey: PUBLISHABLE_KEY! })
  : null;
