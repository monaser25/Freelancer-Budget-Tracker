'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useInvoiceStore } from '@/store/invoiceStore';
import { InvoiceEditor } from '@/components/invoices/InvoiceEditor';
import { useLocale } from '@/lib/i18n';

export default function EditInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);
  const { invoices, isLoaded, loadInvoices, getInvoice } = useInvoiceStore();
  const { t } = useLocale();

  useEffect(() => {
    if (!isLoaded) loadInvoices();
  }, [isLoaded, loadInvoices]);

  const invoice = getInvoice(id);

  if (!isLoaded) {
    return <div className="py-24 text-center text-text-muted text-[13px]">{t('invoices.loading')}</div>;
  }

  if (!invoice) {
    return (
      <div className="py-24 text-center">
        <p className="t-body text-text-muted">{t('invoices.notFound')}</p>
        <button onClick={() => router.push('/invoices')} className="mt-3 t-body-m text-accent hover:underline">{t('invoices.back')}</button>
      </div>
    );
  }

  if (invoice.status === 'PAID') {
    // Paid invoices are read-only; bounce to detail.
    router.replace(`/invoices/${id}`);
    return null;
  }

  return <InvoiceEditor invoice={invoice} />;
}
