import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  CheckoutSessionInput,
  CheckoutSessionResult,
  PaymentConfirmInput,
  PaymentConfirmResult,
  PaymentProvider,
} from './payment-provider.interface';

/**
 * Development payment simulation.
 * Does NOT collect or store card data.
 * Swap for StripePaymentProvider when going live.
 */
@Injectable()
export class MockPaymentProvider implements PaymentProvider {
  readonly name = 'mock';

  /** In-memory sessions for the mock provider (dev only). */
  private readonly sessions = new Map<
    string,
    CheckoutSessionInput & { createdAt: Date }
  >();

  async createCheckoutSession(
    input: CheckoutSessionInput,
  ): Promise<CheckoutSessionResult> {
    const sessionId = `mock_cs_${randomUUID().replace(/-/g, '')}`;
    this.sessions.set(sessionId, { ...input, createdAt: new Date() });
    return {
      sessionId,
      provider: this.name,
      status: 'pending',
      amountCents: input.amountCents,
      currency: input.currency,
      message: 'Simulated checkout session created',
    };
  }

  async confirmPayment(
    input: PaymentConfirmInput,
  ): Promise<PaymentConfirmResult> {
    const session = this.sessions.get(input.sessionId);
    if (!session || session.userId !== input.userId) {
      return {
        sessionId: input.sessionId,
        provider: this.name,
        status: 'failed',
        providerReference: '',
        message: 'Invalid or expired checkout session',
      };
    }

    const outcome =
      input.simulate || session.simulate || 'success';

    if (outcome === 'failure') {
      return {
        sessionId: input.sessionId,
        provider: this.name,
        status: 'failed',
        providerReference: `mock_fail_${input.sessionId}`,
        message: 'Simulated payment failed',
      };
    }

    this.sessions.delete(input.sessionId);
    return {
      sessionId: input.sessionId,
      provider: this.name,
      status: 'succeeded',
      providerReference: `mock_pay_${input.sessionId}`,
      message: 'Simulated payment succeeded',
    };
  }
}
