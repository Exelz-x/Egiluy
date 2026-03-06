import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // Service key hanya ada di server, AMAN
);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { license_key, roblox_user_id } = req.body;

  if (!license_key || !roblox_user_id) {
    return res.status(400).json({ success: false, message: 'License key dan Roblox User ID diperlukan.' });
  }

  // Cari license key di database
  const { data: license, error } = await supabase
    .from('licenses')
    .select('*')
    .eq('license_key', license_key)
    .single();

  if (error || !license) {
    return res.status(404).json({ success: false, message: 'License key tidak ditemukan.' });
  }

  if (license.is_activated) {
    // Cek apakah user yang sama mencoba aktivasi ulang
    if (license.roblox_user_id === String(roblox_user_id)) {
      return res.status(200).json({
        success: false,
        message: 'License key sudah diaktivasi oleh akun ini sebelumnya.',
        already_activated: true
      });
    }
    return res.status(400).json({ success: false, message: 'License key sudah digunakan oleh user lain.' });
  }

  // Aktivasi license key - simpan roblox_user_id
  const { error: updateError } = await supabase
    .from('licenses')
    .update({
      is_activated: true,
      roblox_user_id: String(roblox_user_id),
      activated_at: new Date().toISOString()
    })
    .eq('license_key', license_key);

  if (updateError) {
    return res.status(500).json({ success: false, message: 'Gagal mengaktivasi license.' });
  }

  return res.status(200).json({
    success: true,
    message: 'License Key Berhasil di Aktivasi!',
    product_name: license.product_name,
    badge_id: license.badge_id
  });
}