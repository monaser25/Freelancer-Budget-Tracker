import React from 'react';
import { Icon } from '@/components/ui/Icon';

export function AuthLayout({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
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
            <Icon name="wallet" size={20} className="text-white" />
          </div>
          <span className="text-[18px] font-semibold text-white">Haseela</span>
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
            See your money clearly.
          </div>
          <p className="text-[16px] leading-[26px] text-[rgba(255,255,255,0.78)] max-w-[360px] mt-4">
            Track who pays you, what you spend, and whether you&apos;re profitable — all in one calm, precise ledger.
          </p>
          <div className="flex gap-6 mt-9">
            <div>
              <div className="text-[24px] font-semibold text-white">Income</div>
              <div className="text-[12px] text-[rgba(255,255,255,0.66)] mt-0.5">what you earn</div>
            </div>
            <div>
              <div className="text-[24px] font-semibold text-white">Clients</div>
              <div className="text-[12px] text-[rgba(255,255,255,0.66)] mt-0.5">who pays you</div>
            </div>
            <div>
              <div className="text-[24px] font-semibold text-white">Costs</div>
              <div className="text-[12px] text-[rgba(255,255,255,0.66)] mt-0.5">what you spend</div>
            </div>
          </div>
        </div>
        
        <div className="relative z-10 text-[13px] text-[rgba(255,255,255,0.6)]">
          © 2026 Haseela · Built for freelancers
        </div>
      </div>
      
      {/* Form side */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-10">
        <div className="w-full" style={{ maxWidth: wide ? 560 : 400 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
