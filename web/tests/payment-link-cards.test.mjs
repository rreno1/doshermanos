import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  CustomerPaymentLinkCard,
  StaffPaymentLinkCard,
} from '../src/features/payments/PaymentLinkCards.tsx';

function assertDisabledReadinessCard(markup, buttonText) {
  assert.match(markup, new RegExp(buttonText));
  assert.match(markup, /<button[^>]*disabled/);
  assert.equal(markup.includes('href='), false);
  assert.equal(markup.includes('<form'), false);
  assert.equal(markup.includes('<input'), false);
}

test('staff hosted payment readiness has no live checkout control', () => {
  const markup = renderToStaticMarkup(createElement(StaffPaymentLinkCard));

  assertDisabledReadinessCard(markup, 'Payment link coming soon');
  assert.match(markup, /Ready, not connected/);
  assert.match(markup, /No provider, URL, webhook/);
});

test('customer hosted payment readiness stays disabled and avoids card collection', () => {
  const markup = renderToStaticMarkup(createElement(CustomerPaymentLinkCard));

  assertDisabledReadinessCard(markup, 'Online payment not enabled');
  assert.match(markup, /Coming soon/);
  assert.match(markup, /does not collect card details inside this app/);
});
