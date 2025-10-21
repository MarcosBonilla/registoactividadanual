// src/services/auth.ts

import { supabase } from './supabaseClient'

export const signUp = async (email: string, password: string) => {
  const res = await supabase.auth.signUp({ email, password });
  if (res.error) throw res.error;
  return res.data?.user ?? null;
}

export const signIn = async (email: string, password: string) => {
  const res = await supabase.auth.signInWithPassword({ email, password });
  if (res.error) throw res.error;
  return res.data?.user ?? null;
}

export const signOut = async () => {
  await supabase.auth.signOut()
}
