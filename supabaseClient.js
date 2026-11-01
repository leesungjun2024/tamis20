// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ymiisppfazwbcpfqqxxs.supabase.co' 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltaWlzcHBmYXp3YmNwZnFxeHhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2NjU1NzMsImV4cCI6MjEwODI0MTU3M30.GWMEDIbn0YOhGEX3MZ3KF4s4UF9cjl2avWCRVNvsAJw'  // Supabase Anon Key 입력

export const supabase = createClient(supabaseUrl, supabaseKey)