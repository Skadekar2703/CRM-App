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
  const [todayUdharCount, setTodayUdharCount] = useState<number>(0);
  const [todayCollections, setTodayCollections] = useState<number>(0);
  const [pendingChequesCount, setPendingChequesCount] = useState<number>(0);
  const [totalChequesCount, setTotalChequesCount] = useState<number>(0);
  const [urgentNotesCount, setUrgentNotesCount] = useState<number>(0);
  const [daagMoveCount, setDaagMoveCount] = useState<number>(0);

  const [topDebtors, setTopDebtors] = useState<Array<{ name: string; area: string; amount: string; status: string; phone: string }>>([]);
  const [notes, setNotes] = useState<Array<{ id: string; title: string; time: string; desc: string; colorClass: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // 1. Customers & Total Baki / Jama
      const { data: custData } = await supabase.from('customers').select('*');
      if (custData && custData.length > 0) {
        let bakiSum = 0;
        let jamaSum = 0;
        const debtorsList = custData.map((c: any) => {
          const rawBaki = Number(c.baki || 0);
          if (rawBaki > 0) {
            bakiSum += rawBaki;
          } else if (rawBaki < 0) {
            jamaSum += Math.abs(rawBaki);
          }
          return {
            name: c.name || 'Unknown Customer',
            area: c.area || 'Local Market',
            amount: rawBaki.toLocaleString('en-IN'),
            status: rawBaki > 20000 ? 'Overdue' : 'Pending',
            phone: c.phone || ''
          };
        }).sort((a, b) => parseFloat(b.amount.replace(/,/g, '')) - parseFloat(a.amount.replace(/,/g, '')));
        setTotalBaki(bakiSum);
        setTotalJama(jamaSum);
        setTopDebtors(debtorsList.slice(0, 5));
      } else {
        setTotalBaki(0);
        setTotalJama(0);
        setTopDebtors([]);
      }

      // 2. Today's Udhaar & Collections from Udhaari table
      const todayStr = new Date().toISOString().split('T')[0];
      const { data: udhaariData } = await supabase.from('udhaari').select('*');
      if (udhaariData) {
        let todayUdharSum = 0;
        let todayUdharCnt = 0;
        let todayJamaSum = 0;
        udhaariData.forEach((u: any) => {
          const uDate = u.date ? u.date.split('T')[0] : '';
          const amt = Number(u.amount || 0);
          if (u.type === 'Udhaar') {
            if (uDate === todayStr || !uDate) {
              todayUdharSum += amt;
              todayUdharCnt++;
            }
          } else if (u.type === 'Jama') {
            if (uDate === todayStr || !uDate) {
              todayJamaSum += amt;
            }
          }
        });
        setTodayUdhar(todayUdharSum);
        setTodayUdharCount(todayUdharCnt);
        setTodayCollections(todayJamaSum);
      }

      // 3. Cheques
      const { data: chequeData } = await supabase.from('cheques').select('*');
      if (chequeData) {
        setTotalChequesCount(chequeData.length);
        const pending = chequeData.filter((c: any) => c.status === 'Pending').length;
        setPendingChequesCount(pending);
      }

      // 4. Notes
      const { data: notesData } = await supabase.from('notes').select('*').order('created_at', { ascending: false });
      if (notesData && notesData.length > 0) {
        setUrgentNotesCount(notesData.filter((n: any) => n.priority === 'High' || n.is_pinned).length);
        setNotes(notesData.slice(0, 4).map((n: any) => ({
          id: n.id,
          title: n.title,
          time: n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today',
          desc: n.content || '',
          colorClass: n.priority === 'High' ? 'red' : n.is_pinned ? 'blue' : 'gray'
        })));
      }

      // 5. Daag
      const { data: daagData } = await supabase.from('daag').select('*');
      if (daagData) {
        setDaagMoveCount(daagData.length);
      }
    } catch (e) {
      console.log('Error loading dashboard data:', e);
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

  return (
    <div className="crm-content">
      {/* QUICK ACTIONS ROW */}
      <div className="quick-actions-row">
        <div className="quick-action-card" onClick={() => handleNavigate('Customers')} style={{ cursor: 'pointer' }}>
          <div className="action-icon-wrapper customer">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <span>+ Customer</span>
        </div>

        <div className="quick-action-card" onClick={() => handleNavigate('Udhaari')} style={{ cursor: 'pointer' }}>
          <div className="action-icon-wrapper udhar">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <span>+ Udhar</span>
        </div>

        <div className="quick-action-card" onClick={() => handleNavigate('Udhaari')} style={{ cursor: 'pointer' }}>
          <div className="action-icon-wrapper jama">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span>+ Jama</span>
        </div>

        <div className="quick-action-card" onClick={() => handleNavigate('Daag')} style={{ cursor: 'pointer' }}>
          <div className="action-icon-wrapper daag">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <span>+ Daag</span>
        </div>
      </div>

      {/* STATS GRID */}
      <div className="stats-grid">
        <div className="stat-card" onClick={() => handleNavigate('Customers')} style={{ cursor: 'pointer' }}>
          <div className="stat-header">
            <span>TOTAL BAKI</span>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1" />
            </svg>
          </div>
          <div className="stat-value">₹{totalBaki.toLocaleString('en-IN')}</div>
          <div className="stat-sub red-text">Receivable</div>
        </div>

        <div className="stat-card" onClick={() => handleNavigate('Customers')} style={{ cursor: 'pointer' }}>
          <div className="stat-header">
            <span>TOTAL JAMA</span>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="stat-value" style={{ color: '#16a34a' }}>₹{totalJama.toLocaleString('en-IN')}</div>
          <div className="stat-sub positive">Received</div>
        </div>

        <div className="stat-card" onClick={() => handleNavigate('Udhaari')} style={{ cursor: 'pointer' }}>
          <div className="stat-header">
            <span>TODAY UDHAR</span>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="stat-value">₹{todayUdhar.toLocaleString('en-IN')}</div>
          <div className="stat-sub">{todayUdharCount} Transactions</div>
        </div>

        <div className="stat-card" onClick={() => handleNavigate('Udhaari')} style={{ cursor: 'pointer' }}>
          <div className="stat-header">
            <span>TODAY'S COLLECTIONS</span>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="stat-value">₹{todayCollections.toLocaleString('en-IN')}</div>
          <div className="stat-sub positive">Jama total</div>
        </div>

        <div className="stat-card" onClick={() => handleNavigate('Cheques')} style={{ cursor: 'pointer' }}>
          <div className="stat-header">
            <span>CHEQUES</span>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="stat-value">{totalChequesCount}</div>
          <div className="stat-sub warning">{pendingChequesCount} Pending Clearance</div>
        </div>

        <div className="stat-card" onClick={() => handleNavigate('Notepad')} style={{ cursor: 'pointer' }}>
          <div className="stat-header">
            <span>URGENT NOTES</span>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="stat-value">{urgentNotesCount}</div>
          <div className="stat-sub">High priority/pinned</div>
        </div>

        <div className="stat-card" onClick={() => handleNavigate('Daag')} style={{ cursor: 'pointer' }}>
          <div className="stat-header">
            <span>DAAG MOVE</span>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <div className="stat-value">{daagMoveCount}</div>
          <div className="stat-sub" style={{ color: '#0284c7' }}>Items dispatched</div>
        </div>
      </div>

      {/* DASHBOARD GRID */}
      <div className="dashboard-grid">
        {/* LEFT COLUMN */}
        <div className="left-column">
          {/* DEBTORS TABLE */}
          <div className="card-box">
            <div className="card-box-header">
              <div className="card-box-title">Top Baki (Debtors)</div>
              <button className="card-box-link" onClick={() => handleNavigate('Customers')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>View All</button>
            </div>

            <table className="debtors-table">
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Area</th>
                  <th>Amount (₹)</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {topDebtors.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8', padding: '16px' }}>
                      {isLoading ? 'Loading customers...' : 'No debtors found'}
                    </td>
                  </tr>
                ) : (
                  topDebtors.map((d, index) => (
                    <tr key={index}>
                      <td className="customer-name-td">{d.name}</td>
                      <td>{d.area}</td>
                      <td className="amount-td">{d.amount}</td>
                      <td>
                        <span className={`badge ${d.status.toLowerCase()}`}>{d.status}</span>
                      </td>
                      <td>
                        {d.phone ? (
                          <a href={`tel:${d.phone}`} className="icon-button" aria-label="Call customer" title={`Call ${d.phone}`}>
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          </a>
                        ) : (
                          <button className="icon-button" onClick={() => handleNavigate('Customers')}>
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* RISKY PAYMENTS */}
          <div className="card-box">
            <div className="card-box-header">
              <div className="card-box-title">
                <svg width="18" height="18" fill="none" stroke="#dc2626" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Risky Payments / Pending Cheques
              </div>
            </div>

            <div className="risky-cards-grid">
              <div className="risky-card">
                <div className="risky-card-header">
                  <span className="risky-card-name">Cheque Clearance</span>
                  <span className="badge high-risk">Attention</span>
                </div>
                <p className="risky-card-desc">Review pending cheques and bounced transactions.</p>
                <div className="risky-card-footer">
                  <span className="risky-card-amount">{pendingChequesCount} Cheques</span>
                  <button className="view-details-btn" onClick={() => handleNavigate('Cheques')}>View Details</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - PINNED NOTES */}
        <div className="card-box">
          <div className="card-box-header">
            <div className="card-box-title">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              Pinned & Urgent Notes
            </div>
          </div>

          <div className="notes-panel">
            {notes.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', padding: '16px' }}>
                {isLoading ? 'Loading notes...' : 'No notes available.'}
              </p>
            ) : (
              notes.map((n) => (
                <div key={n.id} className={`note-item ${n.colorClass}`}>
                  <div className="note-header">
                    <span className="note-title">{n.title}</span>
                    <span className="note-time">{n.time}</span>
                  </div>
                  <p className="note-desc">{n.desc}</p>
                </div>
              ))
            )}

            <button className="add-note-btn" onClick={() => handleNavigate('Notepad')}>
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Add New Note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

