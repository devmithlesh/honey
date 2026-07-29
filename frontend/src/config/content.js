/**
 * Editable marketing copy.
 *
 * Everything here is plain text with no layout attached, so the wording can be
 * rewritten without touching a single component. Structural changes still live
 * in the components themselves.
 */

export const FAQS = [
  {
    question: 'Is your honey really raw and unprocessed?',
    answer:
      'Yes. We cold-extract at room temperature and strain only to remove wax. The honey is never pasteurised, never blended and never has anything added to it, so the natural enzymes and pollen stay intact.',
  },
  {
    question: 'Why has my honey turned solid or grainy?',
    answer:
      'Crystallisation is the clearest proof that honey is raw — processed honey is heated precisely to stop it happening. Stand the jar in warm (not boiling) water for a few minutes and it will return to a liquid state with nothing lost.',
  },
  {
    question: 'How long does a jar keep?',
    answer:
      'Honey is one of the few foods that does not spoil. We print a best-before of 24 months for regulatory reasons, but stored sealed in a cool, dry cupboard it will be perfectly good well beyond that.',
  },
  {
    question: 'How do I know it has not been mixed with sugar syrup?',
    answer:
      'Every batch is laboratory-tested for added sugar, moisture content and antibiotic residue before it is jarred. The batch code printed on your label tells you which apiary and which week the honey came from.',
  },
  {
    question: 'Which honey should I start with?',
    answer:
      'Raw Himalayan honey is the everyday all-rounder and our most popular jar. Forest honey is darker and more robust if you like a stronger flavour, and mustard honey is mild and creamy — the one children usually prefer.',
  },
  {
    question: 'How quickly will my order arrive?',
    answer:
      'Orders placed before 2pm are dispatched the same working day. Metro cities usually receive their parcel in 2–4 days, and the rest of India within 4–7 days. You will get a tracking link by email as soon as it ships.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'Cash on delivery anywhere we ship, and UPI for prepaid orders. For UPI you scan our QR code, pay, and enter the transaction reference at checkout — we verify it before the order is confirmed.',
  },
  {
    question: 'Can I return a jar if I am not happy?',
    answer:
      'If a jar arrives damaged or the honey is not as described, tell us within 7 days with a photo and we will replace it or refund you in full. Please see our refund policy for the full terms.',
  },
  {
    question: 'Is honey safe for babies?',
    answer:
      'No. Honey should never be given to children under 12 months of age because of the risk of infant botulism. Above that age it is perfectly safe.',
  },
  {
    question: 'Do you supply in bulk or for gifting?',
    answer:
      'Yes. We put together corporate hampers and wedding favours, and we supply cafés and bakeries in bulk. Write to us through the contact page with your quantities and we will send a quote.',
  },
];

export const TEAM = [
  {
    name: 'Harpreet Singh',
    role: 'Founder & head beekeeper',
    bio: 'Learned the craft from his grandfather and has tended these colonies for over twenty-five years.',
    emoji: '👨‍🌾',
  },
  {
    name: 'Meera Singh',
    role: 'Quality & lab testing',
    bio: 'A food technologist who signs off every batch before it is allowed anywhere near a jar.',
    emoji: '👩‍🔬',
  },
  {
    name: 'Arjun Rawat',
    role: 'Apiary manager',
    bio: 'Moves the hives with the seasons and knows each colony by temperament.',
    emoji: '🧑‍🌾',
  },
  {
    name: 'Kavya Bisht',
    role: 'Customer care',
    bio: 'Answers the phone, packs the parcels and remembers every regular by name.',
    emoji: '👩‍💼',
  },
];

export const MILESTONES = [
  { year: '1998', title: 'Four hives behind the house', body: 'A hobby that got out of hand, in the best way.' },
  { year: '2007', title: 'First proper apiary', body: 'Twenty colonies moved to the forest edge for cleaner forage.' },
  { year: '2015', title: 'Our own testing lab', body: 'Purity stopped being a promise and became a measurement.' },
  { year: '2021', title: 'Direct to your door', body: 'We cut out the middlemen and started shipping across India.' },
  { year: '2026', title: 'Forty hives, one standard', body: 'Bigger, but nothing about how we work has changed.' },
];

export const CONTACT_REASONS = [
  { value: 'order', label: 'A question about my order' },
  { value: 'product', label: 'A question about a product' },
  { value: 'bulk', label: 'Bulk or corporate enquiry' },
  { value: 'wholesale', label: 'Wholesale / reseller' },
  { value: 'feedback', label: 'Feedback' },
  { value: 'other', label: 'Something else' },
];

/**
 * Policy pages. Each section becomes a heading plus its paragraphs, so adding
 * a clause means adding a string here rather than editing JSX.
 */
