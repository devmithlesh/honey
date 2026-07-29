'use strict';

const nodemailer = require('nodemailer');

const env = require('../config/env');
const logger = require('../utils/logger');

/**
 * Transport is created lazily and reused. Without SMTP credentials the service
 * logs the message instead of sending it, so password reset still works end to
 * end in local development without a mail provider.
 */
let transporter = null;

const getTransporter = () => {
  if (!env.mail.isConfigured) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.mail.host,
      port: env.mail.port,
      secure: env.mail.secure,
      auth: env.mail.user ? { user: env.mail.user, pass: env.mail.password } : undefined,
    });
  }
  return transporter;
};

const sendMail = async ({ to, subject, html, text }) => {
  const mailer = getTransporter();

  if (!mailer) {
    logger.warn(`[mail:disabled] to=${to} subject="${subject}"`);
    logger.debug(text || html);
    return { delivered: false };
  }

  await mailer.sendMail({
    from: `"${env.mail.fromName}" <${env.mail.fromAddress}>`,
    to,
    subject,
    text,
    html,
  });

  return { delivered: true };
};

const layout = (heading, body) => `
  <div style="font-family:Segoe UI,Helvetica,Arial,sans-serif;background:#fdf8ed;padding:32px">
    <div style="max-width:560px;margin:auto;background:#fff;border-radius:16px;padding:32px">
      <h1 style="font-size:20px;color:#3e2a21;margin:0 0 16px">${heading}</h1>
      <div style="font-size:15px;line-height:1.6;color:#5c3d30">${body}</div>
      <p style="margin-top:32px;font-size:12px;color:#96674c">${env.appName}</p>
    </div>
  </div>`;

const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${env.clientUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;

  return sendMail({
    to: user.email,
    subject: `Reset your ${env.appName} password`,
    text: `Hi ${user.name},\n\nReset your password using this link (valid for ${env.jwt.resetExpiresIn}):\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
    html: layout(
      'Reset your password',
      `<p>Hi ${user.name},</p>
       <p>Click the button below to choose a new password. The link expires in ${env.jwt.resetExpiresIn}.</p>
       <p style="margin:24px 0">
         <a href="${resetUrl}" style="background:#f79009;color:#2a1c16;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:600">Reset password</a>
       </p>
       <p style="font-size:13px;color:#96674c">If you did not request this, you can safely ignore this email.</p>`
    ),
  });
};

const sendOrderConfirmationEmail = async (order) => {
  const lines = (order.items || [])
    .map(
      (item) =>
        `<tr><td style="padding:6px 0">${item.productName} × ${item.quantity}</td><td align="right">₹${item.lineTotal}</td></tr>`
    )
    .join('');

  return sendMail({
    to: order.customerEmail,
    subject: `Order ${order.orderNumber} confirmed`,
    text: `Thanks for your order ${order.orderNumber}. Total: ₹${order.grandTotal}.`,
    html: layout(
      `Order ${order.orderNumber} confirmed`,
      `<p>Hi ${order.customerName}, thank you for your order.</p>
       <table style="width:100%;border-collapse:collapse;margin:16px 0">${lines}</table>
       <p><strong>Total paid: ₹${order.grandTotal}</strong></p>
       <p><a href="${env.clientUrl}/order-success/${order.orderNumber}">View your order</a></p>`
    ),
  });
};

module.exports = { sendMail, sendPasswordResetEmail, sendOrderConfirmationEmail };
