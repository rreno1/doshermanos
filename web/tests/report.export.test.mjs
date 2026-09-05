import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createCsv } from '../src/modules/reports/report.export.ts';

test('CSV export is UTF-8 Excel-compatible and escapes punctuation', () => {
  const csv = createCsv(
    ['Name', 'Note'],
    [['Package A', 'Includes trays, linens, and "setup"']],
  );

  assert.equal(csv.charCodeAt(0), 0xfeff);
  assert.match(csv, /"Includes trays, linens, and ""setup"""/);
  assert.match(csv, /\r\n/);
});

test('CSV export neutralizes spreadsheet formulas from user-controlled text', () => {
  const csv = createCsv(
    ['Location', 'Reference'],
    [['=HYPERLINK("bad")', '  @SUM(1,1)']],
  );

  assert.match(csv, /"'=HYPERLINK\(""bad""\)"/);
  assert.match(csv, /"'  @SUM\(1,1\)"/);
});

test('CSV export rejects malformed rows', () => {
  assert.throws(
    () => createCsv(['A', 'B'], [['only-one-cell']]),
    /must match the report headers/,
  );
});
