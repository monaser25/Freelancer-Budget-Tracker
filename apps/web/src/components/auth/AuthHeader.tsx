import React from 'react';

export function AuthHeader({ title, sub }: { title: string; sub?: React.ReactNode }) {
  return (
    <div className="mb-[26px]">
      <div className="t-h1">{title}</div>
      {sub && <div className="t-body text-text-secondary mt-1.5">{sub}</div>}
    </div>
  );
}
