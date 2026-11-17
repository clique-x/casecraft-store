import { authenticate, configureStoreSearch, defineMiddlewares } from '@medusajs/framework/http'

export default defineMiddlewares({
  routes: [
    // The product index declares filterable `status` and `sales_channel_ids`, so
    // the route narrows it to published products in the key's sales channels.
    {
      method: ['POST'],
      matcher: '/store/search',
      middlewares: [
        configureStoreSearch({
          allowed_indexes: {
            product: true,
          },
        }),
      ],
    },
    // A signed-in customer's own orders: the token from POST /store/login-code/verify.
    {
      matcher: '/store/my-orders*',
      middlewares: [authenticate('customer', ['bearer'])],
    },
  ],
})
