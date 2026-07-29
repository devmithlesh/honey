'use client';

import { motion } from 'framer-motion';

import { siteConfig } from '@/config/site';
import { buildWhatsAppUrl, openWhatsApp } from '@/lib/utils/whatsapp';

const MESSAGE = `Hello ${siteConfig.name}, I have a question about your honey.`;

/**
 * Floating WhatsApp shortcut.
 *
 * Delayed and spring-scaled so it arrives after the page has settled rather
 * than competing with the hero for attention on first paint. The click routes
 * to the app on mobile, the desktop app if installed, or WhatsApp Web —
 * never the "Open app / Continue to Web" interstitial.
 */
export default function WhatsAppButton() {
  const handleClick = (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    openWhatsApp(MESSAGE);
  };

  return (
    <motion.a
      href={buildWhatsAppUrl(MESSAGE)}
      onClick={handleClick}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed right-4 bottom-4 z-30 grid size-14 place-items-center rounded-full bg-[#25D366] text-white shadow-[var(--shadow-lifted)] sm:right-6 sm:bottom-6"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1.1, type: 'spring', stiffness: 260, damping: 18 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.94 }}
    >
      <svg viewBox="0 0 24 24" className="size-7" fill="currentColor" aria-hidden="true">
        <path d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.2-.7.1-.2.3-.7 1-.9 1.2-.2.2-.3.2-.6.1-1.7-.9-2.9-1.6-4-3.6-.3-.5.3-.5.8-1.5.1-.2 0-.4 0-.5s-.7-1.6-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5 1.9.8 2.6.9 3.5.7.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.5-.3z" />
        <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z" />
      </svg>
    </motion.a>
  );
}
