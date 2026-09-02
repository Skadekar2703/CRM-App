import React, { useState, useMemo, useEffect } from 'react';
import { WebCashBookEntry, INITIAL_WEB_CASHBOOK_ENTRIES } from '../../types/cashbook';
import { CashBookEntryModal } from './CashBookEntryModal';
import { supabase } from '../../lib/supabase';
import '../Udhaari/Udhaari.css';

export const WebCashBookScreen: React.FC = () => {
  const [entries, setEntries] = useState<WebCashBookEntry[]>(INITIAL_WEB_CASHBOOK_ENTRIES);
  const [fromDate, setFromDate] = useState('2026-08-01');
  const [toDate, setToDate] = useState('2026-08-29');
  const [appliedFromDate, setAppliedFromDate] = useState('2026-08-01');
  const [appliedToDate, setAppliedToDate] = useState('2026-08-29');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // FETCH FROM SUPABASE IF AVAILABLE
  const fetchCashBookFromSupabase = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.from('cash_book').select('*').order('date', { ascending: true });
      if (!error && data && data.length > 0) {
        const mapped: WebCashBookEntry[] = data.map((item: any, idx: number) => ({
          id: item.id || `CB-${100 + idx}`,
          date: item.date || '2026-08-01',
          particulars: item.particulars || item.description || 'Cash entry',
          type: (item.type || 'IN').toUpperCase() as 'IN' | 'OUT',
          amount: parseFloat(item.amount) || 0.0,
          runningBalance: 0,
          sourceModule: item.source_module || 'Manual',
          createdAt: item.created_at || '2026-08-01'
        }));
        setEntries(mapped);
      }
    } catch (e) {
      console.log('Supabase cash book read fallback to local state', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCashBookFromSupabase();
  }, []);

  // FILTER ENTRIES BY DATE RANGE INCLUSIVELY & CALCULATE CHRONOLOGICAL RUNNING BALANCE
  const filteredWithRunningBalance = useMemo(() => {
    let sorted = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let running = 0;
    const computed = sorted.map((entry) => {
      if (entry.type === 'IN') {
        running += entry.amount;
      } else {
        running -= entry.amount;
      }
      return { ...entry, runningBalance: running };
    });

    return computed.filter((entry) => {
      const eDate = entry.date;
      const matchesFrom = !appliedFromDate || eDate >= appliedFromDate;
      const matchesTo = !appliedToDate || eDate <= appliedToDate;
      const matchesQ = !searchQuery || entry.particulars.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFrom && matchesTo && matchesQ;
    });
  }, [entries, appliedFromDate, appliedToDate, searchQuery]);

  // CALCULATE SUMMARY CARDS
  const summary = useMemo(() => {
    const totalIn = filteredWithRunningBalance.filter((e) => e.type === 'IN').reduce((sum, e) => sum + e.amount, 0);
    const totalOut = filteredWithRunningBalance.filter((e) => e.type === 'OUT').reduce((sum, e) => sum + e.amount, 0);
    const netCash = totalIn - totalOut;

    return {
      totalIn,
      totalOut,
      netCash
    };
  }, [filteredWithRunningBalance]);

  const handleApplyFilter = () => {
    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
    showToast(`Date range updated: ${fromDate || 'Start'} to ${toDate || 'Present'}`);
  };

  const handleSaveEntry = async (
    date: string,
    particulars: string,
    type: 'IN' | 'OUT',
    amount: number,
    sourceModule: string
  ) => {
    const nextId = `CB-${100 + entries.length + 1}`;
    const newEntry: WebCashBookEntry = {
      id: nextId,
      date,
      particulars,
      type,
      amount,
      runningBalance: 0,
      sourceModule,
      createdAt: 'Just now'
    };

    setEntries((prev) => [...prev, newEntry]);

    try {
      await supabase.from('cash_book').insert([
        {
          id: nextId,
          date,
          particulars,
          type,
          amount,
          source_module: sourceModule
        }
      ]);
    } catch (e) {
      console.log('Supabase insert cash book error', e);
    }

    showToast(`Cash entry "${particulars}" recorded.`);
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Particulars', 'Type', 'In (INR)', 'Out (INR)', 'Running Balance (INR)', 'Source'];
    const rows = filteredWithRunningBalance.map((e) => [
      `"${e.date}"`,
      `"${e.particulars}"`,
      e.type,
      e.type === 'IN' ? e.amount : 0,
      e.type === 'OUT' ? e.amount : 0,
      e.runningBalance,
      `"${e.sourceModule}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'cash_book_report.csv');
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
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Accounts &rsaquo; Cash Book
            </div>
            <h1 className="udhaari-title-text" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📖</span> Cash Book
            </h1>
            <div className="udhaari-subtitle-text">Track cash inflows, outflows and chronological day book balances</div>
          </div>

          <div className="udhaari-header-buttons">
            <button className="btn-secondary-udhaari" onClick={fetchCashBookFromSupabase}>
              Refresh
            </button>
            <button className="btn-secondary-udhaari" onClick={handleExportCSV}>
              CSV
            </button>
            <button className="btn-secondary-udhaari" onClick={handlePrint}>
              Print
            </button>
            <button className="btn-primary-udhaari" style={{ backgroundColor: '#2563eb' }} onClick={() => setIsModalOpen(true)}>
              + Add Cash Entry
            </button>
          </div>
        </div>

        {/* DATE RANGE FILTER BOX */}
        <div className="udhaari-card-box" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>FROM:</span>
                <input
                  type="date"
                  className="form-control"
                  style={{ padding: '6px 10px', fontSize: '13px', width: 'auto' }}
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>TO:</span>
                <input
                  type="date"
                  className="form-control"
                  style={{ padding: '6px 10px', fontSize: '13px', width: 'auto' }}
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>

              <button className="btn-primary-udhaari" style={{ padding: '6px 16px', fontSize: '13px' }} onClick={handleApplyFilter}>
                Show
              </button>
            </div>

            <div className="items-search-box" style={{ width: '100%', maxWidth: '300px' }}>
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                className="items-search-input"
                placeholder="Search particulars..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="udhaari-summary-grid">
          {/* TOTAL IN */}
          <div className="udhaari-card-box">
            <div className="udhaari-stat-label">TOTAL IN</div>
            <div className="udhaari-stat-value text-green">₹{summary.totalIn.toFixed(2)}</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Money received in date range</div>
          </div>

          {/* TOTAL OUT */}
          <div className="udhaari-card-box">
            <div className="udhaari-stat-label">TOTAL OUT</div>
            <div className="udhaari-stat-value text-red">₹{summary.totalOut.toFixed(2)}</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Money spent in date range</div>
          </div>

          {/* NET CASH */}
          <div className="udhaari-card-box">
            <div className="udhaari-stat-label">NET CASH</div>
            <div className="udhaari-stat-value text-blue">₹{summary.netCash.toFixed(2)}</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              {appliedFromDate} to {appliedToDate}
            </div>
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

        {/* DAY BOOK / TRANSACTION TABLE */}
        <div className="udhaari-card-box" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Day Book — Cash Transactions
            </h3>
          </div>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>Loading Cash Book...</div>
          ) : filteredWithRunningBalance.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: '#64748b' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#334155', margin: 0 }}>No cash transactions found</h3>
              <p style={{ fontSize: '13px', marginTop: '4px' }}>Try adjusting your date range filter or record a new cash entry.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="udhaari-table">
                <thead>
                  <tr>
                    <th>DATE</th>
                    <th>PARTICULARS</th>
                    <th style={{ textAlign: 'right' }}>IN (₹)</th>
                    <th style={{ textAlign: 'right' }}>OUT (₹)</th>
                    <th style={{ textAlign: 'right' }}>BALANCE (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWithRunningBalance.map((entry) => (
                    <tr key={entry.id}>
                      <td style={{ fontWeight: 600, color: '#334155', whiteSpace: 'nowrap' }}>{entry.date}</td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{entry.particulars}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>Source: {entry.sourceModule}</div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>
                        {entry.type === 'IN' ? `₹${entry.amount.toFixed(2)}` : '—'}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>
                        {entry.type === 'OUT' ? `₹${entry.amount.toFixed(2)}` : '—'}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: entry.runningBalance >= 0 ? '#1d4ed8' : '#dc2626' }}>
                        ₹{entry.runningBalance.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* MODAL */}
        <CashBookEntryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveEntry} />
      </div>
    </div>
  );
};
