import { siteConfig } from '@/config/site';

/**
 * WhatsApp deep linking.
 *
 * `wa.me` and `api.whatsapp.com` both land on an interstitial page on desktop
 * ("Open app" / "Continue to WhatsApp Web"), which is an extra click for every
 * customer. These helpers send each device straight to the surface it can
 * actually use:
 *
 *   phone / tablet -> the WhatsApp app (via wa.me, which deep-links natively)
 *   desktop        -> the installed desktop app if it answers the `whatsapp:`
 *                     protocol, otherwise web.whatsapp.com
 */

/** Digits only — WhatsApp rejects `+`, spaces and dashes in the phone segment. */
const normaliseNumber = (value) => String(value || '').replace(/\D/g, '');

export const isMobileDevice = () => {
  if (typeof navigator === 'undefined') return false;

  // `userAgentData` is authoritative where it exists (Chromium); the regex is
  // the fallback for Safari and Firefox.
  if (typeof navigator.userAgentData?.mobile === 'boolean') {
    return navigator.userAgentData.mobile;
  }

  return /android|iphone|ipad|ipod|opera mini|iemobile|blackberry|webos/i.test(
    navigator.userAgent || ''
  );
};

/**
 * Universal link used as the anchor's `href`.
 *
 * Rendered identically on server and client so hydration matches, and it works
 * on its own if JavaScript never runs.
 */
export const buildWhatsAppUrl = (message, phone = siteConfig.contact.whatsapp) => {
  const number = normaliseNumber(phone);
  const query = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${number}${query}`;
};

export const buildWhatsAppWebUrl = (message, phone = siteConfig.contact.whatsapp) => {
  const number = normaliseNumber(phone);
  const text = message ? `&text=${encodeURIComponent(message)}` : '';
  return `https://web.whatsapp.com/send?phone=${number}${text}`;
};

export const buildWhatsAppProtocolUrl = (message, phone = siteConfig.contact.whatsapp) => {
  const number = normaliseNumber(phone);
  const text = message ? `&text=${encodeURIComponent(message)}` : '';
  return `whatsapp://send?phone=${number}${text}`;
};

const DESKTOP_APP_TIMEOUT_MS = 1200;

/**
 * Click handler that routes to the best target for the current device.
 *
 * On desktop it first asks the operating system to open the `whatsapp:`
 * protocol. If the desktop app is installed the browser hands over and the tab
 * loses focus — the `blur`/`visibilitychange` listener sees that and cancels
 * the fallback. If nothing handles the protocol the page stays focused and
 * WhatsApp Web opens instead, so the customer never lands on the interstitial.
 */
export const openWhatsApp = (message, phone = siteConfig.contact.whatsapp) => {
  if (typeof window === 'undefined') return;

  if (isMobileDevice()) {
    window.location.href = buildWhatsAppUrl(message, phone);
    return;
  }

  let hasHandedOff = false;
  const markHandedOff = () => {
    hasHandedOff = true;
  };

  window.addEventListener('blur', markHandedOff, { once: true });
  document.addEventListener('visibilitychange', markHandedOff, { once: true });

  // A hidden iframe keeps an unregistered protocol from replacing the page or
  // showing a navigation error in the address bar.
  const probe = document.createElement('iframe');
  probe.style.display = 'none';
  probe.src = buildWhatsAppProtocolUrl(message, phone);
  document.body.appendChild(probe);

  window.setTimeout(() => {
    probe.remove();
    window.removeEventListener('blur', markHandedOff);
    document.removeEventListener('visibilitychange', markHandedOff);

    if (!hasHandedOff && document.visibilityState === 'visible') {
      window.open(buildWhatsAppWebUrl(message, phone), '_blank', 'noopener,noreferrer');
    }
  }, DESKTOP_APP_TIMEOUT_MS);
};
