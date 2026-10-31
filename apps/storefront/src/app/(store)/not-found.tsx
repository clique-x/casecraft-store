import { NotFoundContent } from '@/components/layout/NotFoundContent';

// notFound() from any (store) page without its own not-found renders here, inside the store layout.
export default function StoreNotFound() {
  return <NotFoundContent />;
}
