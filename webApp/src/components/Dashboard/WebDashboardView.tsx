import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import './WebDashboard.css';

interface WebDashboardViewProps {
  onSelectSection?: (section: string) => void;
}

export const WebDashboardView: React.FC<WebDashboardViewProps> = ({ onSelectSection }) => {
  const [totalBaki, setTotalBaki] = useState<number>(0);
  const [totalJama, setTotalJama] = useState<number>(0);
  const [todayUdhar, setTodayUdhar] = useState<number>(0);
  const [todayJama, setTodayJama] = useState<number>(0);
  const [pendingChequesCount, setPendingChequesCount] = useState<number>(0);
  const [urgentNotesCount, setUrgentNotesCount] = useState<number>(0);
  const [daagMoveCount, setDaagMoveCount] = useState<number>(0);

  const [topDebtors, setTopDebtors] = useState<Array<{ id: string; name: string; area: string; amount: number; mobile: string; status: string; lastPayment: string }>>([]);
  const [notes, setNotes] = useState<Array<{ id: string; title: string; content: string; priority: string; created_at: string }>>([]);
  const [reminders, setReminders] = useState<Array<{ id: string; title: string; due_date: string; status: string }>>([]);
  const [transactions, setTransactions] = useState<Array<{ id: string; customer_name: string; type: string; amount: number; date: string }>>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const todayStr = new Date().toISOString().split('T')[0];

      // 1. All Udhaari transactions for Total Baki, Total Jama, Today's Udhaar, Today's Jama
      const { data: udhaariData, error: udhErr } = await supabase
        .from('udhaari')
        .select('*')
        .order('created_at', { ascending: false });

      if (udhErr) throw udhErr;

      let bSum = 0;
      let jSum = 0;
      let tUdhar = 0;
      let tJama = 0;

      if (udhaariData && udhaariData.length > 0) {
        udhaariData.forEach((u: any) => {
          const amt = Number(u.amount || 0);
          const uDate = u.date ? u.date.split('T')[0] : (u.created_at ? u.created_at.split('T')[0] : '');

          if (u.type === 'Udhaar' || u.type === 'Baki') {
            bSum += amt;
            if (uDate === todayStr) {
              tUdhar += amt;
            }
          } else if (u.type === 'Jama') {
            jSum += amt;
            if (uDate === todayStr) {
              tJama += amt;
            }
          }
        });

        setTransactions(udhaariData.slice(0, 5).map((u: any) => ({
          id: u.id,
          customer_name: u.customer_name || 'Customer',
          type: u.type || 'Udhaar',
          amount: Number(u.amount || 0),
          date: u.date ? new Date(u.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'
        })));
      } else {
        setTransactions([]);
      }

      setTotalBaki(bSum);
      setTotalJama(jSum);
      setTodayUdhar(tUdhar);
      setTodayJama(tJama);

      // 2. Customers for Top Baki Table
      const { data: custData } = await supabase
        .from('customers')
        .select('*');

      if (custData && custData.length > 0) {
        const debtors: Array<{ id: string; name: string; area: string; amount: number; mobile: string; status: string; lastPayment: string }> = [];

        custData.forEach((c: any) => {
          const rawBaki = Number(c.baki || 0);
          if (rawBaki > 0) {
            debtors.push({
              id: c.id,
              name: c.name || 'Unnamed Customer',
              area: c.area || 'General Market',
              amount: rawBaki,
              mobile: c.mobile || c.phone || 'N/A',
              status: rawBaki > 20000 ? 'Overdue' : 'Pending',
              lastPayment: c.updated_at ? new Date(c.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Recent'
            });
          }
        });

        debtors.sort((a, b) => b.amount - a.amount);
        setTopDebtors(debtors.slice(0, 5));
      } else {
        setTopDebtors([]);
      }

      // 3. Pending Cheques
      const { data: chequeData } = await supabase
        .from('cheques')
        .select('*');

      if (chequeData && chequeData.length > 0) {
        const pending = chequeData.filter((c: any) => c.status === 'Pending' || c.status === 'Overdue');
        setPendingChequesCount(pending.length);
      } else {
        setPendingChequesCount(0);
      }

      // 4. Urgent Notes
      const { data: notesData } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });

      if (notesData && notesData.length > 0) {
        const urgent = notesData.filter((n: any) => n.priority === 'High' || n.is_pinned || n.is_urgent);
        setUrgentNotesCount(urgent.length);
        setNotes(urgent.slice(0, 3));
      } else {
        setUrgentNotesCount(0);
        setNotes([]);
      }

      // 5. Today's Reminders
      const { data: remindersData } = await supabase
        .from('reminders')
        .select('*')
        .order('due_date', { ascending: true });

      if (remindersData && remindersData.length > 0) {
        const todayReminders = remindersData.filter((r: any) => {
          if (!r.due_date) return false;
          return r.due_date.split('T')[0] === todayStr;
        });
        setReminders(todayReminders);
      } else {
        setReminders([]);
      }

      // 6. Daag Movement
      const { data: daagData } = await supabase
        .from('daag')
        .select('*');

      if (daagData) {
        setDaagMoveCount(daagData.length);
      } else {
        setDaagMoveCount(0);
      }

    } catch (e: any) {
      console.error('Error loading dashboard data:', e);
      setErrorMsg(e.message || 'Unable to load live dashboard data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigate = (section: string) => {
    if (onSelectSection) {
      onSelectSection(section);
    } else {
      window.location.hash = section.toLowerCase();
    }
  };

  if (isLoading) {
    return (
      <div className="crm-content">
        <div className="dashboard-loading-box">
          <div className="spinner"></div>
          <p style={{ marginTop: '12px', fontWeight: 600, color: '#64748B' }}>Loading real-time CRM ledger data...</p>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="crm-content">
        <div className="dashboard-error-box">
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#DC2626', marginBottom: '8px' }}>⚠️ Unable to load data</div>
          <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '16px' }}>{errorMsg}</p>
          <button className="primary-btn" onClick={loadDashboardData} style={{ padding: '8px 18px' }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="crm-content">
      {/* HEADER / LIVE SYSTEM SYNC BAR */}
      <div className="stitch-dashboard-subbar">
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>BUSINESS SNAPSHOT</h2>
          <span style={{ fontSize: '12px', color: '#64748B' }}>Real-time ledger, daily balance and collection summary</span>
        </div>
        <div className="live-badge">
          <span className="dot"></span> Live System Synced
        </div>
      </div>

      {/* SUMMARY METRICS GRID (7 CARDS REQUIRED IN EXACT ORDER) */}
      <div className="stitch-metrics-grid">
        {/* 1. TOTAL BAKI */}
        <div className="stitch-metric-card" onClick={() => handleNavigate('Customers')} style={{ cursor: 'pointer' }}>
          <div className="metric-header">
            <span className="metric-title">TOTAL BAKI</span>
            <span className="metric-badge red">Receivable</span>
          </div>
          <div className="metric-value red-text">₹{totalBaki.toLocaleString('en-IN')}</div>
          <div className="metric-sub">Sum of all Baki</div>
        </div>

        {/* 2. TOTAL JAMA */}
        <div className="stitch-metric-card" onClick={() => handleNavigate('Customers')} style={{ cursor: 'pointer' }}>
          <div className="metric-header">
            <span className="metric-title">TOTAL JAMA</span>
            <span className="metric-badge green">Received</span>
          </div>
          <div className="metric-value green-text">₹{totalJama.toLocaleString('en-IN')}</div>
          <div className="metric-sub">Sum of all Jama</div>
        </div>

        {/* 3. TODAY'S UDHAAR */}
        <div className="stitch-metric-card" onClick={() => handleNavigate('Udhaari')} style={{ cursor: 'pointer' }}>
          <div className="metric-header">
            <span className="metric-title">TODAY'S UDHAAR</span>
            <span className="metric-badge blue">Credit</span>
          </div>
          <div className="metric-value">₹{todayUdhar.toLocaleString('en-IN')}</div>
          <div className="metric-sub">Given Today</div>
        </div>

        {/* 4. TODAY'S JAMA */}
        <div className="stitch-metric-card" onClick={() => handleNavigate('Udhaari')} style={{ cursor: 'pointer' }}>
          <div className="metric-header">
            <span className="metric-title">TODAY'S JAMA</span>
            <span className="metric-badge green">Jama</span>
          </div>
          <div className="metric-value green-text">₹{todayJama.toLocaleString('en-IN')}</div>
          <div className="metric-sub">Received Today</div>
        </div>

        {/* 5. CHEQUES */}
        <div className="stitch-metric-card" onClick={() => handleNavigate('Cheques')} style={{ cursor: 'pointer' }}>
          <div className="metric-header">
            <span className="metric-title">CHEQUES</span>
            <span className="metric-badge yellow">Pending</span>
          </div>
          <div className="metric-value">{pendingChequesCount}</div>
          <div className="metric-sub">Pending Clearance</div>
        </div>

        {/* 6. URGENT NOTES */}
        <div className="stitch-metric-card" onClick={() => handleNavigate('Notepad')} style={{ cursor: 'pointer' }}>
          <div className="metric-header">
            <span className="metric-title">URGENT NOTES</span>
            <span className="metric-badge red">High</span>
          </div>
          <div className="metric-value">{urgentNotesCount}</div>
          <div className="metric-sub">Pinned Notes</div>
        </div>

        {/* 7. DAAG MOVE */}
        <div className="stitch-metric-card" onClick={() => handleNavigate('Daag')} style={{ cursor: 'pointer' }}>
          <div className="metric-header">
            <span className="metric-title">DAAG MOVE</span>
            <span className="metric-badge blue">Dispatched</span>
          </div>
          <div className="metric-value">{daagMoveCount}</div>
          <div className="metric-sub">Stock Records</div>
        </div>
      </div>

      {/* FOUR PRIMARY SHORTCUTS */}
      <div className="stitch-shortcuts-grid">
        <div className="stitch-shortcut-btn shortcut-customer" onClick={() => handleNavigate('Customers')}>
          <div className="shortcut-icon-circle green">
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <div>
            <div className="shortcut-title">+ Customer</div>
            <div className="shortcut-sub">Add new party</div>
          </div>
        </div>

        <div className="stitch-shortcut-btn shortcut-udhar" onClick={() => handleNavigate('Udhaari')}>
          <div className="shortcut-icon-circle red">
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <div>
            <div className="shortcut-title">+ Udhar</div>
            <div className="shortcut-sub">Debit / Give credit</div>
          </div>
        </div>

        <div className="stitch-shortcut-btn shortcut-jama" onClick={() => handleNavigate('Udhaari')}>
          <div className="shortcut-icon-circle emerald">
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="shortcut-title">+ Jama</div>
            <div className="shortcut-sub">Credit / Receive payment</div>
          </div>
        </div>

        <div className="stitch-shortcut-btn shortcut-daag" onClick={() => handleNavigate('Daag')}>
          <div className="shortcut-icon-circle blue">
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8" />
            </svg>
          </div>
          <div>
            <div className="shortcut-title">+ Daag</div>
            <div className="shortcut-sub">Record stock dispatch</div>
          </div>
        </div>
      </div>

      {/* DASHBOARD MAIN CONTENT SPLIT GRID */}
      <div className="stitch-dashboard-main-grid">
        {/* LEFT COLUMN */}
        <div className="stitch-column">
          {/* TOP BAKI (DEBTORS) PROPER TABLE */}
          <div className="card-box">
            <div className="card-box-header">
              <div>
                <h3 className="card-box-title">Top Baki (Debtors)</h3>
                <span className="card-box-sub">Parties with highest total Baki balances</span>
              </div>
              <button className="text-link-btn" onClick={() => handleNavigate('Customers')}>
                View All →
              </button>
            </div>

            {topDebtors.length === 0 ? (
              <div className="empty-state-box">
                <div className="empty-icon">🤝</div>
                <div className="empty-title">No active Baki records</div>
                <div className="empty-sub">All customer receivables are fully settled.</div>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="stitch-table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', paddingLeft: '16px' }}>CUSTOMER NAME</th>
                      <th style={{ textAlign: 'left' }}>AREA</th>
                      <th style={{ textAlign: 'left' }}>LAST PAYMENT</th>
                      <th style={{ textAlign: 'center' }}>STATUS</th>
                      <th style={{ textAlign: 'right' }}>AMOUNT (₹)</th>
                      <th style={{ textAlign: 'center', paddingRight: '16px' }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topDebtors.map((d) => (
                      <tr key={d.id} className="stitch-table-row">
                        <td style={{ textAlign: 'left', paddingLeft: '16px' }}>
                          <div style={{ fontWeight: 700, fontSize: '14px' }}>{d.name}</div>
                          <div style={{ fontSize: '12px', color: '#64748B' }}>Ph: {d.mobile}</div>
                        </td>
                        <td style={{ textAlign: 'left', fontSize: '13px', color: '#334155' }}>{d.area}</td>
                        <td style={{ textAlign: 'left', fontSize: '13px', color: '#64748B' }}>{d.lastPayment}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`status-pill ${d.status.toLowerCase()}`}>{d.status}</span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '14px', color: '#DC2626' }}>
                          ₹{d.amount.toLocaleString('en-IN')}
                        </td>
                        <td style={{ textAlign: 'center', paddingRight: '16px' }}>
                          <button
                            className="action-icon-btn"
                            onClick={() => handleNavigate('Customers')}
                            title="View Customer Profile"
                          >
                            📞
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* RECENT TRANSACTIONS */}
          <div className="card-box">
            <div className="card-box-header">
              <div>
                <h3 className="card-box-title">Recent Transactions</h3>
                <span className="card-box-sub">Latest credit & debit journal activity</span>
              </div>
              <button className="text-link-btn" onClick={() => handleNavigate('Udhaari')}>
                View Log →
              </button>
            </div>

            {transactions.length === 0 ? (
              <div className="empty-state-box">
                <div className="empty-icon">📖</div>
                <div className="empty-title">No recent transactions</div>
                <div className="empty-sub">No Jama or Udhar entries recorded yet.</div>
              </div>
            ) : (
              <div className="transactions-list">
                {transactions.map((t) => (
                  <div key={t.id} className="transaction-row">
                    <div className="tx-left">
                      <div className={`tx-icon ${t.type === 'Jama' ? 'jama' : 'udhar'}`}>
                        {t.type === 'Jama' ? '↓' : '↑'}
                      </div>
                      <div>
                        <div className="tx-name">{t.customer_name}</div>
                        <div className="tx-meta">{t.type} • {t.date}</div>
                      </div>
                    </div>
                    <div className={`tx-amount ${t.type === 'Jama' ? 'jama-text' : 'udhar-text'}`}>
                      {t.type === 'Jama' ? `- ₹${t.amount.toLocaleString('en-IN')}` : `+ ₹${t.amount.toLocaleString('en-IN')}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="stitch-column">
          {/* PINNED & URGENT NOTES */}
          <div className="card-box">
            <div className="card-box-header">
              <div>
                <h3 className="card-box-title">📌 Pinned & Urgent Notes</h3>
                <span className="card-box-sub">Urgent reminders and pinned store notes</span>
              </div>
              <button className="text-link-btn" onClick={() => handleNavigate('Notepad')}>
                Go to Notepad
              </button>
            </div>

            {notes.length === 0 ? (
              <div className="empty-state-box">
                <div className="empty-icon">📝</div>
                <div className="empty-title">No notes available</div>
                <div className="empty-sub">Create notes in Notepad to pin urgent tasks here.</div>
              </div>
            ) : (
              <div className="notes-list">
                {notes.map((n) => (
                  <div key={n.id} className={`note-card-item ${n.priority === 'High' ? 'urgent' : ''}`}>
                    <div className="note-item-title">{n.title}</div>
                    <div className="note-item-desc">{n.content}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* TODAY'S REMINDERS */}
          <div className="card-box">
            <div className="card-box-header">
              <div>
                <h3 className="card-box-title">⏰ Today's Reminders</h3>
                <span className="card-box-sub">Scheduled collection follow-ups for today</span>
              </div>
              <button className="text-link-btn" onClick={() => handleNavigate('Reminders')}>
                View All
              </button>
            </div>

            {reminders.length === 0 ? (
              <div className="empty-state-box">
                <div className="empty-icon">🔔</div>
                <div className="empty-title">No reminders today</div>
                <div className="empty-sub">You have no follow-up reminders scheduled for today.</div>
              </div>
            ) : (
              <div className="reminders-list">
                {reminders.map((rem) => (
                  <div key={rem.id} className="reminder-item-row">
                    <div>
                      <div className="reminder-title">{rem.title}</div>
                      <div className="reminder-sub">{rem.due_date ? new Date(rem.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}</div>
                    </div>
                    <span className="status-pill pending">{rem.status || 'Scheduled'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
