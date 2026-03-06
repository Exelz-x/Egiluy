import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { roblox_user_id, product_name } = req.body;

  if (!roblox_user_id || !product_name) {
    return res.status(400).json({ whitelisted: false });
  }

  // Cek apakah user memiliki license yang aktif untuk produk ini
  const { data: license, error } = await supabase
    .from('licenses')
    .select('id')
    .eq('roblox_user_id', String(roblox_user_id))
    .eq('product_name', product_name)
    .eq('is_activated', true)
    .single();

  if (error || !license) {
    return res.status(200).json({ whitelisted: false });
  }

  return res.status(200).json({ whitelisted: true });
}