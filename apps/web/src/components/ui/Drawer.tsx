'use client';

import React, { useEffect } from 'react';
import { Icon } from './Icon';
import { useLocale } from '@/lib/i18n';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
}

export function Drawer({ open, onClose, title, description, children, footer, width = 440 }: DrawerProps) {
  const { dir } = useLocale();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex justify-end"
      style={{ background: 'color-mix(in srgb, var(--bg) 45%, rgba(0,0,0,.55))' }}
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
        style={{ width, maxWidth: '100%', animation: `fl-slide-${dir === 'rtl' ? 'left' : 'right'} var(--dur-base) var(--ease-out)` }}
        className="h-full bg-surface border-s border-border shadow-lg flex flex-col"
      >
        {(title || description) && (
          <div className="flex items-start gap-4 px-5 py-4 border-b border-border shrink-0">
            <div className="flex-1 min-w-0">
              {title && <h2 className="t-h3">{title}</h2>}
              {description && <p className="t-small text-text-muted mt-0.5">{description}</p>}
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-text-muted hover:text-text p-1 -me-1 rounded-sm focus-ring transition-colors"
            >
              <Icon name="x" size={18} />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 px-5 py-4 border-t border-border shrink-0">{footer}</div>
        )}
      </div>
    </div>
  );
}
