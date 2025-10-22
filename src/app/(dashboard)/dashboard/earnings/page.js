"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import PageHeader from '@/components/PageHeader';

export default function EarningsPage(){
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [balance, setBalance] = useState(0);
  const [rows, setRows] = useState([]);

  const creatorId = user?.id;

  useEffect(()=>{
    const fetchEarnings = async ()=>{
      try{
        setLoading(true);
        setError('');
        if (!creatorId) return;
        const { data: works } = await supabase.from('creative_works').select('id').eq('creator_id', creatorId);
        const workIds = (works||[]).map(w=>w.id);
        if (workIds.length === 0) { setBalance(0); setRows([]); return; }
        const { data: licenses } = await supabase.from('licenses').select('*').in('work_id', workIds);
        const total = (licenses||[]).reduce((s,l)=>s+Number(l.price_bidr||0),0);
        setBalance(total);
        setRows(licenses||[]);
      }catch(err){
        console.error(err);
        setError('Failed to load earnings');
      }finally{setLoading(false);}    };
    if (!authLoading) fetchEarnings();
  },[creatorId, authLoading]);

  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState('');

  if (loading) return <div className="p-8">Loading earnings...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="p-8">
      <PageHeader title="Earnings" subtitle="Overview and withdrawals" />
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-500">Available Balance (USDT)</div>
          <div className="text-2xl font-bold">{balance.toFixed(2)}</div>
        </div>
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-500">Pending Withdrawals</div>
          <div className="text-2xl font-bold">0.00</div>
        </div>
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-500">Total Paid</div>
          <div className="text-2xl font-bold">0.00</div>
        </div>
      </div>

      <div className="mb-6">
        <button onClick={()=>setShowWithdraw(true)} className="px-4 py-2 bg-green-600 text-white rounded">Withdraw</button>
      </div>

      {showWithdraw && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow max-w-md w-full">
            <h3 className="text-lg font-semibold mb-2">Request Withdrawal</h3>
            <p className="text-sm text-gray-600 mb-4">Available: {balance.toFixed(2)} USDT</p>
            <input type="number" step="0.01" placeholder="Amount (USDT)" value={withdrawAmount} onChange={e=>setWithdrawAmount(e.target.value)} className="w-full p-2 border rounded mb-3" />
            <select className="w-full p-2 border rounded mb-3">
              <option value="">Select bank/account</option>
            </select>
            <div className="flex gap-2 justify-end">
              <button onClick={()=>setShowWithdraw(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
              <button onClick={async ()=>{
                setWithdrawLoading(true); setWithdrawMsg('');
                const amt = Number(withdrawAmount);
                if (!creatorId){ setWithdrawMsg('Not authenticated'); setWithdrawLoading(false); return; }
                if (!amt || amt<=0 || amt>balance){ setWithdrawMsg('Invalid amount'); setWithdrawLoading(false); return; }
                try{
                  const { error } = await supabase.from('withdrawals').insert([{ user_id: creatorId, amount: amt, currency: 'USDT', status: 'pending', requested_at: new Date().toISOString() }]);
                  if (error) throw error;
                  setWithdrawMsg('Withdrawal requested');
                  setShowWithdraw(false);
                }catch(err){ console.error(err); setWithdrawMsg('Failed to request withdrawal'); }
                setWithdrawLoading(false);
              }} className="px-4 py-2 bg-blue-600 text-white rounded">{withdrawLoading? 'Requesting...' : 'Request Withdraw'}</button>
            </div>
            {withdrawMsg && <p className="mt-3 text-sm">{withdrawMsg}</p>}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-2">Earnings Details</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (USDT)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rows.map(r=> (
                <tr key={r.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(r.purchased_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.work_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{Number(r.price_bidr||0).toFixed(2)}</td>
                </tr>
              ))}
              {rows.length===0 && (
                <tr><td colSpan={3} className="px-6 py-4 text-center text-gray-500">No earnings yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
