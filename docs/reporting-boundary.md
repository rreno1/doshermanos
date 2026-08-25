# Reporting Boundary

The reporting workspace covers the current Chapter I and Chapter III reporting scope without inventing business rules that Dos Hermanos has not approved.

## Available reports

Authorized staff and administrators can view and export:

- reservation records;
- sales activity from confirmed or completed reservations;
- recorded payments;
- current inventory status;
- current equipment accountability status.

The selected report can be exported as UTF-8 CSV for spreadsheet applications such as Microsoft Excel and can also be printed from the browser.

## Sales amount limitation

The reservation currently stores the selected package's base-price snapshot. Package customization is still a request for review, and authoritative customized pricing has not yet been approved or implemented.

For that reason, the sales report must not present the stored package amount as final revenue. It labels the amount as the base package amount and limits sales activity rows to confirmed or completed reservations. Actual received money remains represented by the payment report.

When final package-calculation rules are approved, the sales report can be updated to use the authoritative reservation pricing snapshot instead of the current base-package value.

## Report bounds

Reservation and payment reports read up to the 250 most recent records. Inventory and equipment reports use the bounded current registries already used by the operational workspaces. These limits keep client-side reporting predictable and prevent unbounded Firestore reads.

A later historical-reporting phase can replace these bounded client queries with approved date-range queries or server-generated reports if Dos Hermanos requires longer reporting periods.

## Export safety

CSV values are quoted and spreadsheet-formula prefixes are neutralized before download so user-controlled text cannot be interpreted as a spreadsheet formula when the report is opened in Excel-compatible software.
