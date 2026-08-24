from pathlib import Path
import json


def write(path: str, content: str) -> None:
    Path(path).write_text(content, encoding='utf-8')


def replace_once(path: str, old: str, new: str) -> None:
    file_path = Path(path)
    content = file_path.read_text(encoding='utf-8')
    if old not in content:
        raise SystemExit(f'Expected text not found in {path}')
    file_path.write_text(content.replace(old, new, 1), encoding='utf-8')


write(
    'web/src/features/reservations/reservation.types.ts',
    """export type ReservationStatus =
  | 'pending_review'
  | 'confirmed'
  | 'rejected'
  | 'cancelled'
  | 'completed';

export type ReservationRequestInput = {
  startDate: string;
  endDate: string;
  location: string;
  guestCount: number;
  serviceRequirements: string;
};

export type ReservationEvent = {
  startDate: Date;
  endDate: Date;
  location: string;
  guestCount: number;
  serviceRequirements: string;
};

export type ReservationPackageSnapshot = {
  packageId: string;
  packageName: string;
  priceInCentavos: number;
};

export type ReservationRecord = {
  id: string;
  customerId: string;
  status: ReservationStatus;
  event: ReservationEvent;
  package: ReservationPackageSnapshot;
  createdAt: Date;
  updatedAt: Date;
};

export type ReservationDecision = {
  id: string;
  reservationId: string;
  customerId: string;
  previousStatus: 'pending_review';
  newStatus: 'rejected';
  decidedBy: string;
  decidedByName: string;
  createdAt: Date;
};
""",
)

