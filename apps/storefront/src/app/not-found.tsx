import type { Metadata } from 'next';
import { NotFoundContent } from '@/components/layout/NotFoundContent';
import StoreLayout from './(store)/layout';

export const metadata: Metadata = {
  title: 'Page not found',
  description: 'We couldn’t find that page. Search for a cover, browse trending covers or shop by phone.',
};

// Unmatched URLs render this file inside the root layout only, which has no header or footer.
// Wrapping it in the (store) layout component gives it the same chrome as every store page,
// and keeps following that layout if it changes.
export default function NotFound() {
  return (
    <StoreLayout>
      <NotFoundContent />
    </StoreLayout>
  );
}
