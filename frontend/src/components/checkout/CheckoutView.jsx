'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';

import Button from '@/components/ui/Button';
import Input, { Checkbox, Textarea } from '@/components/ui/Input';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import OrderSummary from '@/components/cart/OrderSummary';
import PaymentMethods from './PaymentMethods';
import SavedAddressPicker from './SavedAddressPicker';
import { ROUTES } from '@/config/site';
import { clearCart, selectCart, selectCartSubtotal } from '@/features/cart/cartSlice';
import { accountApi, catalogApi, checkoutApi } from '@/lib/api/services';
import { parseApiError } from '@/lib/api/client';
import { useAsyncData, useAuth, useIsHydrated } from '@/lib/hooks';
import { formatCurrency } from '@/lib/utils/format';

const EMPTY_ADDRESS = {
  fullName: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India',
};

/**
 * Checkout.
 *
 * Totals are never computed here. The cart is sent to `/orders/quote` and the
 * server's figures are what the customer sees and what the order is written
 * with, so a tampered client cannot change the price.
 */
export default function CheckoutView() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, isAuthenticated, isBootstrapped } = useAuth();
  const { items, coupon, isHydrated: isCartLoaded } = useSelector(selectCart);
  const clientSubtotal = useSelector(selectCartSubtotal);
  const isHydrated = useIsHydrated();

  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [isPlacing, setIsPlacing] = useState(false);

  const { data: settings } = useAsyncData(() => catalogApi.getSettings(), []);
  const { data: savedAddresses } = useAsyncData(() => accountApi.listAddresses(), [isAuthenticated], {
    enabled: isAuthenticated,
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      shipping: EMPTY_ADDRESS,
      billing: EMPTY_ADDRESS,
      transactionReference: '',
      customerNote: '',
    },
  });

  // Prefill from the signed-in account once the session has resolved.
  useEffect(() => {
    if (!user) return;
    setValue('customerName', user.name || '');
    setValue('customerEmail', user.email || '');
    setValue('customerPhone', user.phone || '');
    setValue('shipping.fullName', user.name || '');
    setValue('shipping.phone', user.phone || '');
  }, [user, setValue]);

  /**
   * The server prices the cart. Its figures are what the customer sees and what
   * the order is written with, so a tampered client cannot change the total.
   */
  const cartSignature = items.map((item) => `${item.productId}x${item.quantity}`).join(',');

  const { data: quote, isLoading: isQuoting, error: quoteError } = useAsyncData(
    () =>
      checkoutApi.quote({
        items: items.map((item) => ({
          productId: Number(item.productId),
          quantity: item.quantity,
        })),
        couponCode: coupon?.code || undefined,
      }),
    [cartSignature, coupon?.code],
    { enabled: isHydrated && isCartLoaded && items.length > 0 }
  );

  useEffect(() => {
    if (quoteError) toast.error(quoteError.message);
  }, [quoteError]);

  const applySavedAddress = (address) => {
    setValue('shipping', {
      fullName: address.fullName,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2 || '',
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country || 'India',
    });
    toast.success('Address filled in');
  };

  const onSubmit = async (values) => {
    if (paymentMethod === 'upi' && !values.transactionReference?.trim()) {
      toast.error('Enter the UPI transaction reference after paying');
      return;
    }

    setIsPlacing(true);
    try {
      const order = await checkoutApi.placeOrder({
        items: items.map((item) => ({
          productId: Number(item.productId),
          quantity: item.quantity,
        })),
        customerName: values.customerName,
        customerEmail: values.customerEmail,
        customerPhone: values.customerPhone,
        shippingAddress: values.shipping,
        billingAddress: billingSameAsShipping ? undefined : values.billing,
        paymentMethod,
        transactionReference: paymentMethod === 'upi' ? values.transactionReference : undefined,
        couponCode: coupon?.code || undefined,
        customerNote: values.customerNote || undefined,
      });

      dispatch(clearCart());
      toast.success('Order placed — thank you!');
      router.push(ROUTES.orderSuccess(order.orderNumber));
    } catch (error) {
      const parsed = parseApiError(error);
      toast.error(parsed.message);
      parsed.errors?.forEach((fieldError) => toast.error(fieldError.message));
    } finally {
      setIsPlacing(false);
    }
  };

  if (!isHydrated || !isCartLoaded || !isBootstrapped) {
    return (
      <div className="container-page grid gap-10 py-12 lg:grid-cols-[1fr_22rem]" role="status" aria-busy="true">
        <span className="sr-only">Preparing checkout…</span>
        <Skeleton className="h-[36rem] w-full rounded-[var(--radius-card)]" />
        <Skeleton className="h-80 w-full rounded-[var(--radius-card)]" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon="🧺"
          title="There is nothing to check out"
          description="Add a jar or two to your basket and come back."
          actionLabel="Browse the shop"
          actionHref={ROUTES.shop}
        />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="container-page py-12 lg:py-16" noValidate>
      <div className="grid gap-10 lg:grid-cols-[1fr_22rem] lg:gap-12">
        <div className="space-y-8">
          {!isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-card)] bg-honey-50 px-5 py-4"
            >
              <p className="text-sm text-bark-700">
                Have an account? Sign in to use a saved address and track this order.
              </p>
              <Link
                href={`${ROUTES.login}?redirect=${encodeURIComponent(ROUTES.checkout)}`}
                className="text-sm font-semibold text-honey-700 underline underline-offset-4"
              >
                Sign in
              </Link>
            </motion.div>
          )}

          <Section title="Contact details" step={1}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Full name"
                required
                autoComplete="name"
                error={errors.customerName?.message}
                {...register('customerName', {
                  required: 'Enter your name',
                  minLength: { value: 2, message: 'Enter your full name' },
                })}
              />
              <Input
                label="Mobile number"
                required
                type="tel"
                autoComplete="tel"
                placeholder="+91 90000 00000"
                error={errors.customerPhone?.message}
                {...register('customerPhone', {
                  required: 'Enter a mobile number',
                  pattern: { value: /^[+]?[\d\s\-()]{7,20}$/, message: 'Enter a valid phone number' },
                })}
              />
              <Input
                label="Email address"
                required
                type="email"
                autoComplete="email"
                wrapperClassName="sm:col-span-2"
                hint="We send your order confirmation and tracking link here."
                error={errors.customerEmail?.message}
                {...register('customerEmail', {
                  required: 'Enter your email address',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address' },
                })}
              />
            </div>
          </Section>

          <Section title="Delivery address" step={2}>
            {isAuthenticated && savedAddresses?.length > 0 && (
              <SavedAddressPicker addresses={savedAddresses} onSelect={applySavedAddress} />
            )}

            <AddressFields prefix="shipping" register={register} errors={errors.shipping} />
          </Section>

          <Section title="Billing address" step={3}>
            <Checkbox
              label="Billing address is the same as my delivery address"
              checked={billingSameAsShipping}
              onChange={(event) => setBillingSameAsShipping(event.target.checked)}
            />

            {!billingSameAsShipping && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-5 overflow-hidden"
              >
                <AddressFields prefix="billing" register={register} errors={errors.billing} />
              </motion.div>
            )}
          </Section>

          <Section title="Payment" step={4}>
            <PaymentMethods
              value={paymentMethod}
              onChange={setPaymentMethod}
              settings={settings}
              amount={quote?.grandTotal ?? clientSubtotal}
              register={register}
              errors={errors}
            />
          </Section>

          <Section title="Order notes" step={5} isOptional>
            <Textarea
              label="Anything we should know?"
              placeholder="Delivery instructions, a gift message, a landmark near your address…"
              rows={3}
              {...register('customerNote', {
                maxLength: { value: 1000, message: 'Keep notes under 1000 characters' },
              })}
              error={errors.customerNote?.message}
            />
          </Section>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[var(--radius-card)] border border-bark-100 bg-white p-5">
            <h3 className="text-sm font-semibold text-bark-900">
              {items.length} item{items.length === 1 ? '' : 's'}
            </h3>

            <ul className="mt-4 space-y-3">
              {items.map((item) => (
                <li key={item.productId} className="flex gap-3">
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-cream-200">
                    {item.image ? (
                      <Image src={item.image} alt="" fill sizes="56px" className="object-cover" />
                    ) : (
                      <span className="grid h-full place-items-center text-lg" aria-hidden="true">
                        🍯
                      </span>
                    )}
                    <span className="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-bark-800 text-[10px] font-bold text-cream-50">
                      {item.quantity}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-bark-900">{item.name}</p>
                    {item.weight && <p className="text-[11px] text-bark-500">{item.weight}</p>}
                  </div>

                  <p className="shrink-0 text-xs font-semibold text-bark-900">
                    {formatCurrency(
                      (item.discountPrice && item.discountPrice < item.price
                        ? item.discountPrice
                        : item.price) * item.quantity
                    )}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <OrderSummary
            className="mt-4"
            subtotal={quote?.subtotal ?? clientSubtotal}
            discount={quote?.discountTotal ?? 0}
            shipping={isQuoting ? null : (quote?.shippingTotal ?? null)}
            total={quote?.grandTotal}
            couponCode={quote?.coupon?.code || coupon?.code}
            freeShippingThreshold={quote?.freeShippingThreshold}
          />

          <Button
            type="submit"
            size="lg"
            className="mt-4 w-full"
            isLoading={isPlacing}
            loadingText="Placing your order…"
            disabled={isQuoting || !quote}
          >
            {paymentMethod === 'cod' ? 'Place order' : 'I have paid — place order'}
          </Button>

          <p className="mt-3 text-center text-xs text-bark-500">
            By placing this order you agree to our{' '}
            <Link href={ROUTES.termsConditions} className="underline underline-offset-2">
              terms
            </Link>{' '}
            and{' '}
            <Link href={ROUTES.refundPolicy} className="underline underline-offset-2">
              refund policy
            </Link>
            .
          </p>
        </div>
      </div>
    </form>
  );
}

function Section({ title, step, isOptional, children }) {
  return (
    <section className="rounded-[var(--radius-card)] border border-bark-100 bg-white p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-honey-500 text-xs font-bold text-bark-900">
          {step}
        </span>
        <h2 className="text-base font-semibold text-bark-900">
          {title}
          {isOptional && <span className="ml-2 text-xs font-normal text-bark-400">(optional)</span>}
        </h2>
      </div>

      {children}
    </section>
  );
}

function AddressFields({ prefix, register, errors = {} }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Input
        label="Full name"
        required
        autoComplete="name"
        error={errors.fullName?.message}
        {...register(`${prefix}.fullName`, { required: 'Enter the recipient’s name' })}
      />
      <Input
        label="Phone number"
        required
        type="tel"
        autoComplete="tel"
        error={errors.phone?.message}
        {...register(`${prefix}.phone`, {
          required: 'Enter a contact number for delivery',
          pattern: { value: /^[+]?[\d\s\-()]{7,20}$/, message: 'Enter a valid phone number' },
        })}
      />
      <Input
        label="Address line 1"
        required
        autoComplete="address-line1"
        placeholder="House number and street"
        wrapperClassName="sm:col-span-2"
        error={errors.line1?.message}
        {...register(`${prefix}.line1`, { required: 'Enter your street address' })}
      />
      <Input
        label="Address line 2"
        autoComplete="address-line2"
        placeholder="Apartment, landmark (optional)"
        wrapperClassName="sm:col-span-2"
        {...register(`${prefix}.line2`)}
      />
      <Input
        label="City"
        required
        autoComplete="address-level2"
        error={errors.city?.message}
        {...register(`${prefix}.city`, { required: 'Enter your city' })}
      />
      <Input
        label="State"
        required
        autoComplete="address-level1"
        error={errors.state?.message}
        {...register(`${prefix}.state`, { required: 'Enter your state' })}
      />
      <Input
        label="PIN code"
        required
        inputMode="numeric"
        autoComplete="postal-code"
        error={errors.postalCode?.message}
        {...register(`${prefix}.postalCode`, {
          required: 'Enter your PIN code',
          pattern: { value: /^\d{4,10}$/, message: 'Enter a valid PIN code' },
        })}
      />
      <Input
        label="Country"
        required
        autoComplete="country-name"
        error={errors.country?.message}
        {...register(`${prefix}.country`, { required: 'Enter your country' })}
      />
    </div>
  );
}
