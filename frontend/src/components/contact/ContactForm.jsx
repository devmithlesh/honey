'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

import Button from '@/components/ui/Button';
import Input, { Select, Textarea } from '@/components/ui/Input';
import { CONTACT_REASONS } from '@/config/content';
import { openWhatsApp } from '@/lib/utils/whatsapp';
import { siteConfig } from '@/config/site';

/**
 * Contact form.
 *
 * Phase 1 has no ticketing system behind it, so rather than pretending to send
 * an email into a void, the message is composed and handed to WhatsApp — the
 * channel the farm actually watches. Swapping `onSubmit` for a POST is the only
 * change needed once a support inbox exists.
 */
export default function ContactForm() {
  const [isSent, setIsSent] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { name: '', email: '', phone: '', reason: 'order', message: '' },
  });

  const onSubmit = async (values) => {
    const reasonLabel =
      CONTACT_REASONS.find((reason) => reason.value === values.reason)?.label || 'Enquiry';

    const composed = [
      `Hello ${siteConfig.name},`,
      '',
      `Subject: ${reasonLabel}`,
      `Name: ${values.name}`,
      `Email: ${values.email}`,
      values.phone ? `Phone: ${values.phone}` : null,
      '',
      values.message,
    ]
      .filter((line) => line !== null)
      .join('\n');

    openWhatsApp(composed);

    setIsSent(true);
    reset();
    toast.success('Your message is ready to send in WhatsApp');
  };

  if (isSent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-[var(--radius-card)] border border-leaf-200 bg-leaf-50 p-10 text-center"
      >
        <span className="text-4xl" aria-hidden="true">
          ✅
        </span>
        <h2 className="mt-4 text-xl font-semibold text-bark-900">Message ready</h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-bark-600">
          We have opened WhatsApp with your message filled in — press send there and we will reply,
          usually within a couple of hours on working days.
        </p>
        <Button onClick={() => setIsSent(false)} variant="outline" className="mt-6">
          Write another message
        </Button>
      </motion.div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-[var(--radius-card)] border border-bark-100 bg-white p-6 sm:p-8"
      noValidate
    >
      <h2 className="text-xl font-semibold text-bark-900">Send us a message</h2>
      <p className="mt-2 text-sm text-bark-600">
        Fill this in and we will open WhatsApp with your message ready to send.
      </p>

      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <Input
          label="Your name"
          required
          autoComplete="name"
          error={errors.name?.message}
          {...register('name', {
            required: 'Please tell us your name',
            minLength: { value: 2, message: 'Enter your full name' },
          })}
        />

        <Input
          label="Email address"
          required
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email', {
            required: 'We need an email to reply to',
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address' },
          })}
        />

        <Input
          label="Phone number"
          type="tel"
          autoComplete="tel"
          hint="Optional — helps if the query is about a delivery."
          error={errors.phone?.message}
          {...register('phone', {
            pattern: { value: /^[+]?[\d\s\-()]{7,20}$/, message: 'Enter a valid phone number' },
          })}
        />

        <Select label="What is it about?" required {...register('reason')}>
          {CONTACT_REASONS.map((reason) => (
            <option key={reason.value} value={reason.value}>
              {reason.label}
            </option>
          ))}
        </Select>

        <Textarea
          label="Your message"
          required
          rows={5}
          wrapperClassName="sm:col-span-2"
          placeholder="Tell us what you need — the more detail, the better we can help."
          error={errors.message?.message}
          {...register('message', {
            required: 'Please write your message',
            minLength: { value: 10, message: 'A little more detail, please' },
            maxLength: { value: 2000, message: 'Keep it under 2000 characters' },
          })}
        />
      </div>

      <Button type="submit" size="lg" isLoading={isSubmitting} className="mt-7 w-full sm:w-auto">
        Send message
      </Button>

      <p className="mt-4 text-xs text-bark-500">
        We only use your details to answer this enquiry. See our privacy policy.
      </p>
    </form>
  );
}
