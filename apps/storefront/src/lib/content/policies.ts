import {
  BRAND_NAME,
  BUSINESS,
  BUSINESS_ADDRESS,
  COD_FEE_INR,
  DISPATCH_WINDOW,
  FREE_SHIPPING_THRESHOLD_INR,
  REPLACEMENT_DAYS,
  SHOP_CITY,
  WHATSAPP_NUMBER,
} from '@/lib/brand';

/**
 * Help and policy pages under /pages/[slug]. Plain English for shoppers in India; every number and
 * business detail comes from src/lib/brand.ts so the pages change when the shop's settings do.
 * Razorpay's website review looks for: contact details with the business name, address, phone and
 * email; terms; privacy; cancellation and refunds with timelines; shipping with timelines. The
 * Consumer Protection (E-Commerce) Rules, 2020 add the grievance officer. GSTIN shows only once set.
 */

/** A run of text, or an inline link. Internal links start with "/". */
export type Inline = string | { href: string; label: string };

export type Block =
  | { kind: 'p'; text: Inline[] }
  | { kind: 'list'; items: Inline[][] }
  /** Label/value rows, e.g. support hours. */
  | { kind: 'facts'; rows: { label: string; value: Inline[] }[] };

export interface PolicySection {
  heading: string;
  blocks: Block[];
}

export interface PolicyPage {
  slug: PolicySlug;
  /** h1 and the browser title. */
  title: string;
  /** Short label for the "Help & policies" list. */
  navLabel: string;
  description: string;
  intro: Inline[];
  sections: PolicySection[];
}

export const POLICY_SLUGS = ['shipping', 'returns', 'refunds', 'privacy', 'terms', 'contact', 'about'] as const;
export type PolicySlug = (typeof POLICY_SLUGS)[number];

/** ISO date shown as "Last updated" on every page. */
export const POLICIES_UPDATED = '2026-11-06';

/** Hours someone reads WhatsApp; messages outside them are answered the next working day. */
export const SUPPORT_HOURS = 'Monday to Saturday, 10 am to 7 pm IST';
export const SUPPORT_REPLY_TIME = 'within a few hours during support hours';

export const WHATSAPP_HREF = `https://wa.me/${WHATSAPP_NUMBER}`;

const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const FREE_OVER = rupees(FREE_SHIPPING_THRESHOLD_INR);
const COD_CHARGE = COD_FEE_INR === 0 ? 'at no extra charge' : `for a fee of ${rupees(COD_FEE_INR)}, shown at checkout`;
const DAYS = `${REPLACEMENT_DAYS} days`;

const whatsapp: Inline = { href: WHATSAPP_HREF, label: 'WhatsApp' };
const account: Inline = { href: '/account', label: 'your account' };
const phone: Inline = { href: BUSINESS.phone.href, label: BUSINESS.phone.label };
const email: Inline = { href: `mailto:${BUSINESS.email}`, label: BUSINESS.email };
const officer = BUSINESS.grievanceOfficer;
const RUN_BY = `${BRAND_NAME} is an online shop run by ${BUSINESS.name}, ${BUSINESS_ADDRESS}.`;

/** Name, address, phone, email and GSTIN (once registered), for the contact and about pages. */
const businessRows = (): { label: string; value: Inline[] }[] => [
  { label: 'Business name', value: [BUSINESS.name] },
  { label: 'Office & warehouse', value: [BUSINESS_ADDRESS] },
  { label: 'Phone & WhatsApp', value: [phone, ' · ', { href: WHATSAPP_HREF, label: 'Chat on WhatsApp' }] },
  { label: 'Email', value: [email] },
  ...(BUSINESS.gstin ? [{ label: 'GSTIN', value: [BUSINESS.gstin] }] : []),
];

/** The grievance officer and the response times the E-Commerce Rules set. */
const grievanceBlocks = (): Block[] => [
  {
    kind: 'facts',
    rows: [
      { label: 'Grievance officer', value: [`${officer.name}, ${officer.role}, ${BUSINESS.name}`] },
      { label: 'Email', value: [email] },
      { label: 'Phone', value: [phone] },
      { label: 'Address', value: [BUSINESS_ADDRESS] },
    ],
  },
  p(
    'Write to the grievance officer if you are not satisfied with our answer about an order, a refund or your personal data. We acknowledge every complaint within 48 hours and resolve it within one month of receiving it.',
  ),
];

