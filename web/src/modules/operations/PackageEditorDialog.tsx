import { useEffect, useRef, useState, type FormEvent } from 'react';
import { createManagedPackage, updateManagedPackage } from './package.service';
import type { ManagedCateringPackage, PackageInput } from './package.types';

type PackageFormState = {
  name: string;
  description: string;
  pricePesos: string;
  menuHighlights: string;
  sortOrder: string;
  isActive: boolean;
};

const emptyForm: PackageFormState = {
  name: '',
  description: '',
  pricePesos: '',
  menuHighlights: '',
  sortOrder: '0',
  isActive: true,
};

export function PackageEditorDialog({
  isOpen,
  cateringPackage,
  onClose,
  onSaved,
}: {
  isOpen: boolean;
  cateringPackage: ManagedCateringPackage | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [form, setForm] = useState<PackageFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setForm(cateringPackage ? packageToForm(cateringPackage) : emptyForm);
    setFormError(null);
  }, [cateringPackage, isOpen]);

  function close() {
    if (!isSaving) onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const parsedInput = parsePackageForm(form);
    if (typeof parsedInput === 'string') {
      setFormError(parsedInput);
      return;
    }

    setIsSaving(true);
    try {
      if (cateringPackage) {
        await updateManagedPackage(cateringPackage.id, parsedInput);
        onSaved('Package updated.');
      } else {
        await createManagedPackage(parsedInput);
        onSaved('Package created.');
      }
      onClose();
    } catch {
      setFormError('Package could not be saved.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="package-management-dialog"
      aria-labelledby="package-management-dialog-title"
      onCancel={(event) => {
        if (isSaving) event.preventDefault();
        else close();
      }}
      onClose={() => {
        if (isOpen) close();
      }}
    >
      <form className="package-management-editor" onSubmit={(event) => void handleSubmit(event)}>
        <div className="package-management-editor-heading">
          <div>
            <h3 id="package-management-dialog-title">{cateringPackage ? 'Edit package' : 'Add package'}</h3>
            <p>Set the customer-facing package details and catalog visibility.</p>
          </div>
          <button className="package-management-close" type="button" aria-label="Close package form" onClick={close} disabled={isSaving}>×</button>
        </div>

        <div className="package-management-form-grid">
          <label>
            <span>Package name</span>
            <input value={form.name} maxLength={120} required autoFocus onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
          </label>
          <label>
            <span>Base price (PHP)</span>
            <input type="number" inputMode="decimal" min="0" max="1000000" step="0.01" value={form.pricePesos} required onChange={(event) => setForm((current) => ({ ...current, pricePesos: event.target.value }))} />
          </label>
          <label>
            <span>Sort order</span>
            <input type="number" min="0" max="10000" step="1" value={form.sortOrder} required onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value }))} />
          </label>
          <label className="package-management-checkbox">
            <input type="checkbox" checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} />
            <span>Visible to customers</span>
          </label>
        </div>

        <label>
          <span>Description</span>
          <textarea rows={4} maxLength={2000} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
        </label>
        <label>
          <span>Menu highlights</span>
          <textarea rows={5} value={form.menuHighlights} placeholder="One item per line" onChange={(event) => setForm((current) => ({ ...current, menuHighlights: event.target.value }))} />
          <small>Maximum 20 items.</small>
        </label>

        {formError ? <div className="package-management-error" role="alert">{formError}</div> : null}

        <div className="package-management-editor-actions">
          <button type="button" onClick={close} disabled={isSaving}>Cancel</button>
          <button className="package-management-primary" type="submit" disabled={isSaving}>
            {isSaving ? 'Saving…' : cateringPackage ? 'Save changes' : 'Add package'}
          </button>
        </div>
      </form>
    </dialog>
  );
}

function packageToForm(cateringPackage: ManagedCateringPackage): PackageFormState {
  return {
    name: cateringPackage.name,
    description: cateringPackage.description,
    pricePesos: (cateringPackage.priceInCentavos / 100).toFixed(2),
    menuHighlights: cateringPackage.menuHighlights.join('\n'),
    sortOrder: String(cateringPackage.sortOrder),
    isActive: cateringPackage.isActive,
  };
}

function parsePackageForm(form: PackageFormState): PackageInput | string {
  const name = form.name.trim();
  const description = form.description.trim();
  const pricePesos = Number(form.pricePesos);
  const sortOrder = Number(form.sortOrder);
  const menuHighlights = form.menuHighlights.split('\n').map((item) => item.trim()).filter(Boolean);

  if (!name) return 'Package name is required.';
  if (!Number.isFinite(pricePesos) || pricePesos < 0 || pricePesos > 1_000_000) return 'Enter a valid base price from ₱0.00 to ₱1,000,000.00.';
  if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 10_000) return 'Sort order must be a whole number from 0 to 10,000.';
  if (menuHighlights.length > 20) return 'Use no more than 20 menu highlights.';

  return {
    name,
    description,
    priceInCentavos: Math.round(pricePesos * 100),
    menuHighlights,
    sortOrder,
    isActive: form.isActive,
  };
}
