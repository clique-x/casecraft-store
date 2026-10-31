import { MedusaService } from '@medusajs/framework/utils'
import { PhoneModel } from './models/phone-model'

class PhoneModelModuleService extends MedusaService({ PhoneModel }) {}

export default PhoneModelModuleService
