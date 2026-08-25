import { Injectable, Inject } from '@nestjs/common';
import {
  CheckoutSessionInput,
  CheckoutSessionResult,
  PaymentConfirmInput,
  PaymentConfirmResult,
  PaymentProvider,
} from './payment-provider.interface';
import { PAYMENT_PROVIDER } from './payments.constants';

@Injectable()
export class PaymentService {
  constructor(
    @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider,
  ) {}

  getProviderName(): string {
    return this.provider.name;
  }

  createCheckoutSession(
    input: CheckoutSessionInput,
  ): Promise<CheckoutSessionResult> {
    return this.provider.createCheckoutSession(input);
  }

  confirmPayment(input: PaymentConfirmInput): Promise<PaymentConfirmResult> {
    return this.provider.confirmPayment(input);
  }
}
