// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://eahxnlgjzbxoxooxdxeg.supabase.co' // Supabase 프로젝트 URL 입력
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhaHhubGdqemJ4b3hvb3hkeGVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTExOTQzMzQsImV4cCI6MjEwNjc3MDMzNH0.jKagR4Uj_Tx4jMwzqUsabVISiqkaJOaoF3hvSvfI4Dw' // Supabase Anon Key 입력

export const supabase = createClient(supabaseUrl, supabaseKey)