write(
    'web/src/features/reservations/reservation.service.ts',
    """import {
  Timestamp,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { firestore } from '../../firebase/firebase';
import type { CateringPackage } from '../packages/package.types';
import type {
  ReservationDecision,
  ReservationRecord,
  ReservationRequestInput,
  ReservationStatus,
} from './reservation.types';

const CUSTOMER_RESERVATION_LIMIT = 20;
const STAFF_REVIEW_LIMIT = 50;
const RESERVATION_DECISION_LIMIT = 40;
const reservationStatuses: ReservationStatus[] = [
  'pending_review',
  'confirmed',
  'rejected',
  'cancelled',
  'completed',
];

function dateOnlyToTimestamp(value: string): Timestamp {
  const [yearText, monthText, dayText] = value.split('-');
  const date = new Date(
    Date.UTC(Number(yearText), Number(monthText) - 1, Number(dayText)),
  );

  return Timestamp.fromDate(date);
}

function parseReservationDocument(
  document: QueryDocumentSnapshot<DocumentData>,
): ReservationRecord {
  const value = document.data({ serverTimestamps: 'estimate' });
  const event = value.event;
  const packageSnapshot = value.package;

  if (
    typeof value.customerId !== 'string' ||
    !event ||
    typeof event !== 'object' ||
    !packageSnapshot ||
    typeof packageSnapshot !== 'object' ||
    !reservationStatuses.includes(value.status as ReservationStatus) ||
    !(event.startDate instanceof Timestamp) ||
    !(event.endDate instanceof Timestamp) ||
    typeof event.location !== 'string' ||
    !Number.isInteger(event.guestCount) ||
    typeof event.serviceRequirements !== 'string' ||
    typeof packageSnapshot.packageId !== 'string' ||
    typeof packageSnapshot.packageName !== 'string' ||
    !Number.isInteger(packageSnapshot.priceInCentavos) ||
    !(value.createdAt instanceof Timestamp) ||
    !(value.updatedAt instanceof Timestamp)
  ) {
    throw new Error('Reservation data is invalid.');
  }

  return {
    id: document.id,
    customerId: value.customerId,
    status: value.status as ReservationStatus,
    event: {
      startDate: event.startDate.toDate(),
      endDate: event.endDate.toDate(),
      location: event.location,
      guestCount: event.guestCount,
      serviceRequirements: event.serviceRequirements,
    },
    package: {
      packageId: packageSnapshot.packageId,
      packageName: packageSnapshot.packageName,
      priceInCentavos: packageSnapshot.priceInCentavos,
    },
    createdAt: value.createdAt.toDate(),
    updatedAt: value.updatedAt.toDate(),
  };
}

function parseReservationDecisionDocument(
  document: QueryDocumentSnapshot<DocumentData>,
): ReservationDecision {
  const value = document.data({ serverTimestamps: 'estimate' });

  if (
    typeof value.reservationId !== 'string' ||
    typeof value.customerId !== 'string' ||
    value.previousStatus !== 'pending_review' ||
    value.newStatus !== 'rejected' ||
    typeof value.decidedBy !== 'string' ||
    typeof value.decidedByName !== 'string' ||
    !(value.createdAt instanceof Timestamp)
  ) {
    throw new Error('Reservation decision data is invalid.');
  }

  return {
    id: document.id,
    reservationId: value.reservationId,
    customerId: value.customerId,
    previousStatus: 'pending_review',
    newStatus: 'rejected',
    decidedBy: value.decidedBy,
    decidedByName: value.decidedByName,
    createdAt: value.createdAt.toDate(),
  };
}

export async function createReservationRequest(
  customerId: string,
  cateringPackage: CateringPackage,
  input: ReservationRequestInput,
): Promise<string> {
  const reservationRef = doc(collection(firestore, 'reservations'));

  await setDoc(reservationRef, {
    customerId,
    status: 'pending_review',
    event: {
      startDate: dateOnlyToTimestamp(input.startDate),
      endDate: dateOnlyToTimestamp(input.endDate),
      location: input.location,
      guestCount: input.guestCount,
      serviceRequirements: input.serviceRequirements,
    },
    package: {
      packageId: cateringPackage.id,
      packageName: cateringPackage.name,
      priceInCentavos: cateringPackage.priceInCentavos,
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return reservationRef.id;
}

export function subscribeToOwnReservations(
  customerId: string,
  onReservations: (reservations: ReservationRecord[]) => void,
  onError: () => void,
): Unsubscribe {
  const reservationsQuery = query(
    collection(firestore, 'reservations'),
    where('customerId', '==', customerId),
    orderBy('createdAt', 'desc'),
    limit(CUSTOMER_RESERVATION_LIMIT),
  );

  return onSnapshot(
    reservationsQuery,
    (snapshot) => {
      try {
        onReservations(snapshot.docs.map(parseReservationDocument));
      } catch {
        onError();
      }
    },
    onError,
  );
}

export function subscribeToPendingReservations(
  onReservations: (reservations: ReservationRecord[]) => void,
  onError: () => void,
): Unsubscribe {
  const reservationsQuery = query(
    collection(firestore, 'reservations'),
    where('status', '==', 'pending_review'),
    orderBy('createdAt', 'desc'),
    limit(STAFF_REVIEW_LIMIT),
  );

  return onSnapshot(
    reservationsQuery,
    (snapshot) => {
      try {
        onReservations(snapshot.docs.map(parseReservationDocument));
      } catch {
        onError();
      }
    },
    onError,
  );
}

export async function rejectReservation(
  reservationId: string,
  decidedBy: string,
  decidedByName: string,
): Promise<void> {
  const reservationRef = doc(firestore, 'reservations', reservationId);
  const decisionRef = doc(firestore, 'reservationDecisions', `${reservationId}-rejected`);

  await runTransaction(firestore, async (transaction) => {
    const reservationSnapshot = await transaction.get(reservationRef);
    const decisionSnapshot = await transaction.get(decisionRef);

    if (!reservationSnapshot.exists()) {
      throw new Error('The reservation request no longer exists.');
    }

    const reservation = reservationSnapshot.data();

    if (reservation.status === 'rejected' && decisionSnapshot.exists()) {
      return;
    }

    if (reservation.status !== 'pending_review') {
      throw new Error('Only pending reservation requests can be rejected.');
    }

    if (decisionSnapshot.exists()) {
      throw new Error('This reservation already has a rejection decision record.');
    }

    if (typeof reservation.customerId !== 'string' || reservation.customerId.length === 0) {
      throw new Error('The reservation customer record is invalid.');
    }

    transaction.update(reservationRef, {
      status: 'rejected',
      updatedAt: serverTimestamp(),
    });
    transaction.set(decisionRef, {
      reservationId,
      customerId: reservation.customerId,
      previousStatus: 'pending_review',
      newStatus: 'rejected',
      decidedBy,
      decidedByName,
      createdAt: serverTimestamp(),
    });
  });
}

export function subscribeToReservationDecisions(
  onDecisions: (decisions: ReservationDecision[]) => void,
  onError: () => void,
): Unsubscribe {
  const decisionsQuery = query(
    collection(firestore, 'reservationDecisions'),
    orderBy('createdAt', 'desc'),
    limit(RESERVATION_DECISION_LIMIT),
  );

  return onSnapshot(
    decisionsQuery,
    (snapshot) => {
      try {
        onDecisions(snapshot.docs.map(parseReservationDecisionDocument));
      } catch {
        onError();
      }
    },
    onError,
  );
}
""",
)

