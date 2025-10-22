"use client";
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import PageHeader from '@/components/PageHeader';
import Link from 'next/link';

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const [message, setMessage] = useState('');
  const [settings, setSettings] = useState({
    email_notifications: true,
    marketplace_notifications: true,
    order_notifications: true,
  });

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    setMessage('✅ Updated');
    setTimeout(() => setMessage(''), 2000);
  };

  if (authLoading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <PageHeader title="⚙️ Settings" />

      {/* Notifications */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-bold mb-4">🔔 Notifications</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-gray-500">Receive email updates</p>
            </div>
            <input
              type="checkbox"
              checked={settings.email_notifications}
              onChange={() => handleToggle('email_notifications')}
              className="w-5 h-5 text-blue-600 rounded"
            />
          </div>

          <div className="border-t pt-4 flex items-center justify-between">
            <div>
              <p className="font-medium">Marketplace Notifications</p>
              <p className="text-sm text-gray-500">New listings updates</p>
            </div>
            <input
              type="checkbox"
              checked={settings.marketplace_notifications}
              onChange={() => handleToggle('marketplace_notifications')}
              className="w-5 h-5 text-blue-600 rounded"
            />
          </div>

          <div className="border-t pt-4 flex items-center justify-between">
            <div>
              <p className="font-medium">Order Notifications</p>
              <p className="text-sm text-gray-500">Order and purchase updates</p>
            </div>
            <input
              type="checkbox"
              checked={settings.order_notifications}
              onChange={() => handleToggle('order_notifications')}
              className="w-5 h-5 text-blue-600 rounded"
            />
          </div>
        </div>
      </div>

      {/* Account */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-bold mb-4">� Account</h2>
        
        <Link href="/profile">
          <div className="p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
            <p className="font-medium">Edit Profile</p>
            <p className="text-sm text-gray-500">Update username and full name</p>
          </div>
        </Link>
      </div>

      {/* Message */}
      {message && (
        <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
          {message}
        </div>
      )}
    </div>
  );
}
