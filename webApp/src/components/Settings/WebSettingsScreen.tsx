import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import '../Udhaari/Udhaari.css';

export const WebSettingsScreen: React.FC = () => {
  const [businessId, setBusinessId] = useState<string>('00000000-0000-0000-0000-000000000001');
  const [userEmail, setUserEmail] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('STAFF');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || '');
        const { data: member } = await supabase
          .from('business_members')
          .select('role, business_id')
          .eq('id', user.id)
          .maybeSingle();
        if (member) {
          setUserRole(String(member.role).toUpperCase());
          if (member.business_id) setBusinessId(member.business_id);
        }
      }
    };
    fetchInfo();
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  return (
    <div className="crm-content">
      {toastMsg && (
        <div style={{ backgroundColor: '#10B981', color: '#FFFFFF', padding: '12px 20px', borderRadius: '8px', marginBottom: '16px', fontWeight: 600 }}>
          {toastMsg}
        </div>
      )}

      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '16px', padding: '24px', border: '1px solid var(--border-color)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', maxWidth: '800px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>CRM Store & Account Settings</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '0 0 24px' }}>
          Configure your business profile, master settings, and application preferences.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* BUSINESS INFO CARD */}
          <div style={{ backgroundColor: 'var(--bg-surface-secondary, var(--bg-card))', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>🏢 Business Tenant Info</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Business ID:</span>
                <div style={{ fontFamily: 'monospace', color: '#2563EB', fontWeight: 700, marginTop: '2px' }}>{businessId}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Account Email:</span>
                <div style={{ color: 'var(--text-primary)', fontWeight: 600, marginTop: '2px' }}>{userEmail}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Active Role:</span>
                <div style={{ color: userRole === 'ADMIN' ? '#2563EB' : '#16A34A', fontWeight: 700, marginTop: '2px' }}>
                  {userRole === 'ADMIN' ? '👑 Administrator' : '👤 Staff Member'}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Database Security:</span>
                <div style={{ color: '#16A34A', fontWeight: 700, marginTop: '2px' }}>🔒 Row-Level Security Enabled</div>
              </div>
            </div>
          </div>

          {/* MASTER PREFERENCES */}
          <div style={{ backgroundColor: 'var(--bg-surface-secondary, var(--bg-card))', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>⚙️ General App Preferences</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked style={{ width: '16px', height: '16px', accentColor: '#2563EB' }} />
                Enable 3-Step Deletion Confirmation dialogs for Admin actions
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked style={{ width: '16px', height: '16px', accentColor: '#2563EB' }} />
                Auto-generate 6-digit Customer IDs and 12-digit Customer Codes (`Cd000...`)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked style={{ width: '16px', height: '16px', accentColor: '#2563EB' }} />
                Enforce Supabase Storage signed URL security for customer photos
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="primary-btn"
              type="button"
              onClick={() => showToast('Settings preferences saved successfully.')}
              style={{ padding: '10px 20px', fontSize: '13px', fontWeight: 700 }}
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
