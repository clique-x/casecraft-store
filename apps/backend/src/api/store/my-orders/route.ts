import type { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { MedusaError, Modules } from '@medusajs/framework/utils'
import { loadOrders } from '../../../lib/orders'

/**
 * GET /store/my-orders (signed-in customer) → the customer, their saved addresses and every order placed with
 * their email address, newest first: guest orders from before the account existed count too, since signing
 * in proves the customer reads that inbox.
 */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const customers = req.scope.resolve(Modules.CUSTOMER)
  const [customer] = await customers.listCustomers({ id: req.auth_context.actor_id }, { relations: ['addresses'] })
  if (!customer?.email) throw new MedusaError(MedusaError.Types.UNAUTHORIZED, 'Sign in again')

  const orders = await loadOrders(req.scope, { email: customer.email.toLowerCase() }, 50)
  res.json({
    customer: {
      email: customer.email,
      firstName: customer.first_name ?? '',
      lastName: customer.last_name ?? '',
      phone: customer.phone ?? '',
      addresses: (customer.addresses ?? []).map((a) => ({
        id: a.id,
        firstName: a.first_name ?? '',
        lastName: a.last_name ?? '',
        address1: a.address_1 ?? '',
        address2: a.address_2 ?? '',
        city: a.city ?? '',
        province: a.province ?? '',
        postalCode: a.postal_code ?? '',
        phone: a.phone ?? '',
      })),
    },
    orders,
  })
}
