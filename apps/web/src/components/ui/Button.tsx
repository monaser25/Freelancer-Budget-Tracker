import React from 'react';
import { Icon } from './Icon';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: string;
  iconRight?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, icon, iconRight, children, ...props }, ref) => {
    
    const baseStyles = "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-ring disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap select-none relative";
    
    const variants = {
      primary: "bg-accent text-accent-fg hover:bg-accent-hover border border-transparent",
      secondary: "bg-surface text-text border border-border hover:bg-surface-hover",
      ghost: "bg-transparent text-text-secondary hover:bg-surface-hover border border-transparent",
      destructive: "bg-negative text-white hover:opacity-90 border border-transparent",
    };

    const sizes = {
      sm: "h-8 px-3 text-sm",
      md: "h-9 px-3.5 text-sm",
      lg: "h-10 px-[18px] text-sm",
    };

    // If no children, make it a square
    const paddingStyles = children ? sizes[size] : size === 'sm' ? 'h-8 w-8' : size === 'md' ? 'h-9 w-9' : 'h-10 w-10';

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(baseStyles, variants[variant], paddingStyles, className)}
        {...props}
      >
        {loading && <span className="spinner w-3.5 h-3.5" />}
        {!loading && icon && <Icon name={icon} size={size === 'sm' ? 15 : 16} />}
        {children}
        {!loading && iconRight && <Icon name={iconRight} size={size === 'sm' ? 15 : 16} />}
      </button>
    );
  }
);
Button.displayName = 'Button';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string;
  size?: number | 'sm' | 'md' | 'lg';
  active?: boolean;
  badge?: boolean;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, icon, size = 'md', active, badge, title, ...props }, ref) => {
    const sizeMap = {
      sm: 'h-8 w-8',
      md: 'h-9 w-9',
      lg: 'h-10 w-10'
    };
    
    // For custom pixel sizes (backward compatibility)
    const customSizeStyle = typeof size === 'number' ? { width: size, height: size } : {};
    const sizeClass = typeof size === 'string' ? sizeMap[size] : '';

    return (
      <button
        ref={ref}
        title={title}
        aria-label={title || icon}
        className={cn(
          "inline-flex items-center justify-center rounded-md border border-transparent transition-colors focus-ring relative",
          active 
            ? "bg-accent-tint text-accent" 
            : "bg-transparent text-text-secondary hover:bg-surface-hover hover:text-text",
          sizeClass,
          className
        )}
        style={customSizeStyle}
        {...props}
      >
        <Icon name={icon} size={18} />
        {badge && (
          <span className="absolute top-1.5 end-1.5 w-2 h-2 rounded-full bg-negative shadow-[0_0_0_2px_var(--surface)]" />
        )}
      </button>
    );
  }
);
IconButton.displayName = 'IconButton';
