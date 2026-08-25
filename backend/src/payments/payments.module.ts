import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { MockPaymentProvider } from './mock-payment.provider';
import { PAYMENT_PROVIDER } from './payments.constants';

@Module({
  providers: [
    MockPaymentProvider,
    {
      provide: PAYMENT_PROVIDER,
      useExisting: MockPaymentProvider,
    },
    PaymentService,
  ],
  exports: [PaymentService],
})
export class PaymentsModule {}
