import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name?: string;
  size?: number;
  color?: string; // CSS variable name like '--viz-1' or valid tailwind color
  src?: string;
}

export function Avatar({ className, name = "", size = 32, color, src, style, ...props }: AvatarProps) {
  const [imageError, setImageError] = React.useState(false);
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
    
  // Support custom CSS variable colors
  const customColorStyle = color && color.startsWith('--') ? {
    backgroundColor: `color-mix(in srgb, var(${color}) 18%, transparent)`,
    color: `var(${color})`
  } : {};

  return (
    <div 
      className={cn(
        "rounded-full shrink-0 flex items-center justify-center font-semibold tracking-wide bg-accent-tint text-accent overflow-hidden",
        className
      )}
      style={{ 
        width: size, 
        height: size, 
        fontSize: size * 0.4,
        ...customColorStyle,
        ...style 
      }}
      {...props}
    >
      {src && !imageError ? (
        <img 
          src={src} 
          alt={name} 
          className="w-full h-full object-cover" 
          onError={() => setImageError(true)}
        />
      ) : (
        initials || "?"
      )}
    </div>
  );
}
