'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

import Button from '@/components/ui/Button';
import { adminApi } from '@/lib/api/services';
import { parseApiError } from '@/lib/api/client';
import { formatCurrency, formatDate } from '@/lib/utils/format';

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const formatAddress = (address = {}) =>
  [
    address.fullName,
    address.line1,
    address.line2,
    `${address.city || ''}, ${address.state || ''} ${address.postalCode || ''}`,
    address.country,
    address.phone,
  ]
    .filter((line) => line && line.trim() !== ',')
    .map((line) => escapeHtml(line))
    .join('<br>');

/**
 * Printable invoice.
 *
 * The API returns the order plus the seller's details, and the markup is
 * assembled here and opened in a new window with `print()` — no PDF dependency,
 * and the browser's own print dialog lets the admin save to PDF anyway.
 */
export default function InvoiceButton({ orderId }) {
  const [isBusy, setIsBusy] = useState(false);

  const handlePrint = async () => {
    setIsBusy(true);
    try {
      const { order, seller, generatedAt } = await adminApi.getInvoice(orderId);

      // Opened before the markup is written so the browser attributes the popup
      // to the click, rather than blocking it as an unsolicited window.
      const printWindow = window.open('', '_blank', 'width=900,height=1000');
      if (!printWindow) {
        toast.error('Allow pop-ups for this site to print the invoice');
        return;
      }

      const rows = (order.items || [])
        .map(
          (item, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>
                <strong>${escapeHtml(item.productName)}</strong><br>
                <span class="muted">${escapeHtml(item.productSku)}${item.weight ? ` · ${escapeHtml(item.weight)}` : ''}</span>
              </td>
              <td class="right">${formatCurrency(item.unitPrice)}</td>
              <td class="right">${item.quantity}</td>
              <td class="right">${formatCurrency(item.lineTotal)}</td>
            </tr>`
        )
        .join('');

      printWindow.document.write(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Invoice ${escapeHtml(order.orderNumber)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", Helvetica, Arial, sans-serif; color: #3e2a21; margin: 0; padding: 40px; }
  h1 { font-size: 22px; margin: 0; }
  .muted { color: #96674c; font-size: 12px; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f79009; padding-bottom: 20px; }
  .meta { text-align: right; font-size: 13px; }
  .cols { display: flex; gap: 40px; margin: 28px 0; }
  .col { flex: 1; font-size: 13px; line-height: 1.6; }
  .label { font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: #96674c; margin-bottom: 6px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; background: #fffaeb; padding: 10px; font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: #7d5340; }
  td { padding: 10px; border-bottom: 1px solid #f0e7e0; vertical-align: top; }
  .right { text-align: right; }
  .totals { margin-left: auto; margin-top: 20px; width: 280px; font-size: 13px; }
  .totals div { display: flex; justify-content: space-between; padding: 6px 0; }
  .totals .grand { border-top: 2px solid #3e2a21; margin-top: 6px; padding-top: 10px; font-size: 16px; font-weight: 700; }
  footer { margin-top: 40px; border-top: 1px solid #f0e7e0; padding-top: 16px; font-size: 11px; color: #96674c; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
  <div class="head">
    <div>
      <h1>${escapeHtml(seller.name || 'Honey Bee Farm')}</h1>
      <p class="muted">${escapeHtml(seller.address || '')}<br>${escapeHtml(seller.email || '')} · ${escapeHtml(seller.phone || '')}</p>
    </div>
    <div class="meta">
      <strong style="font-size:18px">INVOICE</strong><br>
      <span class="muted">${escapeHtml(order.orderNumber)}</span><br>
      <span class="muted">${formatDate(order.placedAt)}</span>
    </div>
  </div>

  <div class="cols">
    <div class="col">
      <div class="label">Billed to</div>
      ${formatAddress(order.billingAddress)}
    </div>
    <div class="col">
      <div class="label">Delivered to</div>
      ${formatAddress(order.shippingAddress)}
    </div>
    <div class="col">
      <div class="label">Payment</div>
      ${escapeHtml((order.payment?.method || '').toUpperCase())} — ${escapeHtml((order.payment?.status || '').replace(/_/g, ' '))}<br>
      ${order.payment?.transactionReference ? `Ref: ${escapeHtml(order.payment.transactionReference)}` : ''}
    </div>
  </div>

  <table>
    <thead>
      <tr><th>#</th><th>Item</th><th class="right">Price</th><th class="right">Qty</th><th class="right">Amount</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="totals">
    <div><span>Subtotal</span><span>${formatCurrency(order.subtotal)}</span></div>
    ${Number(order.discountTotal) > 0 ? `<div><span>Discount${order.couponCode ? ` (${escapeHtml(order.couponCode)})` : ''}</span><span>− ${formatCurrency(order.discountTotal)}</span></div>` : ''}
    <div><span>Shipping</span><span>${Number(order.shippingTotal) === 0 ? 'Free' : formatCurrency(order.shippingTotal)}</span></div>
    <div class="grand"><span>Total</span><span>${formatCurrency(order.grandTotal)}</span></div>
  </div>

  <footer>
    Thank you for your order. Generated on ${formatDate(generatedAt)}.<br>
    This is a computer-generated invoice and does not require a signature.
  </footer>
</body>
</html>`);

      printWindow.document.close();
      printWindow.focus();
      // A short delay lets the document lay out before the print dialog opens,
      // otherwise some browsers print a blank first page.
      printWindow.setTimeout(() => printWindow.print(), 350);
    } catch (error) {
      toast.error(parseApiError(error).message);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handlePrint} isLoading={isBusy}>
      Print invoice
    </Button>
  );
}
