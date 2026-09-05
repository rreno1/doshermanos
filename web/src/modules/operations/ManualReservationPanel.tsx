import { useEffect, useState } from 'react';
import { ManagementLoadingState } from '../../app/ManagementControls';
import { useToast } from '../../app/ToastProvider';
import { loadActivePackages } from './package.service';
import type { CateringPackage } from './package.types';
import {
  validateManualReservationCustomer,
  type ManualReservationCustomerValues,
} from './manual-reservation.validation';
import { ReservationForm } from './ReservationForm';
import { createManualReservationRequest } from './reservation.service';
import type { ReservationRequestInput } from './reservation.types';
import './manual-reservation.css';

const emptyCustomer: ManualReservationCustomerValues = {
  name: '',
  contact: '',
};

export function ManualReservationPanel({
  staffId,
  staffName,
}: {
  staffId: string;
  staffName: string;
}) {
  const { showToast } = useToast();
  const [packages, setPackages] = useState<CateringPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<CateringPackage | null>(null);
  const [customer, setCustomer] = useState<ManualReservationCustomerValues>(emptyCustomer);
  const [customerErrors, setCustomerErrors] = useState<Partial<Record<keyof ManualReservationCustomerValues, string>>>({});
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);
  const [hasPackageError, setHasPackageError] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    setIsLoadingPackages(true);
    setHasPackageError(false);

    void loadActivePackages()
      .then((nextPackages) => {
        if (isCurrent) {
          setPackages(nextPackages);
        }
      })
      .catch(() => {
        if (isCurrent) {
          setPackages([]);
          setHasPackageError(true);
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoadingPackages(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  function updateCustomer(field: keyof ManualReservationCustomerValues, value: string) {
    setCustomer((current) => ({ ...current, [field]: value }));
    setCustomerErrors((current) => ({ ...current, [field]: undefined }));
  }

  function validateCustomer() {
    const validation = validateManualReservationCustomer(customer);
    setCustomerErrors(validation.errors);
    return validation.value !== null;
  }

  async function createRequest(input: ReservationRequestInput) {
    const validation = validateManualReservationCustomer(customer);
    setCustomerErrors(validation.errors);

    if (!validation.value || !selectedPackage) {
      throw new Error('Manual reservation details are incomplete.');
    }

    await createManualReservationRequest(
      staffId,
      staffName,
      validation.value,
      selectedPackage,
      input,
    );
  }

  function handleSubmitted() {
    showToast({ message: 'Manual reservation request created for review.', tone: 'success' });
    setSelectedPackage(null);
    setCustomer(emptyCustomer);
    setCustomerErrors({});
  }

  if (isLoadingPackages) {
    return <ManagementLoadingState message="Loading catering packages…" />;
  }

  if (hasPackageError) {
    return (
      <div className="management-empty-state management-empty-state-error" role="alert">
        Catering packages could not be loaded.
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <div className="management-empty-state" role="status">
        No active catering packages are available for a reservation request.
      </div>
    );
  }

  return (
    <div className="manual-reservation-flow">
      <div className="manual-reservation-note">
        Enter a request for a caller or walk-in customer. Manual entries follow the same review process as customer portal requests and do not confirm the event or approve customized pricing.
      </div>

      {!selectedPackage ? (
        <section className="manual-reservation-step" aria-labelledby="manual-package-heading">
          <div className="manual-step-heading">
            <span>Step 1</span>
            <div>
              <h2 id="manual-package-heading">Choose a package</h2>
              <p>Select the active package the customer wants to request.</p>
            </div>
          </div>

          <div className="manual-package-grid">
            {packages.map((cateringPackage) => (
              <button
                className="manual-package-option"
                type="button"
                key={cateringPackage.id}
                onClick={() => setSelectedPackage(cateringPackage)}
              >
                <span className="manual-package-option-heading">
                  <strong>{cateringPackage.name}</strong>
                  <b>{formatMoney(cateringPackage.priceInCentavos)}</b>
                </span>
                <span>{cateringPackage.description}</span>
                <small>{cateringPackage.menuHighlights.slice(0, 3).join(' · ')}</small>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <section className="manual-reservation-step" aria-labelledby="manual-details-heading">
          <div className="manual-step-heading manual-step-heading-with-action">
            <span>Step 2</span>
            <div>
              <h2 id="manual-details-heading">Enter reservation details</h2>
              <p>Record the same event and customization information requested in the public portal.</p>
            </div>
            <button
              type="button"
              className="management-secondary-button"
              onClick={() => setSelectedPackage(null)}
            >
              Change package
            </button>
          </div>

          <div className="manual-selected-package">
            <div>
              <span>Selected package</span>
              <strong>{selectedPackage.name}</strong>
            </div>
            <b>{formatMoney(selectedPackage.priceInCentavos)} base</b>
          </div>

          <ReservationForm
            key={selectedPackage.id}
            cateringPackage={selectedPackage}
            beforeSubmit={validateCustomer}
            onSubmitRequest={createRequest}
            onSubmitted={handleSubmitted}
            submitLabel="Create reservation request"
            submittingLabel="Creating request…"
            failureMessage="We could not create the manual reservation request. Please try again."
            leadingFields={(
              <div className="manual-customer-grid">
                <label>
                  <span>Customer name</span>
                  <input
                    type="text"
                    value={customer.name}
                    maxLength={100}
                    placeholder="Name provided by the caller or walk-in customer"
                    aria-invalid={Boolean(customerErrors.name)}
                    onChange={(event) => updateCustomer('name', event.target.value)}
                  />
                  {customerErrors.name ? <small>{customerErrors.name}</small> : null}
                </label>
                <label>
                  <span>Customer contact</span>
                  <input
                    type="text"
                    value={customer.contact}
                    maxLength={200}
                    placeholder="Phone number, email, or other contact detail"
                    aria-invalid={Boolean(customerErrors.contact)}
                    onChange={(event) => updateCustomer('contact', event.target.value)}
                  />
                  {customerErrors.contact ? <small>{customerErrors.contact}</small> : null}
                </label>
              </div>
            )}
          />

          <p className="manual-entered-by">Entered by {staffName}</p>
        </section>
      )}
    </div>
  );
}

function formatMoney(amountInCentavos: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amountInCentavos / 100);
}
