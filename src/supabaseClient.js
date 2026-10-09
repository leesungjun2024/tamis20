// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qmbrmmbhcmiglhvsnsve.supabase.co' 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtYnJtbWJoY21pZ2xodnNuc3ZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0ODYyMTksImV4cCI6MjEwNzA2MjIxOX0.txNimg4K5XBLzL7sRsuEGqZKqUxpFu2dA7ze4rXuN1M' // Supabase Anon Key 입력

export const supabase = createClient(supabaseUrl, supabaseKey)