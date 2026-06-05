import React, { useState } from 'react';
import { Input, type InputProps } from '@/components/ui/Form';
import { useLocale } from '@/lib/i18n';
import { Icon } from '@/components/ui/Icon';

export const PasswordInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    const { t } = useLocale();
    const [show, setShow] = useState(false);
    
    return (
      <div className="relative">
        <Input
          ref={ref}
          type={show ? "text" : "password"}
          className={`pr-10 ${className || ''}`}
          {...props}
        />
        <button 
          type="button" 
          onClick={() => setShow((s) => !s)} 
          aria-label={show ? t('auth.password.hide') : t('auth.password.show')}
          className="absolute right-2 top-[7px] border-none bg-transparent cursor-pointer text-text-muted p-1 hover:text-text focus-ring rounded-sm"
        >
          <Icon name={show ? "eyeOff" : "eye"} size={16} />
        </button>
      </div>
    );
  }
);
PasswordInput.displayName = 'PasswordInput';
