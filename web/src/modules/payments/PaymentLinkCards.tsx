export function StaffPaymentLinkCard() {
  return (
    <div className="management-info-note" role="status">
      Online payment is not enabled in this build. Staff can record verified cash payments only.
    </div>
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
