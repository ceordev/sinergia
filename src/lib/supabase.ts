import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export interface User {
  id: string;
  display_name: string;
  skills: string[];
  professional_interests: string[];
  hobbies: string[];
  availability: string;
  preferred_mode: 'Afinidad' | 'Reto' | 'Ambos';
  status: 'idle' | 'searching' | 'matched' | 'in-chat';
  current_match_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  mode: 'Afinidad' | 'Reto';
  status: 'pending' | 'accepted' | 'rejected' | 'active' | 'ended';
  chat_id: string | null;
  generated_topic: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  text: string;
  created_at: string;
}
