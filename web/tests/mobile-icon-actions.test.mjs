import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ManagementPagination, ManagementToolbar } from '../src/app/ManagementControls.tsx';

const responsiveCss = await readFile(new URL('../src/app/responsive-actions.css', import.meta.url), 'utf8');
const authMenuSource = await readFile(new URL('../src/features/auth/AuthMenu.tsx', import.meta.url), 'utf8');
const packageCatalogSource = await readFile(new URL('../src/features/operations/PackageCatalog.tsx', import.meta.url), 'utf8');

test('mobile responsive actions hide text labels and show icons', () => {
  assert.match(responsiveCss, /@media \(max-width: 620px\)/);
  assert.match(responsiveCss, /\.responsive-button-icon[\s\S]*display:\s*inline-flex/);
  assert.match(responsiveCss, /\.responsive-button-label[\s\S]*display:\s*none/);
  assert.match(responsiveCss, /\.responsive-action-button[\s\S]*width:\s*var\(--management-control-height, 42px\)/);
});

test('management toolbar primary actions become responsive icon buttons', () => {
  const markup = renderToStaticMarkup(createElement(ManagementToolbar, {
    summary: [{ label: 'items', value: 3 }],
    searchValue: '',
    searchPlaceholder: 'Search items',
    onSearchChange: () => undefined,
    primaryAction: createElement('button', { type: 'button', className: 'management-primary-button' }, 'Add item'),
  }));

  assert.match(markup, /management-primary-button responsive-action-button/);
  assert.match(markup, /responsive-button-icon/);
  assert.match(markup, /responsive-button-label/);
  assert.match(markup, /aria-label="Add item"/);
});

test('pagination uses chevron icon actions on mobile', () => {
  const markup = renderToStaticMarkup(createElement(ManagementPagination, {
    page: 2,
    totalItems: 20,
    onPageChange: () => undefined,
  }));

  assert.match(markup, /aria-label="Previous page"/);
  assert.match(markup, /aria-label="Next page"/);
  assert.match(markup, /responsive-button-icon/);
});

test('public account and package request actions use the shared responsive icon pattern', () => {
  assert.match(authMenuSource, /ResponsiveButtonContent/);
  assert.match(authMenuSource, /responsive-action-button/);
  assert.match(packageCatalogSource, /ResponsiveButtonContent/);
  assert.match(packageCatalogSource, /primary-button responsive-action-button/);
});

test('Google authentication keeps an accessible name while becoming icon-only on mobile', () => {
  assert.match(responsiveCss, /\.auth-google-button span,[\s\S]*\.auth-google-button::after[\s\S]*display:\s*none/);
});
