'use client';

import { useId, useState } from 'react';
import { motion } from 'framer-motion';

import { formatCurrency } from '@/lib/utils/format';

/**
 * Revenue sparkline drawn as inline SVG.
 *
 * A charting library would be a large dependency for one small chart, so the
 * area path is computed directly. Values are normalised to a 0–100 viewBox and
 * stretched with `preserveAspectRatio="none"`, which keeps the chart responsive
 * without recomputing on resize.
 */
const CHART_HEIGHT = 100;
const CHART_WIDTH = 100;

export default function RevenueChart({ series = [], className }) {
  const gradientId = useId();
  const [hovered, setHovered] = useState(null);

  if (series.length === 0) {
    return <p className={`py-16 text-center text-sm text-bark-400 ${className}`}>No data yet</p>;
  }

  const maxRevenue = Math.max(...series.map((point) => point.revenue), 1);
  const step = series.length > 1 ? CHART_WIDTH / (series.length - 1) : CHART_WIDTH;

  const points = series.map((point, index) => ({
    ...point,
    x: index * step,
    y: CHART_HEIGHT - (point.revenue / maxRevenue) * (CHART_HEIGHT - 10),
  }));

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`)
    .join(' ');

  const areaPath = `${linePath} L${CHART_WIDTH},${CHART_HEIGHT} L0,${CHART_HEIGHT} Z`;

  const total = series.reduce((sum, point) => sum + point.revenue, 0);
  const orders = series.reduce((sum, point) => sum + point.orders, 0);
  const active = hovered !== null ? points[hovered] : null;

  return (
    <div className={className}>
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
        <div>
          <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-bark-900">
            {formatCurrency(total)}
          </p>
          <p className="text-xs text-bark-500">across {orders} orders</p>
        </div>

        {active && (
          <div className="text-xs text-bark-600">
            <span className="font-semibold text-bark-900">{formatCurrency(active.revenue)}</span> on{' '}
            {new Date(active.day).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </div>
        )}
      </div>

      <div className="relative mt-4">
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          preserveAspectRatio="none"
          className="h-40 w-full overflow-visible"
          role="img"
          aria-label={`Revenue over the last ${series.length} days, totalling ${formatCurrency(total)}`}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-honey-400)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--color-honey-400)" stopOpacity="0" />
            </linearGradient>
          </defs>

          <motion.path
            d={areaPath}
            fill={`url(#${gradientId})`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          />

          <motion.path
            d={linePath}
            fill="none"
            stroke="var(--color-honey-500)"
            strokeWidth="2"
            // `vectorEffect` keeps the stroke an even 2px despite the
            // non-uniform scaling from preserveAspectRatio="none".
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />

          {points.map((point, index) => (
            <circle
              key={point.day}
              cx={point.x}
              cy={point.y}
              r={hovered === index ? 3 : 0}
              fill="var(--color-honey-600)"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>

        {/* Invisible hover targets, one per day. */}
        <div className="absolute inset-0 flex">
          {points.map((point, index) => (
            <button
              key={point.day}
              type="button"
              className="h-full flex-1"
              onMouseEnter={() => setHovered(index)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(index)}
              onBlur={() => setHovered(null)}
              aria-label={`${point.day}: ${formatCurrency(point.revenue)} from ${point.orders} orders`}
            />
          ))}
        </div>
      </div>

      <div className="mt-2 flex justify-between text-[10px] text-bark-400">
        <span>
          {new Date(series[0].day).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </span>
        <span>
          {new Date(series[series.length - 1].day).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
          })}
        </span>
      </div>
    </div>
  );
}
