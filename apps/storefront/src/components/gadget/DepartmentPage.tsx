import { ListingHeader, PAGE_SHELL } from '@/components/listing/ListingHeader';
import { ProductGrid } from '@/components/listing/ProductGrid';
import { DEPARTMENTS, type Department } from '@/lib/catalog/gadgets';
import { getGadgets } from '@/lib/medusa/products';

/** Listing for one gadget department, one section per product group with an anchor for the home shortcuts. */
export async function DepartmentPage({ department }: { department: Department }) {
  const info = DEPARTMENTS[department];
  const products = await getGadgets(department);

  return (
    <div className={PAGE_SHELL}>
      <ListingHeader trail={[{ name: info.name, href: info.path }]} title={info.title} intro={info.intro} aside={`${products.length} products`} />
      {info.sections.map(({ id, types, heading, intro }) => {
        const items = products.filter((p) => p.gadget && types.includes(p.gadget.type));
        if (items.length === 0) return null;
        return (
          <section key={id} id={id} aria-labelledby={`${id}-heading`} className="mt-12 scroll-mt-28">
            <h2 id={`${id}-heading`} className="font-display text-h3 font-extrabold text-fg">
              {heading}
            </h2>
            <p className="mt-1 text-body text-fg-muted">{intro}</p>
            <ProductGrid products={items} label={heading} className="mt-6" />
          </section>
        );
      })}
    </div>
  );
}
