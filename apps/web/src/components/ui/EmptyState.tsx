import React from 'react';
import { Icon } from './Icon';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface EmptyStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  icon?: string;
  title: string | React.ReactNode;
  body?: string | React.ReactNode;
  action?: React.ReactNode;
  compact?: boolean;
}

export function EmptyState({ className, icon = "sparkle", title, body, action, compact, ...props }: EmptyStateProps) {
  return (
    <div 
      className={cn(
        "flex flex-col items-center text-center gap-1.5",
        compact ? "py-9 px-5" : "py-16 px-5",
        className
      )} 
      {...props}
    >
      <div className="w-14 h-14 rounded-full bg-accent-tint text-accent flex items-center justify-center mb-2">
        <Icon name={icon} size={26} />
      </div>
      <div className="t-h3">{title}</div>
      {body && <div className="t-body text-text-secondary max-w-[360px]">{body}</div>}
      {action && <div className="mt-2.5">{action}</div>}
    </div>
  );
}
