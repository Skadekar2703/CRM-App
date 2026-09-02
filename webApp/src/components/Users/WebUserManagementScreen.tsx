import React, { useState, useMemo, useEffect } from 'react';
import { WebUser, INITIAL_WEB_USERS } from '../../types/users';
import { UserModal } from './UserModal';
import { DeleteUserDialog } from './DeleteUserDialog';
import { supabase } from '../../lib/supabase';
import '../Udhaari/Udhaari.css';

export const WebUserManagementScreen: React.FC = () => {
  const [users, setUsers] = useState<WebUser[]>(INITIAL_WEB_USERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All Roles');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // MODALS
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<WebUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<WebUser | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // FETCH SUPABASE DATA IF AVAILABLE
  const fetchUsersFromSupabase = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.from('profiles').select('*');
      if (!error && data && data.length > 0) {
        const mapped: WebUser[] = data.map((item: any, idx: number) => ({
          id: item.id ? String(item.id) : `${idx + 1}`,
          username: item.username || item.full_name || 'User',
          email: item.email || 'user@example.com',
          role: (item.role || 'User') === 'Admin' ? 'Admin' : 'User',
          createdAt: item.created_at || 'Jun 12, 2026'
        }));
        setUsers(mapped);
      }
    } catch (e) {
      console.log('Supabase user read fallback to local state', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersFromSupabase();
  }, []);

  // MULTI-CRITERIA FILTERING (KMP SHARED LOGIC RULES)
  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return users.filter((u) => {
      const matchesQ =
        !q ||
        u.id.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q);

      const matchesRole = roleFilter === 'All Roles' || u.role === roleFilter;
      const matchesFrom = !dateFrom || u.createdAt >= dateFrom;
      const matchesTo = !dateTo || u.createdAt <= dateTo;

      return matchesQ && matchesRole && matchesFrom && matchesTo;
    });
  }, [users, searchQuery, roleFilter, dateFrom, dateTo]);

  // PAGINATION LOGIC
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const paginatedUsers = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return filteredUsers.slice(startIdx, startIdx + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  // HANDLERS
  const handleClearFilters = () => {
    setSearchQuery('');
    setRoleFilter('All Roles');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
    showToast('Filters cleared.');
  };

  const handleAddClick = () => {
    setEditingUser(null);
    setIsFormModalOpen(true);
  };

  const handleEditClick = (user: WebUser) => {
    setEditingUser(user);
    setIsFormModalOpen(true);
  };

  const handleSaveUser = async (username: string, email: string, role: 'Admin' | 'User') => {
    if (editingUser) {
      setUsers((prev) =>
        prev.map((u) => (u.id === editingUser.id ? { ...u, username, email, role } : u))
      );

      try {
        await supabase.from('profiles').update({ username, email, role }).eq('id', editingUser.id);
      } catch (e) {
        console.log('Supabase update user error', e);
      }

      showToast(`User account for "${username}" updated.`);
    } else {
      const nextId = `${users.length + 1}`;
      const newUser: WebUser = {
        id: nextId,
        username,
        email,
        role,
        createdAt: '29 Aug 2026'
      };

      setUsers((prev) => [newUser, ...prev]);

      try {
        await supabase.from('profiles').insert([{ id: nextId, username, email, role }]);
      } catch (e) {
        console.log('Supabase insert user error', e);
      }

      showToast(`New user account "${username}" created.`);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    const targetId = deletingUser.id;
    const targetName = deletingUser.username;

    setUsers((prev) => prev.filter((u) => u.id !== targetId));

    try {
      await supabase.from('profiles').delete().eq('id', targetId);
    } catch (e) {
      console.log('Supabase delete user error', e);
    }

    showToast(`User account "${targetName}" deleted.`);
    setDeletingUser(null);
  };

  return (
    <div className="crm-content">
      <div className="udhaari-container">
        {/* PAGE HEADER */}
        <div className="udhaari-page-header">
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Dashboard &rsaquo; Users
            </div>
            <h1 className="udhaari-title-text" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>👥</span> User Management
            </h1>
            <div className="udhaari-subtitle-text">Manage system accounts, administrator privileges & user credentials</div>
          </div>

          <div className="udhaari-header-buttons">
            <button className="btn-secondary-udhaari" onClick={fetchUsersFromSupabase}>
              Refresh
            </button>
            <button className="btn-primary-udhaari" style={{ backgroundColor: '#2563eb' }} onClick={handleAddClick}>
              + Add User
            </button>
          </div>
        </div>

        {/* FILTERS PANEL */}
        <div className="udhaari-card-box" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 12px 0' }}>
            Filters
          </h3>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>DATE FROM:</span>
              <input
                type="date"
                className="form-control"
                style={{ padding: '6px 10px', fontSize: '13px', width: 'auto' }}
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>DATE TO:</span>
              <input
                type="date"
                className="form-control"
                style={{ padding: '6px 10px', fontSize: '13px', width: 'auto' }}
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
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
                <option value="Admin">Admin</option>
                <option value="User">User</option>
              </select>
            </div>

            <button className="btn-secondary-udhaari" onClick={handleClearFilters}>
              Clear All
            </button>
          </div>
        </div>

        {/* TOAST FEEDBACK */}
        {toastMsg && (
          <div
            style={{
              backgroundColor: '#f0fdf4',
              color: '#16a34a',
              padding: '12px 16px',
              borderRadius: '10px',
              fontWeight: 600,
              border: '1px solid #bbf7d0',
              fontSize: '13px'
            }}
          >
            ✓ {toastMsg}
          </div>
        )}

        {/* TOOLBAR & USERS TABLE */}
        <div className="udhaari-card-box" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Show</span>
              <select
                className="form-control"
                style={{ width: 'auto', display: 'inline-block', padding: '6px 12px', fontSize: '13px' }}
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>entries</span>
            </div>

            <div className="items-search-box" style={{ width: '100%', maxWidth: '340px' }}>
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                className="items-search-input"
                placeholder="Search by ID, username, email or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>Loading User Management...</div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: '#64748b' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#334155', margin: 0 }}>No users found</h3>
              <p style={{ fontSize: '13px', marginTop: '4px' }}>No user accounts match your search and filter criteria.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="udhaari-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>USERNAME</th>
                    <th>EMAIL</th>
                    <th>ROLE</th>
                    <th>CREATED</th>
                    <th style={{ textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((user) => (
                    <tr key={user.id}>
                      <td style={{ fontWeight: 700, color: '#2563eb' }}>{user.id}</td>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>{user.username}</td>
                      <td style={{ color: '#475569' }}>{user.email}</td>
                      <td>
                        <span
                          className="udhaari-badge"
                          style={{
                            backgroundColor: user.role === 'Admin' ? '#dcfce7' : '#eff6ff',
                            color: user.role === 'Admin' ? '#16a34a' : '#1d4ed8',
                            fontWeight: 700
                          }}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td style={{ color: '#64748b', fontSize: '13px' }}>{user.createdAt}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button className="btn-action-view" onClick={() => handleEditClick(user)}>
                            Edit
                          </button>
                          <button
                            className="btn-action-settle"
                            style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}
                            onClick={() => setDeletingUser(user)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* PAGINATION FOOTER */}
          {filteredUsers.length > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 20px',
                borderTop: '1px solid #e2e8f0',
                backgroundColor: '#fafafa'
              }}
            >
              <div style={{ fontSize: '13px', color: '#64748b' }}>
                Showing {(currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, filteredUsers.length)} of {filteredUsers.length} entries
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  className="btn-secondary-udhaari"
                  style={{ padding: '4px 12px', fontSize: '12px' }}
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  className="btn-secondary-udhaari"
                  style={{ padding: '4px 12px', fontSize: '12px' }}
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* MODALS */}
        <UserModal
          isOpen={isFormModalOpen}
          editingUser={editingUser}
          onClose={() => setIsFormModalOpen(false)}
          onSave={handleSaveUser}
        />

        <DeleteUserDialog
          isOpen={deletingUser !== null}
          user={deletingUser}
          onClose={() => setDeletingUser(null)}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </div>
  );
};