write(
    'web/src/features/reservations/ReservationReviewPanel.tsx',
    """import { useEffect, useState } from 'react';
import {
  rejectReservation,
  subscribeToPendingReservations,
} from './reservation.service';
import type { ReservationRecord } from './reservation.types';
import './reservations.css';

type ReservationReviewPanelProps = {
  staffId: string;
  staffName: string;
};

export function ReservationReviewPanel({ staffId, staffName }: ReservationReviewPanelProps) {
  const [reservations, setReservations] = useState<ReservationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [busyReservationId, setBusyReservationId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);

    return subscribeToPendingReservations(
      (nextReservations) => {
        setReservations(nextReservations);
        setIsLoading(false);
      },
      () => {
        setReservations([]);
        setHasError(true);
        setIsLoading(false);
      },
    );
  }, []);

  return (
    <section className="reservation-review-section" id="reservation-review" aria-labelledby="reservation-review-title">
      <div className="reservation-review-heading">
        <div>
          <p className="reservation-review-kicker">Reservation review</p>
          <h2 id="reservation-review-title">Pending requests</h2>
          <p>
            Review submitted event details before taking an operational decision. Rejection is
            available now; confirmation remains intentionally gated until the simultaneous-event
            capacity rule is approved.
          </p>
        </div>
        <span className="reservation-review-count">{reservations.length} pending</span>
      </div>

      <div className="reservation-capacity-note" role="status">
        Dos Hermanos may handle overlapping events, so another booking on the same date does not by
        itself make a request unavailable. Confirmation will be enabled only when the actual
        operational capacity rule can be enforced consistently.
      </div>

      {actionError ? <div className="reservation-review-error" role="alert">{actionError}</div> : null}
      {renderContent()}
    </section>
  );

  function renderContent() {
    if (isLoading) {
      return <ReservationReviewStatus message="Loading pending reservation requests…" />;
    }

    if (hasError) {
      return <ReservationReviewStatus message="Pending reservation requests could not be loaded." error />;
    }

    if (reservations.length === 0) {
      return <ReservationReviewStatus message="There are no pending reservation requests." />;
    }

    return (
      <div className="reservation-review-list">
        {reservations.map((reservation) => {
          const isBusy = busyReservationId === reservation.id;

          return (
            <article key={reservation.id} className="reservation-review-row">
              <div className="reservation-review-main">
                <div className="reservation-review-row-heading">
                  <strong>{reservation.package.packageName}</strong>
                  <span>Pending review</span>
                </div>
                <p>{formatEventRange(reservation.event.startDate, reservation.event.endDate)}</p>
                <dl className="reservation-review-details">
                  <div>
                    <dt>Location</dt>
                    <dd>{reservation.event.location}</dd>
                  </div>
                  <div>
                    <dt>Guests</dt>
                    <dd>{reservation.event.guestCount.toLocaleString('en-PH')}</dd>
                  </div>
                  <div>
                    <dt>Package base</dt>
                    <dd>{formatMoney(reservation.package.priceInCentavos)}</dd>
                  </div>
                  <div>
                    <dt>Submitted</dt>
                    <dd>{formatSubmittedTime(reservation.createdAt)}</dd>
                  </div>
                </dl>
                {reservation.event.serviceRequirements ? (
                  <p className="reservation-review-requirements">
                    <strong>Service requirements:</strong> {reservation.event.serviceRequirements}
                  </p>
                ) : null}
              </div>

              <div className="reservation-review-actions">
                <button type="button" disabled title="Confirmation requires an approved capacity rule">
                  Confirm unavailable
                </button>
                <button
                  type="button"
                  className="reservation-reject-button"
                  disabled={isBusy}
                  onClick={() => handleReject(reservation)}
                >
                  {isBusy ? 'Rejecting…' : 'Reject request'}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    );
  }

  async function handleReject(reservation: ReservationRecord) {
    const shouldReject = window.confirm(
      `Reject the ${reservation.package.packageName} request for ${formatEventRange(reservation.event.startDate, reservation.event.endDate)}?`,
    );

    if (!shouldReject) {
      return;
    }

    setBusyReservationId(reservation.id);
    setActionError(null);

    try {
      await rejectReservation(reservation.id, staffId, staffName);
    } catch {
      setActionError('The reservation could not be rejected. Refresh the request list and try again.');
    } finally {
      setBusyReservationId(null);
    }
  }
}

function ReservationReviewStatus({ message, error = false }: { message: string; error?: boolean }) {
  return (
    <div className={error ? 'reservation-review-status reservation-review-status-error' : 'reservation-review-status'} role={error ? 'alert' : 'status'}>
      {message}
    </div>
  );
}

function formatEventRange(startDate: Date, endDate: Date): string {
  const formatter = new Intl.DateTimeFormat('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
  const start = formatter.format(startDate);
  const end = formatter.format(endDate);

  return start === end ? start : `${start} – ${end}`;
}

function formatMoney(amountInCentavos: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amountInCentavos / 100);
}

function formatSubmittedTime(date: Date): string {
  return new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}
""",
)

