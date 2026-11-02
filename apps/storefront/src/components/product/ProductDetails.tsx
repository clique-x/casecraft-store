import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { featuresFor } from '@/lib/catalog/photos';
import type { ProductDetail } from '@/lib/medusa/fixtures';

type DetailKey = keyof ProductDetail['details'];

const ITEMS: readonly { key: DetailKey; label: string }[] = [
  { key: 'material', label: 'Material' },
  { key: 'print', label: 'Print' },
  { key: 'fit', label: 'Fit' },
  { key: 'care', label: 'Care' },
];

export function ProductDetails({ product }: { product: ProductDetail }) {
  const photo = product.photo;
  const accessory = product.accessory;
  const gadget = product.gadget;
  // Accessories keep "what's in the box" in the `print` slot.
  const items = ITEMS.filter(({ key }) => product.details[key].trim().length > 0).map((item) =>
    (accessory || gadget) && item.key === 'print' ? { ...item, label: 'In the box' } : item,
  );
  const features = gadget ? gadget.features : accessory ? accessory.features : photo ? featuresFor(photo) : null;

  return (
    <section aria-labelledby="details-heading" className="flex flex-col gap-4">
      <div>
        <h2 id="details-heading" className="font-sans text-h3 font-bold text-fg">
          {accessory || gadget ? 'About this product' : photo ? 'About this cover' : 'Design'}
        </h2>
        <p className="mt-2 text-body text-fg-muted">{product.description}</p>
      </div>

      {features && (
        <ul aria-label="Features" className="flex flex-col gap-2">
          {features.map((feature) => (
            <li key={feature} className="flex items-center gap-3 text-body text-fg">
              <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-brand-coral" />
              {feature}
            </li>
          ))}
        </ul>
      )}

      {gadget && (
        <dl aria-label="Specifications" className="divide-y divide-border rounded-xl border border-border text-sm">
          {gadget.specs.map((spec) => (
            <div key={spec.label} className="grid grid-cols-[8rem_1fr] gap-3 px-4 py-2.5">
              <dt className="text-fg-muted">{spec.label}</dt>
              <dd className="text-fg">{spec.value}</dd>
            </div>
          ))}
        </dl>
      )}

      <Accordion type="multiple" defaultValue={['material']} className="border-t border-border">
        {items.map(({ key, label }) => (
          <AccordionItem key={key} value={key} className="border-border not-last:border-b">
            <AccordionTrigger className="min-h-12 items-center rounded-none py-3 text-base font-medium text-fg hover:no-underline focus-visible:ring-accent-2/50 **:data-[slot=accordion-trigger-icon]:text-fg-muted">
              {label}
            </AccordionTrigger>
            <AccordionContent className="pb-4 text-body text-fg-muted">
              <p>{product.details[key]}</p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
