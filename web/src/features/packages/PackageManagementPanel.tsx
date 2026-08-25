import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import {
  createManagedPackage,
  loadManagedPackages,
  setManagedPackageActive,
  updateManagedPackage,
} from './package.service';
import type { ManagedCateringPackage, PackageInput } from './package.types';
import './package-management.css';

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

export function PackageManagementPanel() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [packages, setPackages] = useState<ManagedCateringPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
  const [form, setForm] = useState<PackageFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [busyPackageId, setBusyPackageId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void refreshPackages();
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (isEditorOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isEditorOpen && dialog.open) {
      dialog.close();
    }
  }, [isEditorOpen]);

  const activeCount = useMemo(
    () => packages.filter((cateringPackage) => cateringPackage.isActive).length,
    [packages],
  );

  async function refreshPackages() {
    setIsLoading(true);
    setHasError(false);

    try {
      setPackages(await loadManagedPackages());
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }

  function openCreateEditor() {
    setEditingPackageId(null);
    setForm(emptyForm);
    setFormError(null);
    setMessage(null);
    setIsEditorOpen(true);
  }

  function openEditEditor(cateringPackage: ManagedCateringPackage) {
    setEditingPackageId(cateringPackage.id);
    setForm({
      name: cateringPackage.name,
      description: cateringPackage.description,
      pricePesos: (cateringPackage.priceInCentavos / 100).toFixed(2),
      menuHighlights: cateringPackage.menuHighlights.join('\n'),
      sortOrder: String(cateringPackage.sortOrder),
      isActive: cateringPackage.isActive,
    });
    setFormError(null);
    setMessage(null);
    setIsEditorOpen(true);
  }

  function closeEditor() {
    if (isSaving) {
      return;
    }

    setIsEditorOpen(false);
    setEditingPackageId(null);
    setForm(emptyForm);
    setFormError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setMessage(null);

    const parsedInput = parsePackageForm(form);
    if (typeof parsedInput === 'string') {
      setFormError(parsedInput);
      return;
    }

    setIsSaving(true);

    try {
      if (editingPackageId) {
        await updateManagedPackage(editingPackageId, parsedInput);
        setMessage('Package updated.');
      } else {
        await createManagedPackage(parsedInput);
        setMessage('Package created.');
      }

      setIsEditorOpen(false);
      setEditingPackageId(null);
      setForm(emptyForm);
      await refreshPackages();
    } catch {
      setFormError('Package could not be saved.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleStatusChange(cateringPackage: ManagedCateringPackage) {
    setBusyPackageId(cateringPackage.id);
    setMessage(null);

    try {
      await setManagedPackageActive(cateringPackage.id, !cateringPackage.isActive);
      setMessage(cateringPackage.isActive ? 'Package hidden.' : 'Package published.');
      await refreshPackages();
    } catch {
      setMessage('Package status could not be changed.');
    } finally {
      setBusyPackageId(null);
    }
  }

  return (
    <section className="package-management-section" aria-label="Packages">
      <div className="package-management-heading">
        <button className="package-management-primary" type="button" onClick={openCreateEditor}>
          Add package
        </button>
      </div>

      <div className="package-management-summary" aria-label="Package summary">
        <span><strong>{packages.length}</strong> packages</span>
        <span><strong>{activeCount}</strong> active</span>
        <span><strong>{packages.length - activeCount}</strong> inactive</span>
      </div>

      {message ? <div className="package-management-message" role="status">{message}</div> : null}

      <dialog
        ref={dialogRef}
        className="package-management-dialog"
        aria-labelledby="package-management-dialog-title"
        onCancel={(event) => {
          if (isSaving) {
            event.preventDefault();
            return;
          }
          closeEditor();
        }}
        onClose={() => {
          if (isEditorOpen) {
            closeEditor();
          }
        }}
      >
        <form className="package-management-editor" onSubmit={(event) => void handleSubmit(event)}>
          <div className="package-management-editor-heading">
            <div>
              <h3 id="package-management-dialog-title">
                {editingPackageId ? 'Edit package' : 'Add package'}
              </h3>
              <p>Set the customer-facing package details and catalog visibility.</p>
            </div>
            <button
              className="package-management-close"
              type="button"
              aria-label="Close package form"
              onClick={closeEditor}
              disabled={isSaving}
            >
              ×
            </button>
          </div>

          <div className="package-management-form-grid">
            <label>
              <span>Package name</span>
              <input
                value={form.name}
                maxLength={120}
                required
                autoFocus
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              />
            </label>
            <label>
              <span>Base price (PHP)</span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                max="1000000"
                step="0.01"
                value={form.pricePesos}
                required
                onChange={(event) => setForm((current) => ({ ...current, pricePesos: event.target.value }))}
              />
            </label>
            <label>
              <span>Sort order</span>
              <input
                type="number"
                min="0"
                max="10000"
                step="1"
                value={form.sortOrder}
                required
                onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value }))}
              />
            </label>
            <label className="package-management-checkbox">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
              />
              <span>Visible to customers</span>
            </label>
          </div>

          <label>
            <span>Description</span>
            <textarea
              rows={4}
              maxLength={2000}
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            />
          </label>

          <label>
            <span>Menu highlights</span>
            <textarea
              rows={5}
              value={form.menuHighlights}
              placeholder="One item per line"
              onChange={(event) => setForm((current) => ({ ...current, menuHighlights: event.target.value }))}
            />
            <small>Maximum 20 items.</small>
          </label>

          {formError ? <div className="package-management-error" role="alert">{formError}</div> : null}

          <div className="package-management-editor-actions">
            <button type="button" onClick={closeEditor} disabled={isSaving}>
              Cancel
            </button>
            <button className="package-management-primary" type="submit" disabled={isSaving}>
              {isSaving ? 'Saving…' : editingPackageId ? 'Save changes' : 'Add package'}
            </button>
          </div>
        </form>
      </dialog>

      {isLoading ? <ManagementStatus message="Loading packages…" /> : null}
      {!isLoading && hasError ? <ManagementStatus message="Packages could not be loaded." error /> : null}
      {!isLoading && !hasError && packages.length === 0 ? (
        <ManagementStatus message="No packages yet." />
      ) : null}

      {!isLoading && !hasError && packages.length > 0 ? (
        <div className="package-management-table-wrap">
          <table className="package-management-table">
            <thead>
              <tr>
                <th scope="col">Package</th>
                <th scope="col">Base price</th>
                <th scope="col">Order</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {packages.map((cateringPackage) => (
                <tr key={cateringPackage.id}>
                  <td>
                    <strong>{cateringPackage.name}</strong>
                    <span>{cateringPackage.menuHighlights.length} menu items</span>
                  </td>
                  <td>{formatCurrency(cateringPackage.priceInCentavos)}</td>
                  <td>{cateringPackage.sortOrder.toLocaleString('en-PH')}</td>
                  <td>
                    <span className={`package-management-status package-management-status-${cateringPackage.isActive ? 'active' : 'inactive'}`}>
                      {cateringPackage.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="package-management-actions">
                      <button type="button" onClick={() => openEditEditor(cateringPackage)}>Edit</button>
                      <button
                        type="button"
                        disabled={busyPackageId === cateringPackage.id}
                        onClick={() => void handleStatusChange(cateringPackage)}
                      >
                        {busyPackageId === cateringPackage.id
                          ? 'Saving…'
                          : cateringPackage.isActive
                            ? 'Hide'
                            : 'Publish'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}

function parsePackageForm(form: PackageFormState): PackageInput | string {
  const name = form.name.trim();
  const description = form.description.trim();
  const pricePesos = Number(form.pricePesos);
  const sortOrder = Number(form.sortOrder);
  const menuHighlights = form.menuHighlights
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);

  if (!name) {
    return 'Package name is required.';
  }

  if (!Number.isFinite(pricePesos) || pricePesos < 0 || pricePesos > 1_000_000) {
    return 'Enter a valid base price from ₱0.00 to ₱1,000,000.00.';
  }

  if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 10_000) {
    return 'Sort order must be a whole number from 0 to 10,000.';
  }

  if (menuHighlights.length > 20) {
    return 'Use no more than 20 menu highlights.';
  }

  return {
    name,
    description,
    priceInCentavos: Math.round(pricePesos * 100),
    menuHighlights,
    sortOrder,
    isActive: form.isActive,
  };
}

function ManagementStatus({ message, error = false }: { message: string; error?: boolean }) {
  return (
    <div className={`package-management-empty${error ? ' package-management-error' : ''}`} role={error ? 'alert' : 'status'}>
      {message}
    </div>
  );
}

function formatCurrency(valueInCentavos: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(valueInCentavos / 100);
}