const p = (...text: Inline[]): Block => ({ kind: 'p', text });
const list = (...items: (Inline | Inline[])[]): Block => ({
  kind: 'list',
  items: items.map((item) => (Array.isArray(item) ? item : [item])),
});

export const POLICIES: Record<PolicySlug, PolicyPage> = {
  shipping: {
    slug: 'shipping',
    title: 'Shipping policy',
    navLabel: 'Shipping',
    description: `Orders ship from ${SHOP_CITY} in ${DISPATCH_WINDOW} through Shiprocket courier partners. Free shipping on orders over ${FREE_OVER}.`,
    intro: [
      `We pack every order at our ${SHOP_CITY} warehouse and hand it to a courier within ${DISPATCH_WINDOW}. Here is what happens after you order.`,
    ],
    sections: [
      {
        heading: 'At a glance',
        blocks: [
          {
            kind: 'facts',
            rows: [
              { label: 'Ships from', value: [BUSINESS_ADDRESS] },
              { label: 'Dispatch', value: [`Within ${DISPATCH_WINDOW} of your order`] },
              { label: 'Delivery', value: ['Usually 3 to 7 working days after dispatch; remote areas can take longer'] },
              { label: 'Shipping charge', value: [`Free on orders over ${FREE_OVER}; below that, shown at checkout before you pay`] },
              { label: 'Where', value: ['Across India, wherever our courier partners deliver'] },
            ],
          },
        ],
      },
      {
        heading: 'Where we ship',
        blocks: [
          p(
            'We ship to addresses across India. A few remote pin codes are not served by our courier partners; if yours is one of them, checkout will tell you before you pay, or we will message you and refund the order in full.',
          ),
          p('We do not ship outside India at the moment.'),
        ],
      },
      {
        heading: 'Shipping charges',
        blocks: [
          list(
            `Orders over ${FREE_OVER}: free shipping.`,
            `Orders below ${FREE_OVER}: the shipping charge is shown at checkout before you pay.`,
            `Cash on Delivery is available ${COD_CHARGE}.`,
          ),
        ],
      },
      {
        heading: 'Dispatch and delivery times',
        blocks: [
          p(
            `Every order leaves the shop within ${DISPATCH_WINDOW} of being placed. If something holds up your order, we message you before that window ends.`,
          ),
          p(
            'We send orders through courier partners on Shiprocket, such as Delhivery, Xpressbees, Ekart and Blue Dart, picking the one that reaches your pin code fastest. Most orders arrive within 3 to 7 working days of dispatch; metro cities are often quicker, and remote areas can take longer.',
          ),
          p(
            'Delivery dates shown by the courier are their estimate. Weather, strikes, festivals and local restrictions can cause delays that we cannot control, but we will chase the courier for you if a parcel stops moving.',
          ),
        ],
      },
      {
        heading: 'Tracking your order',
        blocks: [
          p(
            'Once your order ships, we send the tracking link by SMS, email or WhatsApp. You can also see the status of every order in ',
            account,
            '.',
          ),
        ],
      },
      {
        heading: 'When the parcel arrives',
        blocks: [
          p(
            'Please check that the outer pack is sealed before you accept it. If it looks torn, wet or tampered with, you can refuse it, or accept it and record a short unboxing video, then message us on ',
            whatsapp,
            '. A video makes damage claims with the courier much faster.',
          ),
          p(
            'If a courier marks your order as delivered but you have not received it, message us within 48 hours and we will raise it with the courier straight away.',
          ),
        ],
      },
      {
        heading: 'Wrong address or failed delivery',
        blocks: [
          p(
            'Check your address and phone number at checkout; the courier calls that number before delivering. If you spot a mistake, message us before the order ships and we will correct it.',
          ),
          p(
            'If the courier cannot deliver after its attempts, the parcel comes back to us. For prepaid orders we can ship it again (you pay the shipping a second time) or refund the order minus the shipping cost.',
          ),
        ],
      },
    ],
  },

  returns: {
    slug: 'returns',
    title: `${REPLACEMENT_DAYS}-day replacement policy`,
    navLabel: 'Replacements',
    description: `If your cover arrives damaged, faulty or not what you ordered, tell us within ${DAYS} of delivery and we will replace it.`,
    intro: [
      `Every cover is checked before it is packed, but things still go wrong in transit sometimes. If your order arrives with a problem, tell us within ${DAYS} of delivery and we will send a replacement.`,
    ],
    sections: [
      {
        heading: 'What we replace',
        blocks: [
          list(
            'A cover that arrives cracked, scratched, bent or otherwise damaged.',
            'A manufacturing fault, such as a cut-out that does not line up, a loose part or peeling print.',
            'The wrong item: a different design, or a cover for a phone model other than the one on your order.',
            'An item missing from your parcel.',
          ),
        ],
      },
      {
        heading: 'What we cannot replace',
        blocks: [
          list(
            'A cover for the wrong model where the model on the order is the one you picked. Please check your exact model in your phone’s Settings, under About phone, before ordering.',
            'Change of mind, or a colour that looks slightly different from the photos because of screen settings.',
            'Normal wear after use, such as scuffs, yellowing of clear parts over time, or damage from a drop.',
            'Covers that have been cut, painted or otherwise altered.',
          ),
          p('If you are not sure which model you have, message us on ', whatsapp, ' before you order and we will help you check.'),
        ],
      },
      {
        heading: 'Earbuds, neckbands and other sealed electronics',
        blocks: [
          p(
            'boAt and realme earbuds and neckbands are sold sealed, exactly as the brand packs them, with our GST invoice. Because they go in the ear, an opened unit cannot be returned or exchanged, and we do not accept change of mind on them.',
          ),
          list(
            'Wrong item, or damaged in transit: tell us within 48 hours of delivery with your unboxing video and photos of the box, and we replace it.',
            'Faulty after use: the brand covers it. Take the unit and our invoice to any boAt or realme service centre, or raise the claim on the brand’s website; the brand repairs or replaces it under its one-year warranty terms.',
            'Not sure which model or colour to pick? Message us on WhatsApp before you order.',
          ),
        ],
      },
      {
        heading: 'How to ask for a replacement',
        blocks: [
          list(
            ['Message us on ', whatsapp, ` within ${DAYS} of delivery with your order number.`],
            'Send clear photos of the problem, and the unboxing video if you recorded one.',
            'Keep the cover and its pack until we confirm; we may ask for it back.',
          ),
          p(
            'We usually reply within one working day. Once the replacement is approved, we ship it at no cost to you within our usual dispatch time. If we need the original back, we arrange the pickup through our courier partner, also at no cost to you.',
          ),
        ],
      },
      {
        heading: 'If a replacement is not possible',
        blocks: [
          p(
            'If the same cover is out of stock, you can choose a different cover of the same or lower price, or take a full refund. See our ',
            { href: '/pages/refunds', label: 'cancellation and refund policy' },
            ' for how refunds are paid.',
          ),
        ],
      },
    ],
  },

  refunds: {
    slug: 'refunds',
    title: 'Cancellation and refund policy',
    navLabel: 'Cancellations & refunds',
    description:
      'How to cancel an order before it ships, and how refunds are paid for Razorpay (UPI, cards, netbanking, wallets) and Cash on Delivery orders.',
    intro: ['You can cancel any order until it ships. Here is how cancellations and refunds work.'],
    sections: [
      {
        heading: 'Cancelling an order',
        blocks: [
          p(
            'Message us on ',
            whatsapp,
            ', call ',
            phone,
            ' or email ',
            email,
            ' with your order number. If the order has not been handed to the courier yet, we cancel it and refund you in full.',
          ),
          p(
            'Once an order has shipped it can no longer be cancelled. For Cash on Delivery orders you may refuse the parcel at the door; please do not make a habit of it, as repeated refusals mean we may stop offering Cash on Delivery to that phone number.',
          ),
          p(
            'We may cancel an order ourselves if a cover sells out before we pack it, if the courier does not serve your pin code, or if an order looks fraudulent. When we cancel, you get a full refund.',
          ),
        ],
      },
      {
        heading: 'When you get a refund',
        blocks: [
          list(
            'You cancel before the order ships.',
            'We cancel the order for any reason.',
            [
              'A replacement under our ',
              { href: '/pages/returns', label: `${REPLACEMENT_DAYS}-day replacement policy` },
              ' is not possible and you choose a refund.',
            ],
            'A parcel is lost by the courier.',
          ),
        ],
      },
      {
        heading: 'How refunds are paid',
        blocks: [
          p(
            'Online payments are handled by Razorpay. Refunds for orders paid by UPI, debit or credit card, netbanking or wallet go back to the same account or card you paid from. We start the refund within 2 working days of approving it; your bank or wallet usually shows it within 5 to 7 working days after that.',
          ),
          p(
            'Cash on Delivery orders are refunded by UPI or bank transfer to an account you give us. We never ask for your card number, PIN or OTP to send a refund.',
          ),
          p(
            'Refunds are for the amount you paid. If an order is refunded after it was shipped back to us undelivered, the shipping cost is deducted, as explained in our ',
            { href: '/pages/shipping', label: 'shipping policy' },
            '.',
          ),
        ],
      },
      {
        heading: 'Refund not received?',
        blocks: [
          p(
            'If 10 working days have passed since we confirmed your refund and you cannot see it, message us with your order number. We will send you the Razorpay refund reference so your bank can trace it.',
          ),
        ],
      },
    ],
  },

  privacy: {
    slug: 'privacy',
    title: 'Privacy policy',
    navLabel: 'Privacy',
    description: `What personal information ${BRAND_NAME} collects, why, who we share it with, and how to ask us to change or delete it.`,
    intro: [
      `${RUN_BY} This policy explains what we collect when you browse or order, and what we do with it. We follow the Digital Personal Data Protection Act, 2023 and other Indian law that applies to us.`,
    ],
    sections: [
      {
        heading: 'What we collect',
        blocks: [
          list(
            'Order details: your name, phone number, email, delivery address and what you bought.',
            'Messages you send us on WhatsApp, email or phone, so we can help with your order.',
            'Your phone model, if you choose it on the site. It is saved in a small cookie on your device so we can show covers that fit; it is not linked to your name.',
            'Basic technical data that every website receives, such as your browser type and IP address, kept in server logs for security.',
            'Your location, only if you tap "Use my current location" at checkout and allow it. Your browser sends it to OpenStreetMap to look up your address; we do not store it.',
            'Your email and up to three delivery addresses from past checkouts, saved only in your own browser so you can pick one next time. Remove one with "Remove", or all of them with "Not you? Clear" at checkout.',
            'If you use "Find my saved addresses" at checkout, your mobile number is sent to Twilio, our SMS provider, to deliver a one-time code. After you enter the code, we show the delivery addresses of your past orders with that number. Without the code, nobody can see them.',
          ),
          p(
            'We do not see or store your card number, UPI PIN or netbanking password. Online payments are entered directly with Razorpay, our payment provider.',
          ),
        ],
      },
      {
        heading: 'Why we use it',
        blocks: [
          list(
            'To pack, ship and deliver your order and send you tracking updates.',
            'To handle replacements, refunds and questions.',
            'To prevent fraud and misuse of Cash on Delivery.',
            'To keep the accounting and tax records Indian law requires.',
          ),
          p(
            'We send offers only if you have agreed to receive them, and you can stop them at any time by replying STOP or messaging us.',
          ),
        ],
      },
      {
        heading: 'Who we share it with',
        blocks: [
          p('Only with the companies we need to run the shop, and only what they need:'),
          list(
            'Razorpay, to take online payments and send refunds.',
            'Shiprocket and its courier partners, who need your name, address and phone number to deliver.',
            'WhatsApp (Meta), when you choose to message us there.',
            'Our hosting and email providers, who store data on our behalf.',
          ),
          p(
            'We do not sell your personal information. We share it with government authorities only when the law requires us to.',
          ),
        ],
      },
      {
        heading: 'Cookies and browser storage',
        blocks: [
          list(
            'A cart cookie, so your cart is still there when you come back. It lasts 30 days.',
            'The phone-model cookie described above.',
            'Small markers in your browser’s storage so the welcome animation and the phone-picker tip show only once.',
          ),
          p('We do not use advertising or analytics cookies, and no other company tracks you on this site.'),
        ],
      },
      {
        heading: 'How long we keep it',
        blocks: [
          p(
            'We keep order and invoice records for as long as Indian tax and accounting law requires. Chat messages and other data are deleted when we no longer need them to help you. The phone-model cookie stays on your device until you clear it or pick a different phone.',
          ),
        ],
      },
      {
        heading: 'Your choices and rights',
        blocks: [
          p(
            'You can ask us to show you the personal information we hold about you, correct it, or delete it where we are not required to keep it. You can also withdraw any consent you have given. Message us on ',
            whatsapp,
            ' or email ',
            email,
            ' and we will reply as quickly as we can.',
          ),
          p(
            'Our shop is meant for adults. If you are under 18, please order with a parent or guardian; we do not knowingly collect a child’s personal data without a parent’s or guardian’s consent.',
          ),
        ],
      },
      { heading: 'Grievance officer', blocks: grievanceBlocks() },
      {
        heading: 'Security and changes',
        blocks: [
          p(
            'The site uses HTTPS, and access to order data is limited to the people who pack and support orders. If we change this policy, we update the date at the top of this page.',
          ),
        ],
      },
    ],
  },

  terms: {
    slug: 'terms',
    title: 'Terms and conditions',
    navLabel: 'Terms & conditions',
    description: `The terms for buying from ${BRAND_NAME}, run by ${BUSINESS.name}: orders, prices, payment, delivery, replacements and use of the site.`,
    intro: [
      `${RUN_BY} These terms apply when you use this website or buy from us. By placing an order you agree to them.`,
    ],
    sections: [
      {
        heading: 'Who can buy',
        blocks: [
          p(
            'You need to be 18 or older to place an order, or order with the consent of a parent or guardian. Please give a correct name, phone number and delivery address so the courier can reach you.',
          ),
        ],
      },
      {
        heading: 'Our products',
        blocks: [
          p(
            'Our covers are photographed in our shop. Colours can look slightly different on different screens, and textures such as glitter or carbon weave vary a little from piece to piece.',
          ),
          p(
            'Each cover is made for the phone models listed on its page. Apple, Samsung, OnePlus, Xiaomi, Realme, Vivo, Nothing, Google and other phone names belong to their owners. We sell third-party accessories that fit these phones; we are not connected with or endorsed by the phone makers.',
          ),
        ],
      },
      {
        heading: 'Orders and prices',
        blocks: [
          p(
            'Prices are in Indian rupees and include applicable taxes. Any shipping charge is shown at checkout before you pay. Your order is confirmed when you receive our order confirmation.',
          ),
          p(
            'If a cover is listed at a clearly wrong price because of an error, or sells out before we pack it, we may cancel the order and refund you in full.',
          ),
        ],
      },
      {
        heading: 'Payment',
        blocks: [
          p(
            `You can pay online through Razorpay with UPI, debit or credit cards, netbanking or wallets, or choose Cash on Delivery ${COD_CHARGE}. For Cash on Delivery, please keep the exact amount ready; couriers may not carry change.`,
          ),
        ],
      },
      {
        heading: 'Delivery, replacements and refunds',
        blocks: [
          p(
            'How we ship, replace and refund is explained in our ',
            { href: '/pages/shipping', label: 'shipping policy' },
            ', ',
            { href: '/pages/returns', label: `${REPLACEMENT_DAYS}-day replacement policy` },
            ' and ',
            { href: '/pages/refunds', label: 'cancellation and refund policy' },
            '. They form part of these terms.',
          ),
        ],
      },
      {
        heading: 'Using this website',
        blocks: [
          p(
            'Please do not misuse the site: no placing fake orders, copying our photos or text for another shop, or trying to break or overload the site. The photos, text and design of this site belong to us.',
          ),
        ],
      },
      {
        heading: 'Our responsibility',
        blocks: [
          p(
            'A phone cover helps protect against everyday scratches and small knocks, but it cannot prevent every kind of damage. We are not responsible for damage to your phone from drops, water or misuse. Our total responsibility for any order is limited to the amount you paid for it. Nothing in these terms takes away your rights under the Consumer Protection Act, 2019.',
          ),
        ],
      },
      {
        heading: 'Governing law',
        blocks: [
          p(
            `These terms are governed by the laws of India. Any dispute that we cannot settle by talking it through will be handled by the courts at ${SHOP_CITY}, India.`,
          ),
          p('We may update these terms from time to time; the date at the top of this page shows the latest version.'),
        ],
      },
      {
        heading: 'Contact and grievances',
        blocks: [
          p('For questions about an order, message us on ', whatsapp, ', call ', phone, ' or email ', email, '.'),
          ...grievanceBlocks(),
        ],
      },
    ],
  },

  contact: {
    slug: 'contact',
    title: 'Contact us',
    navLabel: 'Contact',
    description: `Call, WhatsApp or email ${BRAND_NAME} (${BUSINESS.name}, ${SHOP_CITY}) for help with orders, fit, replacements and refunds.`,
    intro: [
      'The quickest way to reach us is WhatsApp on ',
      phone,
      '. A real person from the shop reads every message, and we can send photos of a cover if you want a closer look before you buy.',
    ],
    sections: [
      {
        heading: 'Reach us',
        blocks: [
          {
            kind: 'facts',
            rows: [
              ...businessRows(),
              { label: 'Support hours', value: [SUPPORT_HOURS] },
              { label: 'Reply time', value: [`Usually ${SUPPORT_REPLY_TIME}; messages outside them are answered the next working day.`] },
            ],
          },
        ],
      },
      {
        heading: 'Tracking an order',
        blocks: [
          p(
            'You can see the status of every order, and its tracking link once it ships, in ',
            account,
            '. For anything else about an order, message us with your order number so we can find it quickly.',
          ),
        ],
      },
      {
        heading: 'Common questions',
        blocks: [
          list(
            ['How long does delivery take? See our ', { href: '/pages/shipping', label: 'shipping policy' }, '.'],
            [
              'My cover arrived damaged or wrong. See our ',
              { href: '/pages/returns', label: `${REPLACEMENT_DAYS}-day replacement policy` },
              '.',
            ],
            ['How do I cancel or get a refund? See our ', { href: '/pages/refunds', label: 'cancellation and refund policy' }, '.'],
            ['Which covers fit my phone? Find your model under ', { href: '/phones', label: 'Shop by phone' }, '.'],
          ),
        ],
      },
      { heading: 'Grievance officer', blocks: grievanceBlocks() },
    ],
  },

  about: {
    slug: 'about',
    title: 'About us',
    navLabel: 'About us',
    description: `${BRAND_NAME} sells phone covers, audio, storage, Wi-Fi cameras and screen protection across India. It is run by ${BUSINESS.name} from SIDCUL, ${SHOP_CITY}.`,
    intro: [
      `${BRAND_NAME} sells phone covers, sealed boAt and realme audio, memory cards, SSDs and RAM, CP Plus Wi-Fi cameras and screen protection online, across India. It is run by ${BUSINESS.name} from our office and warehouse in SIDCUL, ${SHOP_CITY}, where every order is checked and packed.`,
    ],
    sections: [
      {
        heading: 'What we sell',
        blocks: [
          list(
            ['Phone covers made for each phone model and photographed in our shop. ', { href: '/phones', label: 'Find yours by phone' }, '.'],
            ['boAt and realme earbuds and neckbands, sold sealed as the brand packs them, with the brand’s one-year warranty. ', { href: '/audio', label: 'See audio' }, '.'],
            ['FLAYR tempered glass for iPhone, G-TEL glass for Galaxy S, and hydrogel back films. ', { href: '/accessories', label: 'See protection' }, '.'],
            ['SanDisk, Samsung, WD and Consistent memory cards, pen drives and SSDs, laptop and desktop RAM, and drive cases. ', { href: '/storage', label: 'See storage' }, '.'],
            ['CP Plus ezyKam+ Wi-Fi cameras for the home and shop. ', { href: '/cameras', label: 'See cameras' }, '.'],
          ),
        ],
      },
      {
        heading: 'How buying works',
        blocks: [
          list(
            'Prices are in Indian rupees and include taxes.',
            `Pay online through Razorpay with UPI, cards, netbanking or wallets, or choose Cash on Delivery ${COD_CHARGE}.`,
            ['Orders leave our warehouse within ', DISPATCH_WINDOW, `, with free shipping over ${FREE_OVER}. `, { href: '/pages/shipping', label: 'Shipping policy' }, '.'],
            [`If something arrives damaged, faulty or wrong, tell us within ${DAYS} and we replace it. `, { href: '/pages/returns', label: 'Replacement policy' }, '.'],
          ),
        ],
      },
      {
        heading: 'Business details',
        blocks: [{ kind: 'facts', rows: businessRows() }],
      },
    ],
  },
};

export function getPolicy(slug: string): PolicyPage | null {
  return (POLICY_SLUGS as readonly string[]).includes(slug) ? POLICIES[slug as PolicySlug] : null;
}
