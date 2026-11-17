import type { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { MedusaError, Modules } from '@medusajs/framework/utils'
import { loadOrder } from '../../../../lib/orders'

/** GET /store/my-orders/:id (signed-in customer) → one of their orders, for the receipt page. */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const customers = req.scope.resolve(Modules.CUSTOMER)
  const [customer] = await customers.listCustomers({ id: req.auth_context.actor_id }, { select: ['id', 'email'] })
  const order = /^order_[A-Za-z0-9]+$/.test(req.params.id) ? await loadOrder(req.scope, req.params.id) : null
  if (!customer?.email || !order || order.email?.toLowerCase() !== customer.email.toLowerCase()) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, 'Order not found')
  }
  res.json({ order })
}