css_path = Path('web/src/features/reservations/reservations.css')
css = css_path.read_text(encoding='utf-8')
if '.reservation-review-section {' not in css:
    css += """

.reservation-review-section {
  width: min(calc(100% - 40px), var(--page-width));
  margin-inline: auto;
  padding: 72px 0 24px;
  scroll-margin-top: 24px;
}

.reservation-review-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 28px;
  margin-bottom: 22px;
}

.reservation-review-heading h2 {
  margin: 0;
  font-size: clamp(2rem, 5vw, 3.2rem);
  line-height: 1.05;
  letter-spacing: -0.045em;
}

.reservation-review-heading p:not(.reservation-review-kicker) {
  max-width: 700px;
  margin: 12px 0 0;
  color: var(--text-muted);
  line-height: 1.65;
}

.reservation-review-kicker {
  margin: 0 0 8px;
  color: var(--accent);
  font-size: 0.78rem;
  font-weight: 760;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.reservation-review-count {
  flex: 0 0 auto;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 999px;
  color: var(--text-muted);
  background: var(--surface);
  font-size: 0.82rem;
  font-weight: 700;
}

.reservation-capacity-note,
.reservation-review-status,
.reservation-review-error {
  padding: 18px 20px;
  border: 1px solid var(--border);
  border-radius: 18px;
  background: var(--surface);
  color: var(--text-muted);
  line-height: 1.6;
}

.reservation-capacity-note {
  margin-bottom: 18px;
  background: var(--accent-soft);
  color: var(--accent-dark);
}

.reservation-review-error,
.reservation-review-status-error {
  color: #7a2b2b;
  border-color: rgba(122, 43, 43, 0.18);
  background: #fff7f7;
}

.reservation-review-error {
  margin-bottom: 14px;
}

.reservation-review-list {
  display: grid;
  gap: 12px;
}

.reservation-review-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 28px;
  padding: 22px 24px;
  border: 1px solid var(--border);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.86);
}

.reservation-review-row-heading {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.reservation-review-row-heading span {
  padding: 5px 8px;
  border-radius: 999px;
  background: #eef2f0;
  color: #40514c;
  font-size: 0.75rem;
  font-weight: 720;
}

.reservation-review-main > p {
  margin: 8px 0 0;
  color: var(--text-muted);
}

.reservation-review-details {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 18px;
  margin: 18px 0 0;
}

.reservation-review-details div {
  display: grid;
  gap: 3px;
}

.reservation-review-details dt {
  color: var(--text-muted);
  font-size: 0.78rem;
  font-weight: 680;
}

.reservation-review-details dd {
  margin: 0;
  color: #24332f;
}

.reservation-review-requirements {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.reservation-review-actions {
  display: grid;
  align-content: start;
  gap: 10px;
  min-width: 170px;
}

.reservation-review-actions button {
  border: 0;
  border-radius: 999px;
  padding: 10px 14px;
  font: inherit;
  font-weight: 700;
}

.reservation-review-actions button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.reservation-reject-button {
  cursor: pointer;
  background: #f8eaea;
  color: #843838;
}

.reservation-reject-button:focus-visible,
.reservation-review-actions button:focus-visible {
  outline: 3px solid rgba(23, 107, 91, 0.26);
  outline-offset: 3px;
}

@media (max-width: 760px) {
  .reservation-review-section {
    width: min(calc(100% - 28px), var(--page-width));
    padding-top: 56px;
  }

  .reservation-review-heading,
  .reservation-review-row {
    display: grid;
    grid-template-columns: 1fr;
    align-items: start;
  }

  .reservation-review-count {
    justify-self: start;
  }

  .reservation-review-details {
    grid-template-columns: 1fr;
  }

  .reservation-review-actions {
    min-width: 0;
  }
}
"""
    css_path.write_text(css, encoding='utf-8')

