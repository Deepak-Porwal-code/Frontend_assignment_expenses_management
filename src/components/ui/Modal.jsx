import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { IconButton } from './Button';
import { cx } from '../../lib/cx';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

const EXIT_MS = 200;

/**
 * Accessible dialog with a focus trap, Escape handling, scroll locking and a
 * short exit animation. On small screens it becomes a bottom sheet via CSS.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  className = '',
  closeOnBackdrop = true,
  initialFocusRef,
}) {
  const [present, setPresent] = useState(open);
  const panelRef = useRef(null);
  const restoreFocusRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  // Keep the dialog mounted while it animates out.
  useEffect(() => {
    if (open) {
      setPresent(true);
      return undefined;
    }
    if (!present) return undefined;
    const timer = setTimeout(() => setPresent(false), EXIT_MS);
    return () => clearTimeout(timer);
  }, [open, present]);

  useEffect(() => {
    if (!open) return undefined;

    restoreFocusRef.current = document.activeElement;
    const { overflow, paddingRight } = document.body.style;
    const scrollbarGap = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollbarGap > 0) document.body.style.paddingRight = `${scrollbarGap}px`;

    const focusTimer = setTimeout(() => {
      const target = initialFocusRef?.current
        || panelRef.current?.querySelector('[data-autofocus]')
        || panelRef.current;
      target?.focus?.();
    }, 30);

    return () => {
      clearTimeout(focusTimer);
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
      restoreFocusRef.current?.focus?.();
    };
  }, [open, initialFocusRef]);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const nodes = panelRef.current?.querySelectorAll(FOCUSABLE);
      if (!nodes?.length) {
        event.preventDefault();
        return;
      }

      const first = nodes[0];
      const last = nodes[nodes.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!present) return null;

  return createPortal(
    <div className={cx('modal', open && 'is-open')}>
      <div
        className="modal__scrim"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        className={cx('modal__panel', `modal__panel--${size}`, className)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
      >
        {(title || description) && (
          <header className="modal__header">
            <div className="modal__heading">
              {title && <h2 id={titleId} className="modal__title">{title}</h2>}
              {description && (
                <p id={descriptionId} className="modal__description">{description}</p>
              )}
            </div>
            <IconButton
              label="Close dialog"
              icon={X}
              onClick={onClose}
              className="modal__close"
            />
          </header>
        )}
        {children != null && <div className="modal__body">{children}</div>}
        {footer && <footer className="modal__footer">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}
