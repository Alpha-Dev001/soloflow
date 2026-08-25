/**
 * Payment provider abstraction.
 * MockPaymentProvider simulates checkout today; replace with StripePaymentProvider later.
 */

export interface CheckoutSessionInput {
  userId: string;
  email: string;
  plan: 'pro';
  amountCents: number;
  currency: string;
  /** Simulation control — 'success' | 'failure' */
  simulate?: 'success' | 'failure';
}

export interface CheckoutSessionResult {
  sessionId: string;
  provider: string;
  status: 'pending' | 'succeeded' | 'failed';
  amountCents: number;
  currency: string;
  message?: string;
}

export interface PaymentConfirmInput {
  sessionId: string;
  userId: string;
  /** Force outcome for mock provider */
  simulate?: 'success' | 'failure';
}

export interface PaymentConfirmResult {
  sessionId: string;
  provider: string;
  status: 'succeeded' | 'failed';
  providerReference: string;
  message?: string;
}

export interface PaymentProvider {
  readonly name: string;
  createCheckoutSession(
    input: CheckoutSessionInput,
  ): Promise<CheckoutSessionResult>;
  confirmPayment(input: PaymentConfirmInput): Promise<PaymentConfirmResult>;
}
