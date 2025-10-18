"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import PageHeader from '@/components/PageHeader';

export default function ProfilePage(){
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({ username: '', full_name: '', avatar_url: '', wallet_address: '' });
  const [bank, setBank] = useState({ bank_name: '', account_number: '', account_name: '' });
  const [message, setMessage] = useState('');

  useEffect(()=>{
    const load = async ()=>{
      if (!user) return setLoading(false);
      try{
        setLoading(true);
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) setProfile({ username: data.username||'', full_name: data.full_name||'', avatar_url: data.avatar_url||'', wallet_address: data.wallet_address||'' });
        const { data: wallets } = await supabase.from('custodial_wallets').select('*').eq('user_id', user.id);
        if (wallets && wallets[0]) setBank({ bank_name: wallets[0].blockchain||'', account_number: wallets[0].wallet_address||'', account_name: '' });
      }catch(err){console.error(err);}finally{setLoading(false);}    };
    if (!authLoading) load();
  },[user, authLoading]);

  const handleAvatar = async (e)=>{
    const file = e.target.files?.[0]; if (!file) return;
    const filePath = `${user.id}/avatar-${Date.now()}`;
    const { error: upErr } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
    if (upErr){ setMessage('Upload failed'); return; }
    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    setProfile(p=>({ ...p, avatar_url: data.publicUrl }));
    setMessage('Avatar uploaded');
  };

  const handleSave = async ()=>{
    try{
      setMessage('');
      await supabase.from('profiles').upsert({ id: user.id, username: profile.username, full_name: profile.full_name, avatar_url: profile.avatar_url, wallet_address: profile.wallet_address });
      setMessage('Profile saved');
    }catch(err){ console.error(err); setMessage('Save failed'); }
  };

  if (authLoading || loading) return <div className="p-8">Loading profile...</div>;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <PageHeader title="Profile" />
      <div className="mb-4">
        <label className="block mb-1">Avatar</label>
        {profile.avatar_url && <img src={profile.avatar_url} alt="avatar" className="w-24 h-24 rounded-full mb-2" />}
        <input type="file" accept="image/*" onChange={handleAvatar} />
      </div>

      <div className="mb-4">
        <label className="block mb-1">Username</label>
        <input value={profile.username} onChange={e=>setProfile({...profile, username: e.target.value})} className="w-full p-2 border rounded" />
      </div>

      <div className="mb-4">
        <label className="block mb-1">Full name</label>
        <input value={profile.full_name} onChange={e=>setProfile({...profile, full_name: e.target.value})} className="w-full p-2 border rounded" />
      </div>

      <div className="mb-4">
        <label className="block mb-1">Wallet address</label>
        <input value={profile.wallet_address} onChange={e=>setProfile({...profile, wallet_address: e.target.value})} className="w-full p-2 border rounded" />
      </div>

      <div className="mb-4">
        <h2 className="font-semibold mb-2">Bank configuration</h2>
        <input placeholder="Bank name" value={bank.bank_name} onChange={e=>setBank({...bank, bank_name: e.target.value})} className="w-full p-2 border rounded mb-2" />
        <input placeholder="Account number" value={bank.account_number} onChange={e=>setBank({...bank, account_number: e.target.value})} className="w-full p-2 border rounded mb-2" />
        <input placeholder="Account name" value={bank.account_name} onChange={e=>setBank({...bank, account_name: e.target.value})} className="w-full p-2 border rounded" />
      </div>

      <div className="flex gap-2">
        <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded">Save Profile</button>
        <button className="px-4 py-2 bg-gray-200 rounded">Change Password</button>
      </div>

      {message && <p className="mt-4">{message}</p>}
    </div>
  );
}
