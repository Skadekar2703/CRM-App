import React, { useState, useMemo, useEffect } from 'react';
import { WebUser } from '../../types/users';
import { UserModal } from './UserModal';
import { supabase } from '../../lib/supabase';
import '../Udhaari/Udhaari.css';

export const WebUserManagementScreen: React.FC = () => {
  const [users, setUsers] = useState<WebUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All Roles');
  const [pageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // MODALS
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<WebUser | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // FETCH BUSINESS MEMBERS FROM SUPABASE
  const fetchUsersFromSupabase = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.from('business_members').select('*').order('created_at', { ascending: true });
      if (!error && data) {
        const mapped: WebUser[] = data.map((item: any) => ({
          id: String(item.id),
          username: item.username || 'User',
          email: `${item.username}@business.crm`,
          role: String(item.role).toUpperCase() === 'ADMIN' ? 'ADMIN' : 'STAFF',
          status: item.status === 'Disabled' ? 'Disabled' : 'Active',
          createdAt: item.created_at ? new Date(item.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '02 Sep 2026'
        }));
        setUsers(mapped);
      }
    } catch (e) {
      console.log('Supabase user read error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersFromSupabase();
  }, []);

  // MULTI-CRITERIA FILTERING
  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return users.filter((u) => {
      const matchesQ =
        !q ||
        u.id.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q);

      const matchesRole = roleFilter === 'All Roles' || String(u.role).toUpperCase() === roleFilter.toUpperCase();
      return matchesQ && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  // PAGINATION LOGIC
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const paginatedUsers = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return filteredUsers.slice(startIdx, startIdx + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  const handleAddClick = () => {
    setEditingUser(null);
    setIsFormModalOpen(true);
  };

  const handleEditClick = (user: WebUser) => {
    setEditingUser(user);
    setIsFormModalOpen(true);
  };

  const handleToggleStatus = async (user: WebUser) => {
    const newStatus = user.status === 'Active' ? 'Disabled' : 'Active';
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const { data, error } = await supabase.functions.invoke('manage-staff', {
        body: { action: 'TOGGLE_STATUS', userId: user.id, status: newStatus },
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (error || data?.error) {
        showToast(`Error: ${data?.error || error?.message || 'Failed to update user status'}`);
        return;
      }

      showToast(`User "${user.username}" is now ${newStatus}.`);
      fetchUsersFromSupabase();
    } catch (e: any) {
      showToast(`Status update failed: ${e.message}`);
    }
  };

  const handleSaveUser = async (username: string, role: 'ADMIN' | 'STAFF', password?: string) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    if (editingUser) {
      // CHANGE PASSWORD / UPDATE ROLE
      if (password && password.trim()) {
        const { data, error } = await supabase.functions.invoke('manage-staff', {
          body: { action: 'CHANGE_PASSWORD', userId: editingUser.id, password: password.trim() },
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        if (error || data?.error) {
          showToast(`Error: ${data?.error || error?.message || 'Failed to change password'}`);
          return;
        }
      }

      // Update Role in business_members
      await supabase.from('business_members').update({ role }).eq('id', editingUser.id);
      showToast(`Account "${username}" updated.`);
      fetchUsersFromSupabase();
    } else {
      // CREATE NEW STAFF ACCOUNT
      const { data, error } = await supabase.functions.invoke('manage-staff', {
        body: { action: 'CREATE_STAFF', username, password, role },
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (error || data?.error) {
        showToast(`Error: ${data?.error || error?.message || 'Failed to create staff user'}`);
        return;
      }

      showToast(`Staff account "${username}" created successfully.`);
      fetchUsersFromSupabase();
    }
  };

  return (
    <div className="crm-content">
      <div className="udhaari-container">
        {/* TOAST NOTIFICATION */}
        {toastMsg && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            zIndex: 9999,
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            {toastMsg}
          </div>
        )}

        {/* PAGE HEADER */}
        <div className="udhaari-page-header">
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Dashboard &rsaquo; Users
            </div>
            <h1 className="udhaari-title-text" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>👥</span> User & Staff Management
            </h1>
            <div className="udhaari-subtitle-text">Manage business staff accounts, admin privileges & password credentials</div>
          </div>

          <div className="udhaari-header-buttons">
            <button className="btn-secondary-udhaari" onClick={fetchUsersFromSupabase}>
              Refresh
            </button>
            <button className="btn-primary-udhaari" style={{ backgroundColor: '#2563eb' }} onClick={handleAddClick}>
              + Create Staff / User
            </button>
          </div>
        </div>

        {/* FILTERS PANEL */}
        <div className="udhaari-card-box" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: '220px' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search username or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>ROLE:</span>
              <select
                className="form-control"
                style={{ padding: '6px 12px', fontSize: '13px', width: 'auto' }}
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="All Roles">All Roles</option>
                <option value="ADMIN">ADMIN</option>
                <option value="STAFF">STAFF</option>
              </select>
            </div>
          </div>
        </div>

        {/* TABLE DISPLAY */}
        <div className="udhaari-card-box" style={{ marginTop: '20px', padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="udhaari-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '30px' }}>Loading business users...</td>
                  </tr>
                ) : paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>No users found matching filter.</td>
                  </tr>
                ) : (
                  paginatedUsers.map((u) => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>{u.username}</td>
                      <td>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 700,
                          backgroundColor: u.role === 'ADMIN' ? '#EFF6FF' : '#F1F5F9',
                          color: u.role === 'ADMIN' ? '#2563EB' : '#475569'
                        }}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 700,
                          backgroundColor: u.status === 'Active' ? '#F0FDF4' : '#FEF2F2',
                          color: u.status === 'Active' ? '#16A34A' : '#DC2626'
                        }}>
                          {u.status}
                        </span>
                      </td>
                      <td style={{ color: '#64748b', fontSize: '13px' }}>{u.createdAt}</td>
                      <td style={{ textAlign: 'right' }}>
                        {u.role === 'ADMIN' ? (
                          <span style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            color: '#64748b',
                            backgroundColor: '#f1f5f9',
                            borderRadius: '6px',
                            fontWeight: 600
                          }}>
                            Admin Account
                          </span>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEditClick(u)}
                              style={{
                                padding: '6px 12px',
                                marginRight: '8px',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                backgroundColor: '#ffffff',
                                color: '#2563eb',
                                fontWeight: 600,
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                            >
                              Change Password
                            </button>
                            <button
                              onClick={() => handleToggleStatus(u)}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                backgroundColor: u.status === 'Active' ? '#fef2f2' : '#f0fdf4',
                                color: u.status === 'Active' ? '#dc2626' : '#16a34a',
                                fontWeight: 600,
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                            >
                              {u.status === 'Active' ? 'Disable' : 'Enable'}
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '13px', color: '#64748b' }}>
              Showing {paginatedUsers.length} of {filteredUsers.length} users
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="btn-secondary-udhaari"
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                Previous
              </button>
              <span style={{ padding: '6px 12px', fontSize: '13px', fontWeight: 600 }}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="btn-secondary-udhaari"
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* CREATE / EDIT MODAL */}
        <UserModal
          isOpen={isFormModalOpen}
          editingUser={editingUser}
          onClose={() => setIsFormModalOpen(false)}
          onSave={handleSaveUser}
        />
      </div>
    </div>
  );
};
