import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  MANAGEMENT_PAGE_SIZE,
  ManagementSelect,
  ManagementTableFrame,
  ManagementTabs,
  ManagementToolbar,
} from '../src/app/ManagementControls.tsx';

const selectPath = new URL('../src/app/ManagementSelect.tsx', import.meta.url);
const interactionsCssPath = new URL('../src/app/management-interactions.css', import.meta.url);

test('management tables default to seven rows per page', () => {
  assert.equal(MANAGEMENT_PAGE_SIZE, 7);
});

test('management tabs render as shared line tab controls', () => {
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

test('management toolbar keeps summary search two-line filter control and primary action visible', () => {
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
  assert.match(markup, /management-filter-trigger/);
  assert.match(markup, /M4 7h12M4 13h12/);
  assert.equal(markup.includes('<details'), false);
  assert.match(markup, /Add record/);
});

test('management select is custom and does not render a native select control', () => {
  const markup = renderToStaticMarkup(createElement(ManagementSelect, {
    value: 'active',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
    ],
    onChange: () => undefined,
    ariaLabel: 'Status',
  }));

  assert.match(markup, /management-select-trigger/);
  assert.match(markup, /aria-haspopup="listbox"/);
  assert.equal(markup.includes('<select'), false);
});

test('management select menus use a body portal so table overflow cannot clip them', async () => {
  const [selectSource, interactionsCss] = await Promise.all([
    readFile(selectPath, 'utf8'),
    readFile(interactionsCssPath, 'utf8'),
  ]);

  assert.match(selectSource, /createPortal/);
  assert.match(selectSource, /document\.body/);
  assert.match(selectSource, /management-select-menu-portal/);
  assert.match(selectSource, /getBoundingClientRect/);
  assert.match(selectSource, /spaceBelow < minimumUsefulHeight/);
  assert.match(interactionsCss, /\.management-select-menu-portal[\s\S]*position:\s*fixed/);
  assert.match(interactionsCss, /z-index:\s*1000/);
});

test('management table frame owns pagination and dynamic loading state', () => {
  const loadedMarkup = renderToStaticMarkup(createElement(
    ManagementTableFrame,
    {
      pagination: { page: 1, totalItems: 12, onPageChange: () => undefined },
    },
    createElement('table', null, createElement('tbody')),
  ));

  assert.match(loadedMarkup, /management-table-frame/);
  assert.match(loadedMarkup, /management-pagination/);
  assert.match(loadedMarkup, /Showing 1–7 of 12/);

  const loadingMarkup = renderToStaticMarkup(createElement(ManagementTableFrame, {
    loadingMessage: 'Loading equipment registry…',
  }));

  assert.match(loadingMarkup, /management-spinner/);
  assert.match(loadingMarkup, /Loading equipment registry…/);
  assert.equal(loadingMarkup.includes('management-pagination'), false);
});
