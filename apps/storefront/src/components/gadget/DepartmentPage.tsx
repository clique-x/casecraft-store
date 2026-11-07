import { DepartmentHeader, DepartmentSection } from '@/components/listing/DepartmentHeader';
import { PAGE_SHELL } from '@/components/listing/ListingHeader';
import { ProductGrid } from '@/components/listing/ProductGrid';
import { DEPARTMENTS, type Department } from '@/lib/catalog/gadgets';
import { getGadgets } from '@/lib/medusa/products';

/** Listing for one gadget department: a short header with jump buttons, then one section per product group. */
export async function DepartmentPage({ department }: { department: Department }) {
  const info = DEPARTMENTS[department];
  const products = await getGadgets(department);
  const groups = info.sections
    .map((s) => ({ ...s, items: products.filter((p) => p.gadget && s.types.includes(p.gadget.type)) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className={PAGE_SHELL}>
      <DepartmentHeader
        trail={[{ name: info.name, href: info.path }]}
        title={info.title}
        groups={groups.map((g) => ({ id: g.id, heading: g.heading, count: g.items.length }))}
        warranty={info.badge}
      />
      {groups.map(({ id, heading, items }, i) => (
        <DepartmentSection key={id} id={id} heading={heading} count={items.length} first={i === 0}>
          <ProductGrid products={items} label={heading} eager={i === 0} className="mt-5" />
        </DepartmentSection>
      ))}
    </div>
  );
}
