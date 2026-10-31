import { AngledDivider } from '@/components/brand/AngledDivider'
import { TrustStrip } from '@/components/home/TrustStrip'

/** The dark counter ends on a 6° coral edge; the white store starts with four facts. */
export function TrustSeam() {
  return (
    <div className="bg-paper">
      <AngledDivider from="ink" to="paper" />
      <TrustStrip />
    </div>
  )
}
