'use client';

import { forwardRef, useState } from 'react';

import Input from '@/components/ui/Input';

/**
 * Password field with a show/hide toggle.
 *
 * The toggle is a real button with `aria-pressed`, so the state is announced
 * rather than only being visible through the icon change.
 */
const PasswordInput = forwardRef(function PasswordInput({ label = 'Password', ...props }, ref) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        ref={ref}
        type={isVisible ? 'text' : 'password'}
        label={label}
        className="pr-12"
        {...props}
      />

      <button
        type="button"
        onClick={() => setIsVisible((visible) => !visible)}
        aria-pressed={isVisible}
        aria-label={isVisible ? 'Hide password' : 'Show password'}
        className="absolute top-8 right-1 rounded-lg p-2 text-bark-400 transition-colors hover:text-bark-700"
      >
        {isVisible ? (
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M3 3l18 18M10.6 10.7a2 2 0 002.8 2.8" strokeLinecap="round" />
            <path
              d="M9.4 5.3A9.5 9.5 0 0112 5c5 0 9 4.5 9 7 0 .9-.6 2.2-1.7 3.4M6.3 6.7C4 8.2 3 10.3 3 12c0 2.5 4 7 9 7 1.2 0 2.3-.2 3.3-.6"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M3 12s3.6-7 9-7 9 7 9 7-3.6 7-9 7-9-7-9-7z" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="2.6" />
          </svg>
        )}
      </button>
    </div>
  );
});

export default PasswordInput;

/**
 * Live strength meter. Purely advisory — the API enforces the real rule
 * (8+ characters with upper, lower and a digit).
 */
export function PasswordStrength({ value = '' }) {
  const checks = [
    { label: '8+ characters', passed: value.length >= 8 },
    { label: 'Uppercase letter', passed: /[A-Z]/.test(value) },
    { label: 'Lowercase letter', passed: /[a-z]/.test(value) },
    { label: 'A number', passed: /\d/.test(value) },
  ];

  const score = checks.filter((check) => check.passed).length;
  if (!value) return null;

  const tone =
    score <= 1 ? 'bg-[var(--color-danger)]' : score <= 3 ? 'bg-honey-500' : 'bg-leaf-500';

  return (
    <div className="mt-2">
      <div className="flex gap-1.5" aria-hidden="true">
        {[0, 1, 2, 3].map((index) => (
          <span
            key={index}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              index < score ? tone : 'bg-bark-100'
            }`}
          />
        ))}
      </div>

      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {checks.map((check) => (
          <li
            key={check.label}
            className={`text-[11px] ${check.passed ? 'text-leaf-700' : 'text-bark-400'}`}
          >
            {check.passed ? '✓' : '○'} {check.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
