export function StaffPaymentLinkCard() {
  return (
    <article className="payment-link-ready" aria-labelledby="payment-link-ready-title">
      <div>
        <div className="payment-link-ready-labels">
          <span className="payment-link-badge">Ready, not connected</span>
          <span>Hosted payment page</span>
        </div>
        <h3 id="payment-link-ready-title">Payment link for card, QR, and e-wallet checkout</h3>
        <p>
          The interface is reserved for a hosted payment link later. No provider, URL, webhook,
          card form, or live payment processing is enabled in this build.
        </p>
      </div>
      <button type="button" className="payment-link-disabled" disabled>
        Payment link coming soon
      </button>
    </article>
  );
}

export function CustomerPaymentLinkCard() {
  return (
    <article className="customer-payment-link" aria-labelledby="customer-payment-link-title">
      <div>
        <span className="payment-link-badge">Coming soon</span>
        <h3 id="customer-payment-link-title">Pay through a hosted payment link</h3>
        <p>
          Card, QR, and e-wallet checkout is being prepared. This button is intentionally disabled,
          and Dos Hermanos does not collect card details inside this app.
        </p>
      </div>
      <button type="button" disabled>
        Online payment not enabled
      </button>
    </article>
  );
}
