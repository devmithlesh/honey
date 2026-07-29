'use client';

import { motion } from 'framer-motion';

import { formatDateTime } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

const STEPS = [
  { status: 'pending', label: 'Order placed', field: 'placedAt', icon: '📝' },
  { status: 'confirmed', label: 'Confirmed', field: 'confirmedAt', icon: '✅' },
  { status: 'packed', label: 'Packed', field: 'packedAt', icon: '📦' },
  { status: 'shipped', label: 'Shipped', field: 'shippedAt', icon: '🚚' },
  { status: 'delivered', label: 'Delivered', field: 'deliveredAt', icon: '🏡' },
];

/**
 * Fulfilment progress.
 *
 * A cancelled order does not belong on this ladder — it left the flow — so it
 * renders as its own terminal state instead of a half-filled timeline.
 */
export default function OrderTimeline({ order, className }) {
  if (order.status === 'cancelled') {
    return (
      <div className={cn('flex items-center gap-4 rounded-xl bg-red-50 p-5', className)}>
        <span className="grid size-11 place-items-center rounded-full bg-red-100 text-xl" aria-hidden="true">
          ✕
        </span>
        <div>
          <p className="text-sm font-semibold text-red-800">Order cancelled</p>
          {order.cancelledAt && (
            <p className="mt-0.5 text-xs text-red-600">{formatDateTime(order.cancelledAt)}</p>
          )}
        </div>
      </div>
    );
  }

  const currentIndex = STEPS.findIndex((step) => step.status === order.status);
  const progress = currentIndex <= 0 ? 0 : currentIndex / (STEPS.length - 1);

  return (
    <div className={className}>
      <ol className="relative flex justify-between">
        <div
          aria-hidden="true"
          className="absolute top-5 right-5 left-5 h-0.5 bg-bark-100"
        />
        <motion.div
          aria-hidden="true"
          className="absolute top-5 left-5 h-0.5 origin-left bg-honey-500"
          style={{ right: '1.25rem' }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: progress }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />

        {STEPS.map((step, index) => {
          const isDone = index <= currentIndex;
          const timestamp = order[step.field];

          return (
            <li key={step.status} className="relative z-10 flex flex-1 flex-col items-center text-center">
              <motion.span
                className={cn(
                  'grid size-10 place-items-center rounded-full border-4 border-white text-base transition-colors',
                  isDone ? 'bg-honey-500' : 'bg-bark-100'
                )}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                aria-hidden="true"
              >
                {step.icon}
              </motion.span>

              <p
                className={cn(
                  'mt-2 text-[11px] font-medium sm:text-xs',
                  isDone ? 'text-bark-900' : 'text-bark-400'
                )}
              >
                {step.label}
              </p>

              {timestamp && isDone && (
                <p className="mt-0.5 hidden text-[10px] text-bark-400 sm:block">
                  {formatDateTime(timestamp)}
                </p>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
