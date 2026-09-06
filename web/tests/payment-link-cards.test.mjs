import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  CustomerPaymentLinkCard,
  StaffPaymentLinkCard,
} from '../src/modules/payments/PaymentLinkCards.tsx';

function assertNoLiveCheckout(markup) {
  assert.equal(markup.includes('href='), false);
  assert.equal(markup.includes('<form'), false);
  assert.equal(markup.includes('<input'), false);
}

test('staff payment boundary stays informational and has no live checkout control', () => {
  const markup = renderToStaticMarkup(createElement(StaffPaymentLinkCard));

  assertNoLiveCheckout(markup);
  assert.equal(markup.includes('<button'), false);
  assert.match(markup, /Online payment is not enabled/);
  assert.match(markup, /verified cash payments only/);
});

test('customer hosted payment readiness stays disabled and avoids card collection', () => {
  const markup = renderToStaticMarkup(createElement(CustomerPaymentLinkCard));

  assertNoLiveCheckout(markup);
  assert.match(markup, /Online payment not enabled/);
  assert.match(markup, /<button[^>]*disabled/);
  assert.match(markup, /Coming soon/);
  assert.match(markup, /does not collect card details inside this app/);
});