replace_once(
    'web/src/app/App.tsx',
    "import { MyReservations } from '../features/reservations/MyReservations';\n",
    "import { MyReservations } from '../features/reservations/MyReservations';\nimport { ReservationReviewPanel } from '../features/reservations/ReservationReviewPanel';\n",
)
replace_once(
    'web/src/app/App.tsx',
    "              <a className=\"primary-link\" href=\"#inventory\">\n                Review operations\n              </a>\n            </section>\n            <InventoryPanel\n",
    "              <a className=\"primary-link\" href=\"#reservation-review\">\n                Review operations\n              </a>\n            </section>\n            <ReservationReviewPanel\n              staffId={authState.profile.id}\n              staffName={authState.profile.displayName}\n            />\n            <InventoryPanel\n",
)
replace_once(
    'web/src/app/App.tsx',
    '                Review inventory, record payments, and keep event equipment accountable from assignment through return.\n',
    '                Review reservation requests, inventory, payments, and event equipment from one operational workspace.\n',
)

rules_path = Path('firebase/firestore.rules')
rules = rules_path.read_text(encoding='utf-8')
helper_marker = '    function validInventoryDocument() {'
if 'function validReservationDecisionDocument()' not in rules:
    helper_block = """    function validReservationDecisionDocument() {
      return request.resource.data.keys().hasOnly([
          'reservationId', 'customerId', 'previousStatus', 'newStatus',
          'decidedBy', 'decidedByName', 'createdAt'
        ])
        && request.resource.data.keys().hasAll([
          'reservationId', 'customerId', 'previousStatus', 'newStatus',
          'decidedBy', 'decidedByName', 'createdAt'
        ])
        && request.resource.data.reservationId is string
        && request.resource.data.reservationId.size() > 0
        && request.resource.data.customerId is string
        && request.resource.data.customerId.size() > 0
        && request.resource.data.previousStatus == 'pending_review'
        && request.resource.data.newStatus == 'rejected'
        && request.resource.data.decidedBy is string
        && request.resource.data.decidedBy.size() > 0
        && request.resource.data.decidedByName is string
        && request.resource.data.decidedByName.size() > 0
        && request.resource.data.decidedByName.size() <= 100
        && request.resource.data.createdAt is timestamp;
    }

    function reservationRejectionHasMatchingDecision(reservationId) {
      let decisionId = reservationId + '-rejected';
      let decisionPath = /databases/$(database)/documents/reservationDecisions/$(decisionId);
      return existsAfter(decisionPath)
        && getAfter(decisionPath).data.reservationId == reservationId
        && getAfter(decisionPath).data.customerId == resource.data.customerId
        && getAfter(decisionPath).data.previousStatus == 'pending_review'
        && getAfter(decisionPath).data.newStatus == 'rejected'
        && getAfter(decisionPath).data.decidedBy == request.auth.uid
        && getAfter(decisionPath).data.decidedByName == currentUserProfile().data.displayName
        && getAfter(decisionPath).data.createdAt == request.time;
    }

    function reservationDecisionMatchesRejection(decisionId) {
      let reservationPath = /databases/$(database)/documents/reservations/$(request.resource.data.reservationId);
      return decisionId == request.resource.data.reservationId + '-rejected'
        && exists(reservationPath)
        && get(reservationPath).data.status == 'pending_review'
        && get(reservationPath).data.customerId == request.resource.data.customerId
        && getAfter(reservationPath).data.status == 'rejected'
        && getAfter(reservationPath).data.customerId == request.resource.data.customerId
        && getAfter(reservationPath).data.event == get(reservationPath).data.event
        && getAfter(reservationPath).data.package == get(reservationPath).data.package
        && getAfter(reservationPath).data.createdAt == get(reservationPath).data.createdAt
        && getAfter(reservationPath).data.updatedAt == request.time;
    }

"""
    if helper_marker not in rules:
        raise SystemExit('Rules helper insertion marker not found')
    rules = rules.replace(helper_marker, helper_block + helper_marker, 1)

