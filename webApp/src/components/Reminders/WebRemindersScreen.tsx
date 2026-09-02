import React, { useState, useMemo, useEffect } from 'react';
import { WebReminder, INITIAL_WEB_REMINDERS } from '../../types/reminders';
import { ReminderModal } from './ReminderModal';
import { SnoozeModal } from './SnoozeModal';
import { DeleteReminderDialog } from './DeleteReminderDialog';
import { supabase } from '../../lib/supabase';
import '../Udhaari/Udhaari.css';

export const WebRemindersScreen: React.FC = () => {
  const [reminders, setReminders] = useState<WebReminder[]>(INITIAL_WEB_REMINDERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // MODALS
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<WebReminder | null>(null);
  const [snoozingReminder, setSnoozingReminder] = useState<WebReminder | null>(null);
  const [deletingReminder, setDeletingReminder] = useState<WebReminder | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // FETCH SUPABASE DATA
  const fetchRemindersFromSupabase = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.from('reminders').select('*');
      if (!error && data && data.length > 0) {
        const mapped: WebReminder[] = data.map((item: any, idx: number) => ({
          id: item.id || `REM-${1000 + idx}`,
          customerId: item.customer_id || '',
          customerName: item.customer_name || 'Customer',
          mobile: item.mobile || '',
          scheduledAt: item.scheduled_at || '2026-08-29 09:00 AM',
          type: item.reminder_type || item.type || 'Call',
          priority: item.priority || 'Normal',
          status: item.status || 'Pending',
          notes: item.notes || '',
          snoozedUntil: item.snoozed_until,
          createdAt: item.created_at || '2026-08-20',
          isOverdue: item.is_overdue || false
        }));
        setReminders(mapped);
      }
    } catch (e) {
      console.log('Supabase reminders read fallback to local state', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRemindersFromSupabase();
  }, []);

  // CALCULATE SUMMARY COUNTS DYNAMICALLY FROM DATA
  const summaryCounts = useMemo(() => {
    const pendingList = reminders.filter((r) => r.status === 'Pending' || r.status === 'Snoozed');
    const todaysCount = pendingList.filter((r) => r.scheduledAt.includes('29 Aug') || r.scheduledAt.includes('2026-08-29') || r.isOverdue).length;
    const thisWeekCount = pendingList.length;
    const totalPendingCount = pendingList.length;

    return {
      todaysPending: todaysCount,
      thisWeekPending: thisWeekCount,
      totalPending: totalPendingCount
    };
  }, [reminders]);

  // REAL-TIME SEARCH & FILTERS
  const filteredReminders = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return reminders.filter((r) => {
      const matchesQuery =
        !q ||
        r.customerName.toLowerCase().includes(q) ||
        (r.customerId && r.customerId.toLowerCase().includes(q)) ||
        r.mobile.includes(q) ||
        r.type.toLowerCase().includes(q) ||
        r.notes.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'All' || r.status.toLowerCase() === statusFilter.toLowerCase();
      const matchesPriority = priorityFilter === 'All' || r.priority.toLowerCase() === priorityFilter.toLowerCase();
      const matchesType = typeFilter === 'All' || r.type.toLowerCase() === typeFilter.toLowerCase();

      return matchesQuery && matchesStatus && matchesPriority && matchesType;
    });
  }, [reminders, searchQuery, statusFilter, priorityFilter, typeFilter]);

  // HANDLERS
  const handleAddClick = () => {
    setEditingReminder(null);
    setIsFormModalOpen(true);
  };

  const handleEditClick = (reminder: WebReminder) => {
    setEditingReminder(reminder);
    setIsFormModalOpen(true);
  };

  const handleMarkDone = async (reminder: WebReminder) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === reminder.id ? { ...r, status: 'Done', isOverdue: false } : r))
    );
    showToast(`Reminder for "${reminder.customerName}" marked as DONE.`);

    try {
      await supabase.from('reminders').update({ status: 'Done', is_overdue: false }).eq('id', reminder.id);
    } catch (e) {
      console.log('Supabase update error', e);
    }
  };

  const handleSnoozeConfirm = async (newDateTime: string) => {
    if (!snoozingReminder) return;
    const targetId = snoozingReminder.id;
    const targetCustomer = snoozingReminder.customerName;

    setReminders((prev) =>
      prev.map((r) =>
        r.id === targetId ? { ...r, status: 'Snoozed', scheduledAt: newDateTime, snoozedUntil: newDateTime, isOverdue: false } : r
      )
    );
    showToast(`Reminder for "${targetCustomer}" snoozed until ${newDateTime}.`);

    try {
      await supabase
        .from('reminders')
        .update({ status: 'Snoozed', scheduled_at: newDateTime, snoozed_until: newDateTime, is_overdue: false })
        .eq('id', targetId);
    } catch (e) {
      console.log('Supabase update error', e);
    }

    setSnoozingReminder(null);
  };

  const handleSaveReminder = async (
    customerName: string,
    mobile: string,
    scheduledAt: string,
    type: string,
    priority: string,
    status: string,
    notes: string,
    customerId?: string
  ) => {
    if (editingReminder) {
      setReminders((prev) =>
        prev.map((r) =>
          r.id === editingReminder.id
            ? { ...r, customerName, mobile, scheduledAt, type, priority, status, notes, customerId }
            : r
        )
      );

      try {
        await supabase
          .from('reminders')
          .update({
            customer_name: customerName,
            mobile,
            scheduled_at: scheduledAt,
            reminder_type: type,
            priority,
            status,
            notes,
            customer_id: customerId
          })
          .eq('id', editingReminder.id);
      } catch (e) {
        console.log('Supabase update error', e);
      }

      showToast(`Reminder for "${customerName}" updated.`);
    } else {
      const nextId = `REM-${1000 + reminders.length + 1}`;
      const newR: WebReminder = {
        id: nextId,
        customerId: customerId || `100${100 + reminders.length}`,
        customerName,
        mobile,
        scheduledAt,
        type,
        priority,
        status,
        notes,
        createdAt: 'Just now'
      };

      setReminders((prev) => [newR, ...prev]);

      try {
        await supabase.from('reminders').insert([
          {
            id: nextId,
            customer_id: newR.customerId,
            customer_name: customerName,
            mobile,
            scheduled_at: scheduledAt,
            reminder_type: type,
            priority,
            status,
            notes
          }
        ]);
      } catch (e) {
        console.log('Supabase insert error', e);
      }

      showToast(`New reminder for "${customerName}" created.`);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingReminder) return;
    const targetId = deletingReminder.id;
    const targetCustomer = deletingReminder.customerName;

    setReminders((prev) => prev.filter((r) => r.id !== targetId));

    try {
      await supabase.from('reminders').delete().eq('id', targetId);
    } catch (e) {
      console.log('Supabase delete error', e);
    }

    showToast(`Reminder for "${targetCustomer}" deleted.`);
    setDeletingReminder(null);
  };

  // EXPORT HANDLERS
  const handleExportCSV = () => {
    const headers = ['ID', 'Customer', 'Mobile', 'Type', 'Priority', 'Status', 'Scheduled At', 'Notes'];
    const rows = filteredReminders.map((r) => [
      r.id,
      `"${r.customerName}"`,
      r.mobile,
      r.type,
      r.priority,
      r.status,
      `"${r.scheduledAt}"`,
      `"${r.notes}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'reminders_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="crm-content">
      <div className="udhaari-container">
        {/* PAGE HEADER */}
        <div className="udhaari-page-header">
          <div>
            <h1 className="udhaari-title-text">Reminders</h1>
            <div className="udhaari-subtitle-text">Track customer follow-ups, calls, visits & payment reminders</div>
          </div>

          <div className="udhaari-header-buttons">
            <button className="btn-secondary-udhaari" onClick={fetchRemindersFromSupabase}>
              Refresh
            </button>
            <button className="btn-secondary-udhaari" onClick={handleExportCSV}>
              Export CSV
            </button>
            <button className="btn-secondary-udhaari" onClick={handlePrint}>
              Print
            </button>
            <button className="btn-primary-udhaari" onClick={handleAddClick}>
              + Add Reminder
            </button>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="udhaari-summary-grid">
          <div className="udhaari-card-box">
            <div className="udhaari-stat-label">TODAY'S PENDING</div>
            <div className="udhaari-stat-value text-red">{summaryCounts.todaysPending}</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Due today, not done</div>
          </div>

          <div className="udhaari-card-box">
            <div className="udhaari-stat-label">THIS WEEK PENDING</div>
            <div className="udhaari-stat-value text-blue">{summaryCounts.thisWeekPending}</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Next 7 days scheduled</div>
          </div>

          <div className="udhaari-card-box">
            <div className="udhaari-stat-label">TOTAL PENDING</div>
            <div className="udhaari-stat-value text-amber">{summaryCounts.totalPending}</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>All open & snoozed reminders</div>
          </div>
        </div>

        {/* TOAST NOTIFICATION */}
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

        {/* SEARCH & FILTERS BAR */}
        <div className="udhaari-card-box" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="items-search-box" style={{ width: '100%', maxWidth: '380px' }}>
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                className="items-search-input"
                placeholder="Search customer, mobile, type or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginRight: '6px' }}>Status:</span>
                <select
                  className="form-control"
                  style={{ width: 'auto', display: 'inline-block', padding: '6px 12px', fontSize: '13px' }}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Done">Done</option>
                  <option value="Snoozed">Snoozed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginRight: '6px' }}>Priority:</span>
                <select
                  className="form-control"
                  style={{ width: 'auto', display: 'inline-block', padding: '6px 12px', fontSize: '13px' }}
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <option value="All">All Priorities</option>
                  <option value="Low">Low</option>
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginRight: '6px' }}>Type:</span>
                <select
                  className="form-control"
                  style={{ width: 'auto', display: 'inline-block', padding: '6px 12px', fontSize: '13px' }}
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="All">All Types</option>
                  <option value="Call">Call</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Visit">Visit</option>
                  <option value="Payment Follow-up">Payment Follow-up</option>
                  <option value="Meeting">Meeting</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* REMINDERS TABLE */}
        <div className="udhaari-card-box" style={{ padding: 0, overflow: 'hidden' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>Loading reminders...</div>
          ) : filteredReminders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: '#64748b' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#334155', margin: 0 }}>No reminders found</h3>
              <p style={{ fontSize: '13px', marginTop: '4px' }}>
                {searchQuery ? `No reminders matching "${searchQuery}"` : 'No reminders scheduled.'}
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="udhaari-table">
                <thead>
                  <tr>
                    <th>WHEN</th>
                    <th>CUSTOMER</th>
                    <th>MOBILE</th>
                    <th>TYPE</th>
                    <th>PRIORITY</th>
                    <th>STATUS</th>
                    <th style={{ textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReminders.map((reminder) => {
                    const isDone = reminder.status === 'Done';
                    return (
                      <tr key={reminder.id}>
                        {/* WHEN & OVERDUE */}
                        <td>
                          <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#0f172a' }}>
                            {reminder.scheduledAt}
                          </div>
                          {reminder.isOverdue && !isDone && (
                            <span
                              style={{
                                backgroundColor: '#fef2f2',
                                color: '#dc2626',
                                fontSize: '10px',
                                fontWeight: 800,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                display: 'inline-block',
                                marginTop: '4px',
                                border: '1px solid #fecaca'
                              }}
                            >
                              ⚠️ OVERDUE
                            </span>
                          )}
                        </td>

                        {/* CUSTOMER */}
                        <td>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{reminder.customerName}</div>
                          {reminder.customerId && (
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>ID: {reminder.customerId}</div>
                          )}
                          {reminder.notes && (
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', fontStyle: 'italic' }}>
                              "{reminder.notes}"
                            </div>
                          )}
                        </td>

                        {/* MOBILE */}
                        <td>
                          <span style={{ fontWeight: 600, color: '#334155' }}>{reminder.mobile}</span>
                        </td>

                        {/* TYPE */}
                        <td>
                          <span className="udhaari-badge badge-settled" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}>
                            {reminder.type}
                          </span>
                        </td>

                        {/* PRIORITY */}
                        <td>
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: 800,
                              backgroundColor:
                                reminder.priority === 'Urgent'
                                  ? '#fee2e2'
                                  : reminder.priority === 'High'
                                  ? '#fff7ed'
                                  : '#f1f5f9',
                              color:
                                reminder.priority === 'Urgent'
                                  ? '#dc2626'
                                  : reminder.priority === 'High'
                                  ? '#c2410c'
                                  : '#475569'
                            }}
                          >
                            {reminder.priority}
                          </span>
                        </td>

                        {/* STATUS */}
                        <td>
                          <span
                            className={`udhaari-badge ${
                              isDone
                                ? 'badge-paid'
                                : reminder.status === 'Snoozed'
                                ? 'badge-pending'
                                : reminder.status === 'Cancelled'
                                ? 'badge-overdue'
                                : 'badge-pending'
                            }`}
                          >
                            {reminder.status}
                          </span>
                        </td>

                        {/* ACTIONS */}
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            {!isDone && (
                              <button
                                className="btn-action-settle"
                                style={{ backgroundColor: '#16a34a', color: '#ffffff' }}
                                onClick={() => handleMarkDone(reminder)}
                                title="Mark as Completed"
                              >
                                ✓ Done
                              </button>
                            )}

                            {!isDone && (
                              <button
                                className="btn-action-settle"
                                style={{ backgroundColor: '#eab308', color: '#ffffff' }}
                                onClick={() => setSnoozingReminder(reminder)}
                                title="Snooze Reminder"
                              >
                                🕒 Snooze
                              </button>
                            )}

                            <a
                              href={`tel:${reminder.mobile}`}
                              className="btn-action-view"
                              style={{ textDecoration: 'none', backgroundColor: '#e0f2fe', color: '#0284c7' }}
                              title="Call Customer"
                            >
                              📞 Call
                            </a>

                            <a
                              href={`https://wa.me/${reminder.mobile.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-action-view"
                              style={{ textDecoration: 'none', backgroundColor: '#dcfce7', color: '#16a34a' }}
                              title="Send WhatsApp"
                            >
                              💬 WhatsApp
                            </a>

                            <button className="btn-action-view" onClick={() => handleEditClick(reminder)}>
                              Edit
                            </button>

                            <button
                              className="btn-action-settle"
                              style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}
                              onClick={() => setDeletingReminder(reminder)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* MODALS */}
        <ReminderModal
          isOpen={isFormModalOpen}
          editingReminder={editingReminder}
          onClose={() => setIsFormModalOpen(false)}
          onSave={handleSaveReminder}
        />

        <SnoozeModal
          isOpen={snoozingReminder !== null}
          reminder={snoozingReminder}
          onClose={() => setSnoozingReminder(null)}
          onSnooze={handleSnoozeConfirm}
        />

        <DeleteReminderDialog
          isOpen={deletingReminder !== null}
          reminder={deletingReminder}
          onClose={() => setDeletingReminder(null)}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </div>
  );
};
