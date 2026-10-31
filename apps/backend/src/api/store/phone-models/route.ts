import type { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { PHONE_MODEL_MODULE } from '../../../modules/phone-model'
import type PhoneModelModuleService from '../../../modules/phone-model/service'

/** GET /store/phone-models: active phone models in picker order. Store routes require a publishable key. */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve<PhoneModelModuleService>(PHONE_MODEL_MODULE)
  const phone_models = await service.listPhoneModels(
    { is_active: true },
    {
      select: ['slug', 'brand', 'name', 'series', 'release_year', 'island_style', 'rank'],
      order: { rank: 'ASC' },
      take: null,
    },
  )
  res.json({ phone_models })
}
