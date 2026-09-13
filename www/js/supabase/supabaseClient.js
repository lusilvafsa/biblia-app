import { createClient } from "https://esm.sh/@supabase/supabase-js@2.116.0";

const SUPABASE_URL = "https://uescntrcecdkonpbkkhc.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_8rMT79XHVmKye5L7g4G05Q_1vUofPO9";

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);
