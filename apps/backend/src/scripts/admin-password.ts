import { randomBytes } from 'node:crypto'
import type { ExecArgs } from '@medusajs/framework/types'
import { Modules } from '@medusajs/framework/utils'

/**
 * Admin logins without email. The admin's "Forgot password?" sends its link by email, and this store has no
 * email provider, so that link never arrives. Run on the server instead (infra/prod/README.md):
 *
 *   npx medusa exec ./src/scripts/admin-password.js            lists the admin logins
 *   npx medusa exec ./src/scripts/admin-password.js <email>    gives that login a new random password, printed once
 *
 * Change the printed password in the admin afterwards if you like (Settings → Profile).
 */
export default async function adminPassword({ container, args }: ExecArgs) {
  const users = await container.resolve(Modules.USER).listUsers({}, { select: ['email'] })
  const wanted = args[0]?.trim().toLowerCase()

  if (!wanted) {
    console.log(users.length > 0 ? `Admin logins:\n${users.map((u) => `  ${u.email}`).join('\n')}` : 'There are no admin logins yet.')
    return
  }

  const user = users.find((u) => u.email.toLowerCase() === wanted)
  if (!user) {
    throw new Error(`There is no admin login for ${args[0]}. Run the script without an email to list them.`)
  }

  const password = randomBytes(18).toString('base64url')
  const result = await container.resolve(Modules.AUTH).updateProvider('emailpass', { entity_id: user.email, password })
  if (!result.success) {
    throw new Error(`The password was not changed: ${result.error ?? 'unknown error'}`)
  }
  console.log(`New admin password for ${user.email}: ${password}`)
}
