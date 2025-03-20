import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: { 'x-application-name': 'gugu-frontend' },
  },
  // Increase timeout and add retries
  realtime: {
    timeout: 30000,
    retries: 5,
  },
  // Add storage configuration
  storage: {
    maxFileSize: 5242880, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif'],
  }
})