old_rejection_rule = """      allow update: if isStaffOrAdmin()
        && validReservationDocument()
        && resource.data.status == 'pending_review'
        && request.resource.data.status == 'rejected'
        && request.resource.data.customerId == resource.data.customerId
        && request.resource.data.event == resource.data.event
        && request.resource.data.package == resource.data.package
        && request.resource.data.createdAt == resource.data.createdAt
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly([
          'status', 'updatedAt'
        ])
        && request.resource.data.updatedAt == request.time;

      allow delete: if false;
    }

    match /inventory/{inventoryItemId} {
"""
new_rejection_rule = """      allow update: if isStaffOrAdmin()
        && validReservationDocument()
        && resource.data.status == 'pending_review'
        && request.resource.data.status == 'rejected'
        && request.resource.data.customerId == resource.data.customerId
        && request.resource.data.event == resource.data.event
        && request.resource.data.package == resource.data.package
        && request.resource.data.createdAt == resource.data.createdAt
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly([
          'status', 'updatedAt'
        ])
        && request.resource.data.updatedAt == request.time
        && reservationRejectionHasMatchingDecision(reservationId);

      allow delete: if false;
    }

    match /reservationDecisions/{decisionId} {
      allow get, list: if isStaffOrAdmin();

      allow create: if isStaffOrAdmin()
        && validReservationDecisionDocument()
        && request.resource.data.decidedBy == request.auth.uid
        && request.resource.data.decidedByName == currentUserProfile().data.displayName
        && request.resource.data.createdAt == request.time
        && reservationDecisionMatchesRejection(decisionId);

      allow update, delete: if false;
    }

    match /inventory/{inventoryItemId} {
"""
if old_rejection_rule not in rules:
    raise SystemExit('Reservation rejection rule block not found')
rules = rules.replace(old_rejection_rule, new_rejection_rule, 1)
rules_path.write_text(rules, encoding='utf-8')

# Reservation rule tests: add atomic decision coverage.
replace_once(
    'firebase/tests/reservations.rules.test.mjs',
    "  updateDoc,\n  where,\n",
    "  updateDoc,\n  where,\n  writeBatch,\n",
)

helper_insertion = """
function rejectionDecision(reservationId, customerId, options = {}) {
  return {
    reservationId,
    customerId,
    previousStatus: 'pending_review',
    newStatus: 'rejected',
    decidedBy: options.decidedBy ?? 'staff-a',
    decidedByName: options.decidedByName ?? 'Staff A',
    createdAt: serverTimestamp(),
  };
}
"""
test_path = Path('firebase/tests/reservations.rules.test.mjs')
tests = test_path.read_text(encoding='utf-8')
if 'function rejectionDecision(' not in tests:
    marker = '\nasync function seedBaseRecords() {'
    if marker not in tests:
        raise SystemExit('Reservation test helper marker not found')
    tests = tests.replace(marker, helper_insertion + marker, 1)

