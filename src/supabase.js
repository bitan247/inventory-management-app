import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://hezxbiogzxmktfsceqnc.supabase.co/";
const supabaseKey = "sb_publishable_RsnKEguF6OK35wZwGz3i0w_7YlqvChN";

export const supabase = createClient(supabaseUrl, supabaseKey);
