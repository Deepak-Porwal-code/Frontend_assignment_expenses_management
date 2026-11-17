import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

/**
 * A small destructive-action dialog. The caller owns the async confirm flow
 * so the dialog can stay open and show a loading state while it works.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  tone = 'danger',
  loading = false,
  onConfirm,
  onClose,
}) {
  return (
    <Modal
      open={open}
      onClose={loading ? () => {} : onClose}
      title={title}
      description={description}
      size="sm"
      closeOnBackdrop={!loading}
      footer={(
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
            data-autofocus
          >
            {confirmLabel}
          </Button>
        </>
      )}
    >
      <div className="confirm-dialog">
        <span className="confirm-dialog__icon" aria-hidden="true">
          <AlertTriangle size={20} strokeWidth={2.1} />
        </span>
        <p>This action can’t be undone.</p>
      </div>
    </Modal>
  );
}