export const POLICIES = {
  privacy: {
    title: 'Privacy Policy',
    intro:
      'This policy explains what personal information we collect when you use this website, why we collect it, and what we do with it.',
    sections: [
      {
        heading: 'Information we collect',
        paragraphs: [
          'When you create an account we store your name, email address and phone number. When you place an order we also store the delivery and billing addresses you give us, along with the contents and value of that order.',
          'We never see or store your card or bank details. Cash on delivery is settled with the courier, and UPI payments happen inside your own payments app — we only record the reference number you type in.',
        ],
      },
      {
        heading: 'How we use it',
        paragraphs: [
          'Your information is used to process and deliver your orders, to answer your questions, to send order updates, and to keep the site secure and working.',
          'We send marketing email only to people who have explicitly asked for it, and every one of those emails carries an unsubscribe link that works immediately.',
        ],
      },
      {
        heading: 'Who we share it with',
        paragraphs: [
          'We share the minimum necessary with our delivery partners so your parcel can reach you, and with our payment and hosting providers so the site can operate.',
          'We do not sell your personal information to anybody, for any purpose, ever.',
        ],
      },
      {
        heading: 'Cookies',
        paragraphs: [
          'We use a small number of strictly necessary cookies to keep you signed in and to remember what is in your basket. We do not use advertising or cross-site tracking cookies.',
        ],
      },
      {
        heading: 'How long we keep it',
        paragraphs: [
          'Order records are kept for as long as tax and accounting law requires. Account information is kept until you ask us to delete it.',
        ],
      },
      {
        heading: 'Your rights',
        paragraphs: [
          'You can ask us for a copy of the information we hold about you, ask us to correct it, or ask us to delete your account. Write to us and we will respond within 30 days.',
        ],
      },
    ],
  },

  terms: {
    title: 'Terms & Conditions',
    intro:
      'By browsing this website or placing an order you agree to the terms set out below. Please read them before you buy.',
    sections: [
      {
        heading: 'Using this website',
        paragraphs: [
          'You may use this site to browse our products and place genuine orders. You may not attempt to disrupt the service, access other customers’ data, or copy our photography and written content for commercial use.',
          'You are responsible for keeping your account password confidential and for any activity that happens under your account.',
        ],
      },
      {
        heading: 'Products and pricing',
        paragraphs: [
          'We describe every product as accurately as we can. Honey is a natural product, so colour, texture and flavour vary between harvests — that variation is normal and is not a fault.',
          'All prices are in Indian Rupees and include applicable taxes. We may change prices at any time, but never after you have placed an order.',
        ],
      },
      {
        heading: 'Orders',
        paragraphs: [
          'An order is an offer to buy. It is accepted only when we confirm it. We may decline an order if the item is out of stock, if the price was listed in error, or if we cannot deliver to your address.',
          'Stock is reserved at the moment your order is placed. If an item sells out between your adding it to the basket and checking out, we will tell you before charging anything.',
        ],
      },
      {
        heading: 'Payment',
        paragraphs: [
          'We accept cash on delivery and UPI. UPI orders are confirmed once we have verified the transaction reference you provide against our records.',
        ],
      },
      {
        heading: 'Limitation of liability',
        paragraphs: [
          'Our liability for any order is limited to the amount you paid for it. Nothing in these terms limits liability that cannot be limited by law.',
          'Product information on this site is provided for general interest and is not medical advice.',
        ],
      },
      {
        heading: 'Governing law',
        paragraphs: [
          'These terms are governed by the laws of India, and any dispute falls under the exclusive jurisdiction of the courts of Uttarakhand.',
        ],
      },
    ],
  },

  shipping: {
    title: 'Shipping Policy',
    intro:
      'How, when and where we deliver — including what it costs and what to do if something goes wrong in transit.',
    sections: [
      {
        heading: 'Where we deliver',
        paragraphs: [
          'We ship to every serviceable pin code in India. We do not currently ship internationally.',
        ],
      },
      {
        heading: 'Dispatch times',
        paragraphs: [
          'Orders confirmed before 2:00 pm on a working day are dispatched the same day. Orders placed after that, or on a Sunday or public holiday, go out on the next working day.',
        ],
      },
      {
        heading: 'Delivery times',
        paragraphs: [
          'Metro cities: typically 2–4 working days. Rest of India: typically 4–7 working days. Remote pin codes can take a little longer.',
          'These are estimates from our courier partners, not guarantees. Weather, strikes and local restrictions occasionally add a day or two.',
        ],
      },
      {
        heading: 'Shipping charges',
        paragraphs: [
          'A flat shipping charge applies to every order, and orders above the free-shipping threshold ship at no cost. Both figures are shown in your basket before you pay, and are set from the store settings so they are always current.',
        ],
      },
      {
        heading: 'Tracking',
        paragraphs: [
          'You will receive a tracking link by email as soon as your parcel is handed to the courier. You can also follow the status of every order from your account.',
        ],
      },
      {
        heading: 'Damaged or missing parcels',
        paragraphs: [
          'Glass travels well when it is packed properly, and we pack carefully — but accidents happen. If your parcel arrives damaged, photograph it before opening and contact us within 48 hours and we will replace it.',
          'If tracking has not moved for five working days, tell us and we will open an investigation with the courier on your behalf.',
        ],
      },
    ],
  },

  refund: {
    title: 'Refund Policy',
    intro:
      'We want you to be happy with your honey. Here is exactly when we will replace a jar or refund you.',
    sections: [
      {
        heading: 'When you can return an order',
        paragraphs: [
          'Tell us within 7 days of delivery if a jar arrives damaged or leaking, if you received the wrong item, or if the honey is not as described. Send a photograph with your message and we will sort it out.',
        ],
      },
      {
        heading: 'What we cannot accept',
        paragraphs: [
          'For food-safety reasons we cannot accept a return of a jar that has been opened, unless the product itself is faulty.',
          'Crystallised honey is not a fault. It is the natural behaviour of raw honey and reverses with gentle warming.',
        ],
      },
      {
        heading: 'How refunds are paid',
        paragraphs: [
          'Approved refunds are issued within 5–7 working days. UPI payments are returned to the account they came from. Cash-on-delivery orders are refunded by bank transfer to details you provide.',
          'Where a coupon was used, the refund is the amount actually paid, not the pre-discount value.',
        ],
      },
      {
        heading: 'Cancelling an order',
        paragraphs: [
          'You can cancel from your account at any time before the order is packed, and any payment is returned in full. Once a parcel has been packed or shipped it can no longer be cancelled online — contact us and we will help.',
        ],
      },
    ],
  },
};
