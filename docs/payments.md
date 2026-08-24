# Payments

## Current implemented scope

The current payment module supports manual cash-payment recording by active staff and administrators. Every recorded payment creates two immutable documents in one atomic Firestore write:

1. a private `payments/{paymentId}` record containing staff-only audit context;
2. a customer-safe `paymentReceipts/{paymentId}` record containing only information the customer may view.

Customers can view only receipts owned by their Firebase UID. They cannot create, edit, delete, or mark payments as paid.

## Hosted payment-link direction

The previous PayMongo direction is removed from the approved implementation baseline.

The customer interfaces now contain a deliberately disabled **hosted payment-link card**. The intended future experience is a simple hosted payment page that can accept normal card or other supported checkout methods without Dos Hermanos collecting card details inside its own web or mobile application.

The current card is readiness UI only. It must remain non-functional until a provider and secure integration design are explicitly approved.

Current code must not contain:

- a live payment URL;
- a provider SDK;
- card-number, CVC, or expiry inputs;
- provider API keys or secrets;
- webhook handlers;
- fake payment-success behavior;
- client-written provider payment status.

## Manual cash workflow

```text
Staff opens Payments
  -> chooses an eligible reservation
  -> enters amount received
  -> optionally enters a receipt/reference
  -> optionally enters an internal note
  -> Firestore atomically writes private payment + customer receipt
  -> customer can view the safe receipt
```

A payment can currently be recorded against reservations in `pending_review`, `confirmed`, or `completed` state. Rejected and cancelled reservations are blocked. Recording a payment does not itself confirm a reservation.

## Deliberately unresolved business rules

The following remain unresolved and are not silently implemented:

- required deposit amount or percentage;
- whether partial payments are allowed as a customer policy;
- payment deadlines;
- whether confirmation requires a deposit;
- final authoritative reservation price after customization;
- overpayment handling;
- cash-payment correction or reversal workflow;
- refunds;
- cancellation fees.

Because these rules are unresolved, the system currently shows recorded receipts but does not claim a final remaining balance, deposit status, or paid-in-full state.

## Future hosted-payment security gate

Before enabling a hosted payment link, define and test:

- provider selection and merchant ownership;
- trusted creation of transaction-specific payment requests if required;
- authoritative payment-success verification;
- webhook or callback authentication if required;
- idempotency and duplicate-event handling;
- mapping between provider transaction IDs and reservation/payment records;
- cancellation and timeout behavior;
- safe return/deep-link handling on web and mobile;
- secrets management;
- reconciliation with manual payment records;
- rules for partial, duplicate, failed, and overpaid transactions.

A customer return page or client-side callback must never be treated as proof that money was received.
