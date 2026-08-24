import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { CustomerPaymentLinkCard } from './PaymentLinkCards';
import { subscribeToOwnPaymentReceipts } from './payment.service';
import type { PaymentReceipt } from './payment.types';
import './payments.css';

export function MyPayments() {
  const { authState } = useAuth();
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const customerId =
    authState.status === 'active' && authState.profile?.role === 'customer'
      ? authState.profile.id
      : null;

  useEffect(() => {
    if (!customerId) {
      setReceipts([]);
      setIsLoading(false);
      setHasError(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    return subscribeToOwnPaymentReceipts(
      customerId,
      (nextReceipts) => {
        setReceipts(nextReceipts);
        setIsLoading(false);
      },
      () => {
        setReceipts([]);
        setHasError(true);
        setIsLoading(false);
      },
    );
  }, [customerId]);

  if (!customerId) {
    return null;
  }

  return (
    <section className="customer-payments-section" id="my-payments" aria-labelledby="my-payments-title">
      <div className="customer-payments-heading">
        <div>
          <p className="payment-kicker">Your payments</p>
          <h2 id="my-payments-title">Payment history</h2>
          <p>
            Confirmed cash receipts appear here. A remaining balance is not shown yet because final
            reservation pricing and deposit rules have not been locked.
          </p>
        </div>
      </div>

      <CustomerPaymentLinkCard />
      {renderReceipts()}
    </section>
  );

  function renderReceipts() {
    if (isLoading) {
      return <CustomerPaymentStatus message="Loading your payment receipts…" />;
    }

    if (hasError) {
      return <CustomerPaymentStatus message="We could not load your payment receipts right now." error />;
    }

    if (receipts.length === 0) {
      return <CustomerPaymentStatus message="No payments have been recorded for your reservations yet." />;
    }

    return (
      <div className="customer-payment-list">
        {receipts.map((receipt) => (
          <article key={receipt.id} className="customer-payment-receipt">
            <div>
              <span className="customer-payment-method">Cash payment</span>
              <strong>{formatMoney(receipt.amountInCentavos)}</strong>
            </div>
            <dl>
              <div>
                <dt>Package</dt>
                <dd>{receipt.packageName}</dd>
              </div>
              <div>
                <dt>Event date</dt>
                <dd>{formatEventDate(receipt.eventStartDate)}</dd>
              </div>
              <div>
                <dt>Recorded</dt>
                <dd>{formatReceiptDate(receipt.createdAt)}</dd>
              </div>
              {receipt.reference ? (
                <div>
                  <dt>Reference</dt>
                  <dd>{receipt.reference}</dd>
                </div>
              ) : null}
            </dl>
          </article>
        ))}
      </div>
    );
  }
}

function CustomerPaymentStatus({ message, error = false }: { message: string; error?: boolean }) {
  return (
    <div className={error ? 'customer-payment-status customer-payment-status-error' : 'customer-payment-status'} role={error ? 'alert' : 'status'}>
      {message}
    </div>
  );
}

function formatMoney(amountInCentavos: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amountInCentavos / 100);
}

function formatEventDate(date: Date): string {
  return new Intl.DateTimeFormat('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function formatReceiptDate(date: Date): string {
  return new Intl.DateTimeFormat('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}
