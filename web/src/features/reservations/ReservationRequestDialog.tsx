import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import type { CateringPackage } from '../packages/package.types';
import { ReservationForm } from './ReservationForm';
import './reservations.css';

type ReservationRequestDialogProps = {
  cateringPackage: CateringPackage | null;
  onClose: () => void;
};

const pesoFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function ReservationRequestDialog({
  cateringPackage,
  onClose,
}: ReservationRequestDialogProps) {
  const { authState } = useAuth();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (cateringPackage && dialog && !dialog.open) {
      setIsComplete(false);
      dialog.showModal();
    }

    if (!cateringPackage && dialog?.open) {
      dialog.close();
    }
  }, [cateringPackage]);

  const customerId =
    authState.status === 'active' && authState.profile?.role === 'customer'
      ? authState.profile.id
      : null;

  return (
    <dialog
      ref={dialogRef}
      className="reservation-dialog"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
      aria-labelledby="reservation-dialog-title"
    >
      {cateringPackage ? (
        <div className="reservation-dialog-content">
          <div className="reservation-dialog-heading">
            <div>
              <p className="eyebrow">Reservation request</p>
              <h2 id="reservation-dialog-title">{cateringPackage.name}</h2>
              <p>
                Starting at {pesoFormatter.format(cateringPackage.priceInCentavos / 100)}.
                Final details remain subject to review.
              </p>
            </div>
            <button className="quiet-button" type="button" onClick={onClose}>
              Close
            </button>
          </div>

          {renderDialogBody()}
        </div>
      ) : null}
    </dialog>
  );

  function renderDialogBody() {
    if (!cateringPackage) {
      return null;
    }

    if (authState.status === 'loading') {
      return (
        <div className="reservation-access-note" role="status">
          Checking your account…
        </div>
      );
    }

    if (!customerId) {
      return (
        <div className="reservation-access-note" role="status">
          Use Google login in the header with an active customer account to request this package.
        </div>
      );
    }

    if (isComplete) {
      return (
        <div className="reservation-success" role="status">
          <strong>Request received.</strong>
          <p>Dos Hermanos still needs to review and confirm your reservation request.</p>
          <button className="primary-button" type="button" onClick={onClose}>
            Done
          </button>
        </div>
      );
    }

    return (
      <ReservationForm
        customerId={customerId}
        cateringPackage={cateringPackage}
        onSubmitted={() => setIsComplete(true)}
      />
    );
  }
}