old_test = """test('staff can reject a pending request but cannot confirm it yet', async () => {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const database = context.firestore();
    const timestamp = Timestamp.fromMillis(1_700_000_000_000);
    await setDoc(doc(database, 'reservations', 'pending-request'), {
      ...reservationRequest('customer-a'),
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  });

  const database = testEnvironment.authenticatedContext('staff-a').firestore();
  const reservationRef = doc(database, 'reservations', 'pending-request');

  await assertFails(
    updateDoc(reservationRef, {
      status: 'confirmed',
      updatedAt: serverTimestamp(),
    }),
  );
  await assertSucceeds(
    updateDoc(reservationRef, {
      status: 'rejected',
      updatedAt: serverTimestamp(),
    }),
  );
});
"""
new_test = """test('staff cannot confirm or directly reject a pending request without a decision record', async () => {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const database = context.firestore();
    const timestamp = Timestamp.fromMillis(1_700_000_000_000);
    await setDoc(doc(database, 'reservations', 'pending-request'), {
      ...reservationRequest('customer-a'),
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  });

  const database = testEnvironment.authenticatedContext('staff-a').firestore();
  const reservationRef = doc(database, 'reservations', 'pending-request');

  await assertFails(
    updateDoc(reservationRef, {
      status: 'confirmed',
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(
    updateDoc(reservationRef, {
      status: 'rejected',
      updatedAt: serverTimestamp(),
    }),
  );
});

test('staff can atomically reject a pending request with an immutable decision record', async () => {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const database = context.firestore();
    const timestamp = Timestamp.fromMillis(1_700_000_000_000);
    await setDoc(doc(database, 'reservations', 'reviewed-request'), {
      ...reservationRequest('customer-a'),
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  });

  const database = testEnvironment.authenticatedContext('staff-a').firestore();
  const batch = writeBatch(database);
  const reservationRef = doc(database, 'reservations', 'reviewed-request');
  const decisionRef = doc(database, 'reservationDecisions', 'reviewed-request-rejected');

  batch.update(reservationRef, {
    status: 'rejected',
    updatedAt: serverTimestamp(),
  });
  batch.set(decisionRef, rejectionDecision('reviewed-request', 'customer-a'));
  await assertSucceeds(batch.commit());

  const reservationSnapshot = await assertSucceeds(getDoc(reservationRef));
  const decisionSnapshot = await assertSucceeds(getDoc(decisionRef));
  assert.equal(reservationSnapshot.data()?.status, 'rejected');
  assert.equal(decisionSnapshot.data()?.newStatus, 'rejected');

  await assertFails(
    updateDoc(decisionRef, {
      decidedByName: 'Changed Name',
    }),
  );
});

test('reservation rejection decision must match the authoritative customer and actor', async () => {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const database = context.firestore();
    const timestamp = Timestamp.fromMillis(1_700_000_000_000);
    await setDoc(doc(database, 'reservations', 'forged-decision-request'), {
      ...reservationRequest('customer-a'),
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  });

  const database = testEnvironment.authenticatedContext('staff-a').firestore();
  const batch = writeBatch(database);
  batch.update(doc(database, 'reservations', 'forged-decision-request'), {
    status: 'rejected',
    updatedAt: serverTimestamp(),
  });
  batch.set(
    doc(database, 'reservationDecisions', 'forged-decision-request-rejected'),
    rejectionDecision('forged-decision-request', 'customer-b'),
  );
  await assertFails(batch.commit());
});

test('customers cannot read staff reservation decision records', async () => {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const database = context.firestore();
    const timestamp = Timestamp.fromMillis(1_700_000_000_000);
    await setDoc(doc(database, 'reservationDecisions', 'private-decision'), {
      reservationId: 'request-a',
      customerId: 'customer-a',
      previousStatus: 'pending_review',
      newStatus: 'rejected',
      decidedBy: 'staff-a',
      decidedByName: 'Staff A',
      createdAt: timestamp,
    });
  });

  const database = testEnvironment.authenticatedContext('customer-a').firestore();
  await assertFails(getDoc(doc(database, 'reservationDecisions', 'private-decision')));
});
"""
if old_test not in tests:
    raise SystemExit('Original staff reservation review test not found')
tests = tests.replace(old_test, new_test, 1)
test_path.write_text(tests, encoding='utf-8')

# Add the staff review index.
index_path = Path('firebase/firestore.indexes.json')
indexes = json.loads(index_path.read_text(encoding='utf-8'))
review_index = {
    'collectionGroup': 'reservations',
    'queryScope': 'COLLECTION',
    'fields': [
        {'fieldPath': 'status', 'order': 'ASCENDING'},
        {'fieldPath': 'createdAt', 'order': 'DESCENDING'},
    ],
}
if review_index not in indexes['indexes']:
    indexes['indexes'].append(review_index)
index_path.write_text(json.dumps(indexes, indent=2) + '\n', encoding='utf-8')

replace_once(
    'web/src/features/audit/audit.types.ts',
    "  | 'payment_recorded'\n",
    "  | 'payment_recorded'\n  | 'reservation_rejected'\n",
)

