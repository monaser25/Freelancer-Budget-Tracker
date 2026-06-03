'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { getSupabaseBrowserClient } from '@/lib/supabaseClient';
import { isDevAuthEnabled } from '@/lib/devAuth';
import { loadPreferencesAPI, updatePreferencesAPI, deleteAccountAPI } from '@/services/financialApi';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card, SectionHeader } from '@/components/ui/Card';
import { Field, Input, StrengthMeter, strength } from '@/components/ui/Form';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';

export default function ProfilePage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const dev = isDevAuthEnabled();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [savingPw, setSavingPw] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadPreferencesAPI()
      .then((p) => { setName(p.name || ''); setEmail(p.email || ''); })
      .catch(() => {
        setName((user?.user_metadata?.name as string) || '');
        setEmail(user?.email || '');
      });
  }, [user]);

  const saveName = async () => {
    if (!name.trim()) return;
    setSavingName(true);
    try {
      await updatePreferencesAPI({ name: name.trim() });
      if (!dev) await getSupabaseBrowserClient().auth.updateUser({ data: { name: name.trim() } });
      toast('Name updated');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to update name', 'error');
    } finally {
      setSavingName(false);
    }
  };

  const saveEmail = async () => {
    if (!email.trim() || email === user?.email) return;
    setSavingEmail(true);
    try {
      if (dev) {
        toast('Email change is disabled in local dev mode', 'info');
      } else {
        const { error } = await getSupabaseBrowserClient().auth.updateUser({ email: email.trim() });
        if (error) throw error;
        toast('Check your new inbox to confirm the change', 'info');
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to update email', 'error');
    } finally {
      setSavingEmail(false);
    }
  };

  const savePassword = async () => {
    if (pw.length < 8) { toast('Password must be at least 8 characters', 'error'); return; }
    if (pw !== pw2) { toast('Passwords do not match', 'error'); return; }
    setSavingPw(true);
    try {
      if (dev) {
        toast('Password change is disabled in local dev mode', 'info');
      } else {
        const { error } = await getSupabaseBrowserClient().auth.updateUser({ password: pw });
        if (error) throw error;
        toast('Password updated');
      }
      setPw(''); setPw2('');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to update password', 'error');
    } finally {
      setSavingPw(false);
    }
  };

  const doDelete = async () => {
    setDeleting(true);
    try {
      await deleteAccountAPI();
      await signOut().catch(() => undefined);
      router.replace('/login');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to delete account', 'error');
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Avatar name={name || email} size={48} />
        <div>
          <h1 className="t-h1">{name || 'Your profile'}</h1>
          <p className="t-body text-text-muted">{email}</p>
        </div>
      </div>

      {/* Personal info */}
      <Card pad={20}>
        <SectionHeader title="Personal information" />
        <div className="flex flex-col gap-4">
          <Field label="Name">
            <div className="flex gap-2">
              <Input value={name} onChange={(e) => setName(e.target.value)} className="flex-1" />
              <Button variant="secondary" loading={savingName} onClick={saveName}>Save</Button>
            </div>
          </Field>
          <Field label="Email" hint={dev ? 'Disabled in local dev mode.' : 'Changing your email requires re-verification.'}>
            <div className="flex gap-2">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="flex-1" disabled={dev} />
              <Button variant="secondary" loading={savingEmail} disabled={dev || email === user?.email} onClick={saveEmail}>Update</Button>
            </div>
          </Field>
        </div>
      </Card>

      {/* Password */}
      <Card pad={20}>
        <SectionHeader title="Change password" sub={dev ? 'Disabled in local dev mode.' : 'Use a strong, unique password.'} />
        <div className="flex flex-col gap-4">
          <Field label="New password" hint="Minimum 8 characters">
            <PasswordInput value={pw} onChange={(e) => setPw(e.target.value)} minLength={8} disabled={dev} />
            {pw && <div className="mt-2"><StrengthMeter value={pw} /></div>}
          </Field>
          <Field label="Confirm password" error={pw2 && pw2 !== pw ? 'Passwords do not match' : undefined}>
            <PasswordInput value={pw2} onChange={(e) => setPw2(e.target.value)} disabled={dev} />
          </Field>
          <div className="flex justify-end">
            <Button loading={savingPw} disabled={dev || strength(pw) < 2 || pw !== pw2} onClick={savePassword}>Update password</Button>
          </div>
        </div>
      </Card>

      {/* Danger zone */}
      <Card pad={20} className="border-negative/40">
        <SectionHeader title="Delete account" sub="Permanently remove your account and all data. This cannot be undone." />
        <Button variant="destructive" icon="trash2" onClick={() => setConfirmDel(true)}>Delete my account</Button>
      </Card>

      <ConfirmDialog
        open={confirmDel}
        onClose={() => !deleting && setConfirmDel(false)}
        tone="danger"
        title="Delete your account?"
        description="This permanently deletes your account and every client, subscription, transaction, and invoice. This action cannot be undone."
        impact="All of your data will be erased immediately."
        confirmLabel="Delete everything"
        loading={deleting}
        onConfirm={doDelete}
      />
    </div>
  );
}
