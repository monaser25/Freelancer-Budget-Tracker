import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  w?: string | number;
  h?: string | number;
  r?: string | number;
}

export function Skeleton({ className, w = "100%", h = 14, r = 8, style, ...props }: SkeletonProps) {
  // Support custom numeric dimensions
  const customStyle = {
    width: w,
    height: h,
    borderRadius: r,
    ...style
  };

  return (
    <div 
      className={cn("skeleton", className)} 
      style={customStyle} 
      {...props} 
    />
  );
}

// Alias for compatibility
export const Skel = Skeleton;
