# Package Customization Boundary

Chapter I requires package customization to cover the selected menu, guest count, service requirements, food quantities, needed supplies, and an updated total package price.

The current implementation advances that requirement without inventing Dos Hermanos pricing or quantity formulas that management has not yet approved.

## Current supported behavior

Customers can submit optional customization requests together with a reservation request for:

- menu choices or requested substitutions;
- food quantity requirements;
- needed supplies;
- service requirements;
- guest count.

These values are stored as request details for staff review. They are not treated as approved package configuration.

The `package.priceInCentavos` value stored on the reservation remains the selected package's base-price snapshot. It is not an authoritative customized total and must not be presented as one.

Staff can review the submitted customization request while reviewing the pending reservation. Confirmation remains unavailable while the authoritative scheduling-capacity and package-calculation rules are unresolved.

## Security and integrity boundary

The client cannot submit an approved customized total. Firestore allows only the defined customization request fields and bounds each text field. Final pricing must eventually be reconstructed from approved package and pricing rules rather than trusting a client-supplied amount.

Existing reservations without the `customization` field remain readable and operable so this schema extension does not invalidate earlier records.

## Business data still required

The following values must come from Dos Hermanos management before automatic package calculation can be implemented:

- actual package inclusions and selectable menu options;
- minimum and maximum guest counts per package, if applicable;
- how price changes with guest count;
- menu substitution or additional-item pricing;
- food quantity formulas and standard units;
- supply requirement formulas and standard units;
- fixed or variable service fees;
- location or outdoor-event charges, if any;
- discount rules and approval authority, if discounts are supported.

Until those rules are approved, the application must not invent totals, ingredient quantities, supply quantities, discounts, or automatic inventory allocations.

## Next implementation step after business approval

Once approved business data is available, the system can replace free-text request details where appropriate with structured option IDs and quantities, calculate an authoritative package configuration, preserve the calculation snapshot used for the reservation, and use that approved snapshot as the input to inventory allocation and payment-balance logic.
