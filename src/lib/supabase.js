// ============================================================
// Care-Giver Sync — Supabase Client (React Native)
// Ganti SUPABASE_URL dan SUPABASE_ANON_KEY
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://yokjbynjifkrsqmvijor.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlva2pieW5qaWZrcnNxbXZpam9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMDM4MDEsImV4cCI6MjA5Nzg3OTgwMX0.iwt8HYTXDoefBS_aSKSVPrtEHjZDp4zFU0gSzQ6vKMU'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

export async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data
}
