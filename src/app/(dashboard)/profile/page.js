"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import PageHeader from '@/components/PageHeader';
import Link from 'next/link';

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

  const handleSave = async ()=>{
    try{
      setMessage('');
      await supabase.from('profiles').upsert({ 
        id: user.id, 
        username: profile.username, 
        full_name: profile.full_name, 
        avatar_url: profile.avatar_url
      });
      setMessage('✅ Profile saved');
    }catch(err){ 
      console.error(err); 
      setMessage('❌ Save failed: ' + err.message);
    }
  };

  if (authLoading || loading) return <div className="p-8">Loading profile...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <PageHeader title="👤 Profile Management" />
        <Link href="/settings" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium">
          ⚙️ Settings
        </Link>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold mb-6">Edit Profile Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Avatar Section */}
          <div className="md:col-span-1">
            <label className="block font-semibold mb-3">Profile Picture</label>
            <div className="flex flex-col items-center">
              {profile.avatar_url && (
                <img src={profile.avatar_url} alt="avatar" className="w-32 h-32 rounded-full mb-3 object-cover border-4 border-gray-200" />
              )}
              {!profile.avatar_url && (
                <div className="w-32 h-32 rounded-full mb-3 bg-gray-200 flex items-center justify-center text-gray-400 border-4 border-gray-200">
                  <span className="text-3xl">👤</span>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2 text-center">Profile picture managed by system</p>
            </div>
          </div>

          {/* User Info Section */}
          <div className="md:col-span-2 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Username</label>
              <input 
                value={profile.username} 
                onChange={e=>setProfile({...profile, username: e.target.value})} 
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your username"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
              <input 
                value={profile.full_name} 
                onChange={e=>setProfile({...profile, full_name: e.target.value})} 
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your full name"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button 
            onClick={handleSave} 
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            💾 Save Changes
          </button>
        </div>
      </div>

      {/* Wallet Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">🔐 Wallet Information</h2>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-blue-900 mb-3">
            <strong>ℹ️ System-Managed Custodial Wallet</strong>
          </p>
          <p className="text-xs text-blue-800">
            Your wallet is securely managed by CreativeChain. You can view your wallet address below, but cannot modify it. This ensures your assets remain safe and secure.
          </p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Wallet Address</label>
          <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 break-all font-mono text-sm">
            {profile.wallet_address || '⏳ No wallet address assigned yet'}
          </div>
          <p className="text-xs text-gray-500 mt-2">💡 This wallet receives your royalties and license earnings</p>
        </div>
      </div>

      {/* Bank Configuration */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">🏦 Bank Account Configuration</h2>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-amber-900">
            <strong>ℹ️ Managed by Administrator</strong>
          </p>
          <p className="text-xs text-amber-800 mt-1">
            Your bank account details are configured and managed by the platform administrator. Contact support if you need to update this information.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Bank Name</label>
            <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-700">
              {bank.bank_name || 'Not configured'}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Account Number</label>
            <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 font-mono">
              {bank.account_number || 'Not configured'}
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Message */}
      {message && (
        <div className={`p-4 rounded-lg border ${
          message.includes('✅') 
            ? 'bg-green-50 border-green-200 text-green-700' 
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
}
