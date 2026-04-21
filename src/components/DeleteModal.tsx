import { useEffect, useRef } from 'react';
import styles from './DeleteModal.module.css';

interface Props {
  invoiceId: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteModal({ invoiceId, onConfirm, onCancel }: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();

      if (e.key === 'Tab' && modalRef.current) {
        const focusable = Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [tabindex="0"]'
          )
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
      aria-describedby="delete-modal-desc"
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className={styles.modal} ref={modalRef}>
        <h2 id="delete-modal-title" className={styles.title}>Confirm Deletion</h2>
        <p id="delete-modal-desc" className={styles.body}>
          Are you sure you want to delete invoice #{invoiceId}? This action cannot be undone.
        </p>
        <div className={styles.actions}>
          <button
            ref={cancelRef}
            className={styles.btnCancel}
            onClick={onCancel}
            aria-label="Cancel deletion"
          >
            Cancel
          </button>
          <button
            className={styles.btnDelete}
            onClick={onConfirm}
            aria-label={`Confirm delete invoice ${invoiceId}`}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}