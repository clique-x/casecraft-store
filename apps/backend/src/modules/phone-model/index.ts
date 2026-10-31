import { Module } from '@medusajs/framework/utils'
import PhoneModelModuleService from './service'

export const PHONE_MODEL_MODULE = 'phoneModel'

export default Module(PHONE_MODEL_MODULE, {
  service: PhoneModelModuleService,
})
