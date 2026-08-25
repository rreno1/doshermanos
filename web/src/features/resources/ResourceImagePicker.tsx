import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from 'react';
import {
  getResourceImageUrl,
  validateResourceImage,
  type ResourceImageKind,
} from './resource-image.service';
import './resource-image.css';

export type ResourceImageDraft = {
  file: File | null;
  removeExisting: boolean;
  displayedUrl: string | null;
  hasChange: boolean;
  chooseFile: (file: File) => string | null;
  remove: () => void;
};

export function useResourceImageDraft(
  kind: ResourceImageKind,
  resourceId: string | null,
): ResourceImageDraft {
  const [file, setFile] = useState<File | null>(null);
  const [storedUrl, setStoredUrl] = useState<string | null>(null);
  const [removeExisting, setRemoveExisting] = useState(false);
  const previewUrl = useObjectUrl(file);

  useEffect(() => {
    let isCurrent = true;
    setFile(null);
    setStoredUrl(null);
    setRemoveExisting(false);

    if (!resourceId) {
      return () => {
        isCurrent = false;
      };
    }

    void getResourceImageUrl(kind, resourceId).then((url) => {
      if (isCurrent) {
        setStoredUrl(url);
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [kind, resourceId]);

  function chooseFile(nextFile: File) {
    const validationMessage = validateResourceImage(nextFile);
    if (validationMessage) {
      return validationMessage;
    }

    setFile(nextFile);
    setRemoveExisting(false);
    return null;
  }

  function remove() {
    setFile(null);
    setRemoveExisting(true);
  }

  return {
    file,
    removeExisting,
    displayedUrl: previewUrl ?? (removeExisting ? null : storedUrl),
    hasChange: file !== null || removeExisting,
    chooseFile,
    remove,
  };
}

export function ResourceImagePicker({
  draft,
  label,
  onError,
}: {
  draft: ResourceImageDraft;
  label: string;
  onError: (message: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;
    event.target.value = '';
    if (!nextFile) return;

    const errorMessage = draft.chooseFile(nextFile);
    onError(errorMessage);
  }

  return (
    <div className="resource-image-field">
      <span className="resource-image-field-label">{label}</span>
      <div className="resource-image-preview">
        {draft.displayedUrl ? (
          <img src={draft.displayedUrl} alt={`${label} preview`} />
        ) : (
          <div className="resource-image-preview-empty">
            <ResourceImageIcon />
            <span>No image selected</span>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        className="resource-image-input"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
      />
      <div className="resource-image-actions">
        <button
          type="button"
          className="management-secondary-button"
          onClick={() => inputRef.current?.click()}
        >
          {draft.displayedUrl ? 'Replace image' : 'Choose image'}
        </button>
        {draft.displayedUrl ? (
          <button
            type="button"
            className="management-row-button"
            onClick={() => {
              draft.remove();
              onError(null);
            }}
          >
            Remove
          </button>
        ) : null}
      </div>
      <small>JPEG, PNG, or WebP. Maximum file size: 5 MB.</small>
    </div>
  );
}

export function useResourceImageUrl(
  kind: ResourceImageKind,
  resourceId: string,
  revision: number,
) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;
    setImageUrl(null);

    void getResourceImageUrl(kind, resourceId).then((url) => {
      if (!isCurrent) return;
      if (!url) {
        setImageUrl(null);
        return;
      }

      const separator = url.includes('?') ? '&' : '?';
      setImageUrl(`${url}${separator}v=${revision}`);
    });

    return () => {
      isCurrent = false;
    };
  }, [kind, resourceId, revision]);

  return imageUrl;
}

function useObjectUrl(file: File | null) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }

    const nextUrl = URL.createObjectURL(file);
    setUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [file]);

  return url;
}

function ResourceImageIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <rect x="8" y="10" width="32" height="28" rx="4" />
      <circle cx="18" cy="20" r="3" />
      <path d="m12 34 9-9 6 6 4-4 5 7" />
    </svg>
  );
}
