'use client';

import React, { useEffect } from 'react';
import { Icon } from './Icon';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Max width in px. 480 for forms, 560 for detailed confirmations. */
  maxWidth?: number;
  /** Disable backdrop/Esc close (e.g. while saving). */
  dismissable?: boolean;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 480,
  dismissable = true,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissable) onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, dismissable, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start sm:items-center justify-center overflow-y-auto p-4 backdrop-blur-sm"
      style={{ background: 'color-mix(in srgb, var(--bg) 45%, rgba(0,0,0,.55))' }}
      onMouseDown={() => dismissable && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
        style={{ maxWidth }}
        className="w-full my-8 bg-surface-elevated border border-border rounded-lg shadow-lg anim-rise overflow-hidden"
      >
        {(title || dismissable) && (
          <div className="flex items-start gap-4 px-5 sm:px-6 pt-5 pb-3">
            <div className="flex-1 min-w-0">
              {title && <h2 className="t-h3">{title}</h2>}
              {description && <p className="t-small text-text-muted mt-1">{description}</p>}
            </div>
            {dismissable && (
              <button
                onClick={onClose}
                aria-label="Close"
                className="text-text-muted hover:text-text p-1 -me-1 rounded-sm focus-ring transition-colors"
              >
                <Icon name="x" size={18} />
              </button>
            )}
          </div>
        )}
        <div className={cn('px-5 sm:px-6', title || dismissable ? 'pb-5' : 'py-5')}>{children}</div>
        {footer && (
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 px-5 sm:px-6 py-4 border-t border-border bg-surface/40">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
