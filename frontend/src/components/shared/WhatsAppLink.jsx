'use client';

import { buildWhatsAppUrl, openWhatsApp } from '@/lib/utils/whatsapp';

/**
 * Anchor that opens WhatsApp on whichever surface the visitor is using: the
 * mobile app, the installed desktop app, or WhatsApp Web.
 *
 * The `href` is a plain `wa.me` link so the element is a real, copyable,
 * middle-clickable link that still works without JavaScript. The click handler
 * upgrades it to the device-specific target.
 */
export default function WhatsAppLink({ message, phone, className, children, ...props }) {
  const handleClick = (event) => {
    // Let the browser handle modified clicks (new tab, new window, download).
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;

    event.preventDefault();
    openWhatsApp(message, phone);
  };

  return (
    <a
      href={buildWhatsAppUrl(message, phone)}
      onClick={handleClick}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      {...props}
    >
      {children}
    </a>
  );
}
