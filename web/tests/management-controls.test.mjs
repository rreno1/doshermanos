import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  MANAGEMENT_PAGE_SIZE,
  ManagementTabs,
  ManagementToolbar,
} from '../src/app/ManagementControls.tsx';

test('management tables default to seven rows per page', () => {
  assert.equal(MANAGEMENT_PAGE_SIZE, 7);
});

test('management tabs render as shared tab controls', () => {
  const markup = renderToStaticMarkup(createElement(ManagementTabs, {
    value: 'registry',
    options: [
      { value: 'registry', label: 'Registry' },
      { value: 'activity', label: 'Activity' },
    ],
    onChange: () => undefined,
    label: 'Views',
  }));

  assert.match(markup, /management-tabs/);
  assert.match(markup, /role="tablist"/);
  assert.match(markup, /management-tab-active/);
});

test('management toolbar keeps search and burger controls visible with summary', () => {
  const markup = renderToStaticMarkup(createElement(ManagementToolbar, {
    summary: [{ label: 'records', value: 12 }],
    searchValue: '',
    searchPlaceholder: 'Search records',
    onSearchChange: () => undefined,
    filterContent: createElement('span', null, 'Sort controls'),
    primaryAction: createElement('button', { type: 'button' }, 'Add record'),
  }));

  assert.match(markup, /management-summary/);
  assert.match(markup, /type="search"/);
  assert.match(markup, /management-filter-menu/);
  assert.match(markup, /<details/);
  assert.match(markup, /Add record/);
});
