import React from 'react';
import Image from 'next/image';
import { Icon } from '@/components/ui/Icon';
import { useLocale } from '@/lib/i18n';
import { LanguageToggle } from '@/components/ui/LanguageToggle';

export function AuthLayout({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  const { t } = useLocale();
  return (
    <div className="min-h-screen flex bg-background text-text">
      {/* Brand panel */}
      <div 
        className="hidden md:flex w-[44%] max-w-[560px] relative overflow-hidden flex-col justify-between p-12"
        style={{
          background: 'linear-gradient(155deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 60%, #2A1F6B) 55%, #120D2E 100%)'
        }}
      >
        <div className="flex items-center gap-[11px]">
          <div className="w-[34px] h-[34px] rounded-[10px] bg-[rgba(255,255,255,0.16)] flex items-center justify-center backdrop-blur-sm">
            <Image src="/haseeela_icon.png" alt="Haseeela logo" width={22} height={22} />
          </div>
          <span className="text-[18px] font-semibold text-white">{t('brand.name')}</span>
        </div>
        
        {/* Decorative grid */}
        <div 
          aria-hidden="true" 
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)',
            backgroundSize: '26px 26px'
          }}
        />
        
        <div className="relative z-10">
          <div className="text-[34px] leading-[42px] font-semibold text-white tracking-[-0.02em] max-w-[380px]">
            {t('auth.marketing.headline')}
          </div>
          <p className="text-[16px] leading-[26px] text-[rgba(255,255,255,0.78)] max-w-[360px] mt-4">
            {t('auth.marketing.description')}
          </p>
          <div className="flex gap-6 mt-9">
            <div>
              <div className="text-[24px] font-semibold text-white">{t('auth.marketing.features.income.title')}</div>
              <div className="text-[12px] text-[rgba(255,255,255,0.66)] mt-0.5">{t('auth.marketing.features.income.desc')}</div>
            </div>
            <div>
              <div className="text-[24px] font-semibold text-white">{t('auth.marketing.features.clients.title')}</div>
              <div className="text-[12px] text-[rgba(255,255,255,0.66)] mt-0.5">{t('auth.marketing.features.clients.desc')}</div>
            </div>
            <div>
              <div className="text-[24px] font-semibold text-white">{t('auth.marketing.features.costs.title')}</div>
              <div className="text-[12px] text-[rgba(255,255,255,0.66)] mt-0.5">{t('auth.marketing.features.costs.desc')}</div>
            </div>
          </div>
        </div>
        
        <div className="relative z-10 text-[13px] text-[rgba(255,255,255,0.6)] flex items-center justify-between">
          <span>&copy; 2026 {t('brand.name')} · {t('auth.marketing.footer')}</span>
        </div>
      </div>
      
      {/* Form side */}
      <div className="flex-1 flex flex-col relative items-center justify-center p-6 md:p-10">
        <div className="absolute top-6 right-6 md:top-10 md:right-10">
          <LanguageToggle variant="ghost" />
        </div>
        <div className="w-full" style={{ maxWidth: wide ? 560 : 400 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
