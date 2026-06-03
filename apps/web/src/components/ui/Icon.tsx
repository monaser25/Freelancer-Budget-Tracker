import * as LucideIcons from 'lucide-react';
import { LucideProps } from 'lucide-react';
import type { ComponentType } from 'react';

export type IconName = keyof typeof LucideIcons;

export interface IconProps extends LucideProps {
  name: string;
}

export function Icon({ name, ...props }: IconProps) {
  // Convert standard names to lucide names if necessary
  const normalizedName = name.charAt(0).toUpperCase() + name.slice(1);
  const icons = LucideIcons as unknown as Record<string, ComponentType<LucideProps>>;
  
  // Try to find exact match
  const LucideIcon = icons[normalizedName] || icons[name] || LucideIcons.HelpCircle;

  if (!LucideIcon) {
    return <LucideIcons.HelpCircle {...props} />;
  }

  return <LucideIcon {...props} />;
}
