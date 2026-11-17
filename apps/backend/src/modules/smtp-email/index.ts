import { ModuleProvider, Modules } from '@medusajs/framework/utils'
import SmtpEmailService from './service'

export default ModuleProvider(Modules.NOTIFICATION, {
  services: [SmtpEmailService],
})
