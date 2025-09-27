import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key'
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_service_key'

// Only create clients if we have valid credentials
export const supabase = supabaseUrl === 'https://placeholder.supabase.co' || supabaseAnonKey === 'placeholder_key'
  ? null
  : createClient(supabaseUrl, supabaseAnonKey)

// Server-side client for admin operations
export const supabaseAdmin = supabaseUrl === 'https://placeholder.supabase.co' || serviceRoleKey === 'placeholder_service_key'
  ? null
  : createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

