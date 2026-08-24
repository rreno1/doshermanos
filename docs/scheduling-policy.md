# Scheduling Policy

## Confirmed business decision

Dos Hermanos may handle multiple events on the same date and at overlapping times.

This means the system must **not** use a global one-booking-per-date lock. The existence of one confirmed event does not automatically make that date unavailable for every other customer.

## Current reservation behavior

The current implementation may accept authenticated customer reservation requests for single-day or multi-day event dates. A submitted request is only a request and must use the `pending_review` status.

A reservation request must never be presented as confirmed merely because it was submitted successfully.

## Conflict-prevention boundary

The manuscript requires availability checking and prevention of conflicting confirmed bookings, but the business rule that determines the actual simultaneous-event capacity is not defined yet.

The remaining capacity rule may eventually depend on one or more operational constraints such as:

- available catering crew;
- available equipment;
- event time range;
- event location or venue;
- food-production capacity;
- another management-approved capacity measure.

These examples are not implemented business rules. They identify the type of information still required before final confirmation logic can be frozen.

Until that capacity rule is approved:

1. do not create a global date lock;
2. do not mark a date unavailable solely because another reservation exists on that date;
3. do not implement client-side logic that claims to guarantee final availability;
4. do not allow normal client operations to transition a request to `confirmed`;
5. keep confirmation as a later protected workflow once the actual capacity rule is defined and can be enforced atomically.

## Security and integrity reason

Allowing multiple simultaneous events removes the previously assumed one-event-per-date model. Guessing a replacement capacity limit would create a false business rule and could either block valid business or permit operational overbooking.

The system therefore records reservation requests now while deliberately deferring authoritative confirmation until the real capacity constraint is known.


## Current staff review workflow

Authorized staff and administrators can now view a bounded queue of `pending_review` reservation requests and reject an invalid or declined request. Every rejection is recorded atomically in the immutable `reservationDecisions` history with the authenticated actor and timestamp.

Confirmation remains unavailable. The review interface explicitly explains that overlapping events are permitted and that a date overlap alone is not a capacity failure. This preserves the approved scheduling boundary while allowing the review workflow to progress without inventing a capacity formula.
