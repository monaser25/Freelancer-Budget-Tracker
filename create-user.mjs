import { createClient } from '@supabase/supabase-js';

const required = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
};

const SUPABASE_URL = required('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = required('SUPABASE_SERVICE_ROLE_KEY');
const email = required('QA_USER_EMAIL');
const password = required('QA_USER_PASSWORD');

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
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
