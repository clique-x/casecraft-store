import { BadgeCheckIcon, CameraIcon, MessageCircleIcon, WalletIcon, type LucideIcon } from 'lucide-react'
import { AccentBar } from '@/components/brand/AccentBar'
import { Reveal } from '@/components/motion/Reveal.client'
import { REPLACEMENT_DAYS, SHOP_CITY, WHATSAPP_NUMBER } from '@/lib/brand'

interface Reason {
  Icon: LucideIcon
  title: string
  body: string
}

const WHATSAPP_HREF = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi! I have a question about a product.')}`

const REASONS: readonly Reason[] = [
  {
    Icon: CameraIcon,
    title: 'Shot in our shop',
    body: `Every cover is photographed in our ${SHOP_CITY} shop. The cover you see is the cover we ship.`,
  },
  {
    Icon: BadgeCheckIcon,
    title: 'Sealed originals',
    body: 'boAt and realme audio in the sealed brand box, with our GST invoice for the 1-year brand warranty.',
  },
  {
    Icon: WalletIcon,
    title: 'Pay your way',
    body: 'UPI, cards, netbanking or Cash on Delivery.',
  },
  {
    Icon: MessageCircleIcon,
    title: 'Help on WhatsApp',
    body: `WhatsApp support during shop hours. Replacement within ${REPLACEMENT_DAYS} days if it is wrong or damaged.`,
  },
]

/** Studio-grey band with three white cards. */
export function WhyUs() {
  return (
    <section id="why" aria-labelledby="why-heading" className="scroll-mt-20 bg-surface-2 py-14 text-fg lg:py-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <h2 id="why-heading" className="font-display text-h2 font-extrabold text-heading text-balance">
            Why buy here
          </h2>
          <AccentBar className="mt-4" />
        </Reveal>

        <div className="relative mt-8">
          <ul className="grid gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-4">
            {REASONS.map(({ Icon, title, body }, i) => (
              <Reveal as="li" key={title} delay={i * 0.06}>
                <article
                  className="flex h-full flex-col gap-3 rounded-card border border-border bg-surface p-5 sm:p-6"
                >
                  <span className="grid size-11 place-items-center rounded-full bg-surface-2 text-accent-text">
                    <Icon className="size-5" strokeWidth={2} aria-hidden="true" />
                  </span>
                  <h3 className="font-sans text-xl leading-tight font-bold text-fg">{title}</h3>
                  <p className="text-body leading-relaxed text-fg-muted">{body}</p>
                  {i === REASONS.length - 1 && (
                    <a
                      href={WHATSAPP_HREF}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-auto inline-flex min-h-11 items-center self-start rounded-sm text-base font-semibold text-accent-text underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-accent-2"
                    >
                      WhatsApp us
                    </a>
                  )}
                </article>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