replace_once(
    'web/src/features/audit/audit.service.ts',
    "import type { PaymentRecord } from '../payments/payment.types';\n",
    "import type { PaymentRecord } from '../payments/payment.types';\nimport { subscribeToReservationDecisions } from '../reservations/reservation.service';\nimport type { ReservationDecision } from '../reservations/reservation.types';\n",
)
replace_once(
    'web/src/features/audit/audit.service.ts',
    "  let payments: PaymentRecord[] = [];\n  let equipmentTransactions: EquipmentTransactionRecord[] = [];\n",
    "  let payments: PaymentRecord[] = [];\n  let reservationDecisions: ReservationDecision[] = [];\n  let equipmentTransactions: EquipmentTransactionRecord[] = [];\n",
)
replace_once(
    'web/src/features/audit/audit.service.ts',
    "      ...payments.map(paymentToAuditActivity),\n      ...equipmentTransactions.map(equipmentTransactionToAuditActivity),\n",
    "      ...payments.map(paymentToAuditActivity),\n      ...reservationDecisions.map(reservationDecisionToAuditActivity),\n      ...equipmentTransactions.map(equipmentTransactionToAuditActivity),\n",
)
replace_once(
    'web/src/features/audit/audit.service.ts',
    "  const unsubscribeEquipment = subscribeToEquipmentTransactions((records) => {\n",
    "  const unsubscribeReservations = subscribeToReservationDecisions((records) => {\n    reservationDecisions = records;\n    publish();\n  }, handleError);\n\n  const unsubscribeEquipment = subscribeToEquipmentTransactions((records) => {\n",
)
replace_once(
    'web/src/features/audit/audit.service.ts',
    "    unsubscribePayments();\n    unsubscribeEquipment();\n",
    "    unsubscribePayments();\n    unsubscribeReservations();\n    unsubscribeEquipment();\n",
)
replace_once(
    'web/src/features/audit/audit.service.ts',
    "function equipmentTransactionToAuditActivity(\n",
    "function reservationDecisionToAuditActivity(decision: ReservationDecision): AuditActivity {\n  return {\n    id: `reservation-${decision.id}`,\n    kind: 'reservation_rejected',\n    title: 'Reservation request rejected',\n    detail: `Reservation ${decision.reservationId}`,\n    actorName: decision.decidedByName,\n    createdAt: decision.createdAt,\n  };\n}\n\nfunction equipmentTransactionToAuditActivity(\n",
)
replace_once(
    'web/src/features/audit/AuditPanel.tsx',
    '            Review recent inventory, payment, and physical equipment activity from their\n            append-only operational records.\n',
    '            Review recent reservation decisions, inventory, payment, and physical equipment\n            activity from their append-only operational records.\n',
)

schema_path = Path('docs/firestore-schema.md')
schema = schema_path.read_text(encoding='utf-8')
if '## `reservationDecisions/{decisionId}`' not in schema:
    schema += """

## `reservationDecisions/{decisionId}`

Append-only staff/admin record for protected reservation review decisions currently implemented.

Fields:

```text
reservationId
customerId
previousStatus
newStatus
decidedBy
decidedByName
createdAt
```

Current supported decision is `pending_review -> rejected`. The decision document ID is deterministic as `<reservationId>-rejected`, and the reservation update plus decision creation must succeed atomically. Customers cannot read this internal actor-attributed history.

Reservation confirmation remains intentionally unavailable until Dos Hermanos approves an enforceable simultaneous-event capacity rule. Same-date or overlapping requests are not rejected automatically.
"""
    schema_path.write_text(schema, encoding='utf-8')

module_path = Path('docs/module-map.md')
module_map = module_path.read_text(encoding='utf-8')
if '### Reservation review foundation' not in module_map:
    module_map += """

### Reservation review foundation

The staff/admin web workspace now includes a bounded pending-reservation review queue. Authorized staff may reject a pending request through an atomic reservation-status update plus immutable `reservationDecisions` record. Confirmation remains disabled until the approved capacity rule can be enforced without imposing a false one-event-per-date limit.
"""
    module_path.write_text(module_map, encoding='utf-8')

schedule_path = Path('docs/scheduling-policy.md')
schedule = schedule_path.read_text(encoding='utf-8')
if '## Current staff review workflow' not in schedule:
    schedule += """

## Current staff review workflow

Authorized staff and administrators can now view a bounded queue of `pending_review` reservation requests and reject an invalid or declined request. Every rejection is recorded atomically in the immutable `reservationDecisions` history with the authenticated actor and timestamp.

Confirmation remains unavailable. The review interface explicitly explains that overlapping events are permitted and that a date overlap alone is not a capacity failure. This preserves the approved scheduling boundary while allowing the review workflow to progress without inventing a capacity formula.
"""
    schedule_path.write_text(schedule, encoding='utf-8')
