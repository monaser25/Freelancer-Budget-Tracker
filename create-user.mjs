import { createClient } from '@supabase/supabase-js';
import { execFileSync } from 'node:child_process';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve('apps/api/.env') });

const SUPABASE_PROJECT_REF = 'tpzydgcvlbndedsejqxb';
const SUPABASE_URL = process.env.SUPABASE_URL || `https://${SUPABASE_PROJECT_REF}.supabase.co`;

const serviceRoleKey = () => {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) return process.env.SUPABASE_SERVICE_ROLE_KEY;
  const output = execFileSync('supabase', ['projects', 'api-keys', '--project-ref', SUPABASE_PROJECT_REF, '--output', 'json'], {
    encoding: 'utf8',
  });
  const keys = JSON.parse(output);
  const serviceRole = keys.find((key) => key.id === 'service_role' || key.name === 'service_role');
  if (!serviceRole?.api_key || serviceRole.api_key.includes('··')) {
    throw new Error('Could not load Supabase service role key');
  }
  return serviceRole.api_key;
};

const admin = createClient(SUPABASE_URL, serviceRoleKey(), {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const email = 'mohamednaser2537@gmail.com';
  const password = 'mamlok123';

  console.log(`Creating/updating user ${email}...`);
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    if (error.message.includes('already registered')) {
        console.log('User already exists, getting user id to confirm...');
        const { data: users, error: listError } = await admin.auth.admin.listUsers();
        if (listError) throw listError;
        const existing = users.users.find(u => u.email === email);
        if (existing) {
             const { error: updateError } = await admin.auth.admin.updateUserById(existing.id, { email_confirm: true, password });
             if (updateError) throw updateError;
             console.log('User confirmed and password updated successfully.');
        }
    } else {
        throw error;
    }
  } else {
    console.log(`User created successfully with ID: ${data.user?.id}`);
  }
}

main().catch(console.error);
