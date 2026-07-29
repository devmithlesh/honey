'use client';

import WhatsAppLink from '@/components/shared/WhatsAppLink';
import { siteConfig } from '@/config/site';

const HOURS = [
  { day: 'Monday – Friday', time: '9:00 am – 7:00 pm' },
  { day: 'Saturday', time: '9:00 am – 5:00 pm' },
  { day: 'Sunday', time: 'Closed' },
];

/**
 * Direct contact channels beside the form — phone, email, WhatsApp, address and
 * opening hours, plus social links.
 */
export default function ContactChannels({ details }) {
  return (
    <div className="space-y-4">
      <Channel
        icon="📞"
        label="Call us"
        value={details.phone}
        href={`tel:${details.phone.replace(/\s/g, '')}`}
        note="9am–7pm, Monday to Saturday"
      />

      <Channel
        icon="✉️"
        label="Email us"
        value={details.email}
        href={`mailto:${details.email}`}
        note="We reply within one working day"
      />

      <div className="rounded-[var(--radius-card)] border border-bark-100 bg-white p-5">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-leaf-100 text-lg">
            <span aria-hidden="true">💬</span>
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-wide text-bark-500 uppercase">WhatsApp</p>
            <WhatsAppLink
              phone={details.whatsapp}
              message={`Hello ${siteConfig.name}, I have a question.`}
              className="mt-0.5 block text-sm font-semibold text-bark-900 hover:text-honey-700"
            >
              Start a chat
            </WhatsAppLink>
            <p className="mt-1 text-xs text-bark-500">Usually the fastest way to reach us</p>
          </div>
        </div>
      </div>

      <div className="rounded-[var(--radius-card)] border border-bark-100 bg-white p-5">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-honey-100 text-lg">
            <span aria-hidden="true">📍</span>
          </span>
          <div>
            <p className="text-xs font-semibold tracking-wide text-bark-500 uppercase">The farm</p>
            <p className="mt-1 text-sm leading-relaxed text-bark-700">{details.address}</p>
            <p className="mt-1.5 text-xs text-bark-500">Visits by appointment only</p>
          </div>
        </div>
      </div>

      <div className="rounded-[var(--radius-card)] border border-bark-100 bg-white p-5">
        <p className="text-xs font-semibold tracking-wide text-bark-500 uppercase">Opening hours</p>
        <dl className="mt-3 space-y-2">
          {HOURS.map((entry) => (
            <div key={entry.day} className="flex justify-between text-sm">
              <dt className="text-bark-600">{entry.day}</dt>
              <dd className="font-medium text-bark-900">{entry.time}</dd>
            </div>
          ))}
        </dl>
      </div>

      {(details.instagram || details.facebook) && (
        <div className="rounded-[var(--radius-card)] border border-bark-100 bg-white p-5">
          <p className="text-xs font-semibold tracking-wide text-bark-500 uppercase">Follow along</p>
          <div className="mt-3 flex gap-2">
            {details.instagram && (
              <SocialLink href={details.instagram} label="Instagram">
                IG
              </SocialLink>
            )}
            {details.facebook && (
              <SocialLink href={details.facebook} label="Facebook">
                FB
              </SocialLink>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Channel({ icon, label, value, href, note }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-bark-100 bg-white p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-honey-100 text-lg">
          <span aria-hidden="true">{icon}</span>
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wide text-bark-500 uppercase">{label}</p>
          <a
            href={href}
            className="mt-0.5 block truncate text-sm font-semibold text-bark-900 hover:text-honey-700"
          >
            {value}
          </a>
          {note && <p className="mt-1 text-xs text-bark-500">{note}</p>}
        </div>
      </div>
    </div>
  );
}

function SocialLink({ href, label, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="grid size-10 place-items-center rounded-full border border-bark-200 text-xs font-bold text-bark-600 transition-colors hover:border-honey-400 hover:bg-honey-400 hover:text-bark-900"
    >
      {children}
    </a>
  );
}
