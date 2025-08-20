 'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function addTransaction(formData: FormData) {
  const supabase = await createClient();

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error('User not authenticated');
  }

  // Validate and extract form data
  const amount = parseFloat(formData.get('amount') as string);
  const category = formData.get('category') as string;
  const description = formData.get('description') as string || '';
  const date = formData.get('date') as string;

  if (!amount || isNaN(amount) || !category || !date) {
    throw new Error('Invalid input');
  }

  // Insert transaction
  const { error } = await supabase.from('transactions').insert({
    user_id: user.id,
    amount,
    category,
    description,
    date,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/transactions', 'layout');
  redirect('/transactions');
} 