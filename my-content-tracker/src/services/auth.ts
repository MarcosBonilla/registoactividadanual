// src/services/auth.ts

import { supabase } from './supabaseClient'

export const signUp = async (email: string, password: string) => {
  const { user, error } = await supabase.auth.signUp({
    email,
    password,
  })
  if (error) throw error
  return user
}

export const signIn = async (email: string, password: string) => {
  const { user, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
  return user
}

export const signOut = async () => {
  await supabase.auth.signOut()
}
