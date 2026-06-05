import React from 'react';
import { useLocale } from '../../lib/i18n';
import { LOCALES, type Locale } from '../../lib/locales';
import { Button, type ButtonProps } from './Button';
import { Segmented } from './Form';

interface LanguageToggleProps extends Omit<ButtonProps, 'onClick' | 'variant'> {
  minimal?: boolean; // If true, just shows a small text indicator
  variant?: 'ghost' | 'secondary' | 'segmented'; // added 'segmented'
}

export function LanguageToggle({ minimal, variant, className, ...props }: LanguageToggleProps) {
  const { locale, setLocale } = useLocale();

  const toggleLocale = (newLocaleStr?: string) => {
    const newLocale: Locale = (newLocaleStr as Locale) || (locale === 'en' ? 'ar' : 'en');
    
    // Update React context
    setLocale(newLocale);
    
    // Persist
    try {
      localStorage.setItem('haseeela.locale', newLocale);
    } catch (err) {
      // Ignore
    }
    
    // Update DOM
    document.documentElement.lang = newLocale;
    document.documentElement.dir = LOCALES[newLocale].dir;
  };

  const isEn = locale === 'en';
  const label = isEn ? 'عربي' : 'English';
  const shortLabel = isEn ? 'ع' : 'EN';

  if (variant === 'segmented') {
    return (
      <Segmented
        value={locale}
        onChange={(v) => toggleLocale(v)}
        options={[
          { value: 'en', label: 'English' },
          { value: 'ar', label: 'عربي' }
        ]}
      />
    );
  }

  if (minimal) {
    return (
      <Button
        variant="ghost"
        onClick={() => toggleLocale()}
        title={label}
        className={className}
        {...props}
      >
        <span className="font-bold text-base leading-none">{shortLabel}</span>
      </Button>
    );
  }

  return (
    <Button
      variant={variant || 'secondary'}
      onClick={() => toggleLocale()}
      className={className}
      icon="globe"
      {...props}
    >
      {label}
    </Button>
  );
}
