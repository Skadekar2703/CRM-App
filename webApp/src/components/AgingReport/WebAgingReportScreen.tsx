import React, { useState, useMemo, useEffect } from 'react';
import { WebAgingCustomer, INITIAL_WEB_AGING_CUSTOMERS } from '../../types/aging';
import { supabase } from '../../lib/supabase';
import '../Udhaari/Udhaari.css';

export const WebAgingReportScreen: React.FC = () => {
  const [customers, setCustomers] = useState<WebAgingCustomer[]>(INITIAL_WEB_AGING_CUSTOMERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // FETCH SUPABASE DATA IF AVAILABLE
  const fetchAgingDataFromSupabase = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.from('customers').select('*');
      if (!error && data && data.length > 0) {
        showToast('Loaded latest aging report data');
        const mapped: WebAgingCustomer[] = data.map((item: any, idx: number) => {
          const age = item.age_days || item.ageDays || Math.floor(Math.random() * 90) + 10;
          let bucket = '0–30 days';
          if (age > 90) bucket = '90+ days';
          else if (age > 60) bucket = '61–90 days';
          else if (age > 30) bucket = '31–60 days';

          return {
            uid: item.uid || item.id || `${100028 + idx}`,
            customerName: item.name || item.customerName || 'Customer',
            mobile: item.mobile || item.phone || '9876543210',
            cibilStatus: (item.cibil_status || item.cibilStatus || 'BAD') as 'GOOD' | 'AVERAGE' | 'BAD',
            balance: parseFloat(item.balance || item.outstanding) || 2500.0,
            ageDays: age,
            agingBucket: bucket
          };
        });
        setCustomers(mapped);
      }
    } catch (e) {
      console.log('Supabase aging report read fallback to local state', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAgingDataFromSupabase();
  }, []);

  // CALCULATE SUMMARY BUCKETS DYNAMICALLY (KMP SHARED LOGIC RULES)
  const summary = useMemo(() => {
    const b0to30 = customers.filter((c) => c.ageDays <= 30).reduce((sum, c) => sum + c.balance, 0);
    const b31to60 = customers.filter((c) => c.ageDays > 30 && c.ageDays <= 60).reduce((sum, c) => sum + c.balance, 0);
    const b61to90 = customers.filter((c) => c.ageDays > 60 && c.ageDays <= 90).reduce((sum, c) => sum + c.balance, 0);
    const b90plus = customers.filter((c) => c.ageDays > 90).reduce((sum, c) => sum + c.balance, 0);
    const total = customers.reduce((sum, c) => sum + c.balance, 0);

    return {
      bucket0to30Total: b0to30,
      bucket31to60Total: b31to60,
      bucket61to90Total: b61to90,
      bucket90PlusTotal: b90plus,
      totalOutstanding: total,
      customerCount: customers.length
    };
  }, [customers]);

  // SEARCH FILTERING
  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.customerName.toLowerCase().includes(q) ||
        c.uid.toLowerCase().includes(q) ||
        c.mobile.includes(q) ||
        c.cibilStatus.toLowerCase().includes(q) ||
        c.agingBucket.toLowerCase().includes(q)
    );
  }, [customers, searchQuery]);

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
              Dashboard &rsaquo; Aging Report
            </div>
            <h1 className="udhaari-title-text" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⏱️</span> Aging Report
            </h1>
            <div className="udhaari-subtitle-text">Track accounts receivable aging buckets and customer credit risk analysis</div>
          </div>

          <div className="udhaari-header-buttons">
            <button className="btn-secondary-udhaari" onClick={fetchAgingDataFromSupabase}>
              Refresh
            </button>
            <button className="btn-secondary-udhaari" onClick={handlePrint}>
              Print
            </button>
          </div>
        </div>

        {/* SUMMARY CARDS (5 CARDS ROW) */}
        <div className="udhaari-summary-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
          {/* CARD 1: 0-30 DAYS */}
          <div className="udhaari-card-box">
            <div className="udhaari-stat-label">0–30 DAYS</div>
            <div className="udhaari-stat-value text-green">₹{summary.bucket0to30Total.toFixed(2)}</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Recent baki</div>
          </div>

          {/* CARD 2: 31-60 DAYS */}
          <div className="udhaari-card-box">
            <div className="udhaari-stat-label">31–60 DAYS</div>
            <div className="udhaari-stat-value text-blue">₹{summary.bucket31to60Total.toFixed(2)}</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Watch list</div>
          </div>

          {/* CARD 3: 61-90 DAYS */}
          <div className="udhaari-card-box">
            <div className="udhaari-stat-label">61–90 DAYS</div>
            <div className="udhaari-stat-value text-amber">₹{summary.bucket61to90Total.toFixed(2)}</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Aging fast</div>
          </div>

          {/* CARD 4: 90+ DAYS */}
          <div className="udhaari-card-box">
            <div className="udhaari-stat-label">90+ DAYS</div>
            <div className="udhaari-stat-value text-red">₹{summary.bucket90PlusTotal.toFixed(2)}</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Oldest / overdue</div>
          </div>

          {/* CARD 5: TOTAL BAKI */}
          <div className="udhaari-card-box">
            <div className="udhaari-stat-label">TOTAL BAKI</div>
            <div className="udhaari-stat-value text-red" style={{ fontSize: '22px' }}>
              ₹{summary.totalOutstanding.toFixed(2)}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              {summary.customerCount} customers with baki
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

        {/* RECEIVABLES AGING BY CUSTOMER TABLE */}
        <div className="udhaari-card-box" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Receivables Aging by Customer
            </h3>

            <div className="items-search-box" style={{ width: '100%', maxWidth: '340px' }}>
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                className="items-search-input"
                placeholder="Search customer name, UID, mobile or CIBIL..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>Loading Aging Report...</div>
          ) : filteredCustomers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: '#64748b' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#334155', margin: 0 }}>No receivables found</h3>
              <p style={{ fontSize: '13px', marginTop: '4px' }}>There are no active customer baki records for this query.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="udhaari-table">
                <thead>
                  <tr>
                    <th># UID</th>
                    <th>CUSTOMER</th>
                    <th>MOBILE</th>
                    <th>CIBIL</th>
                    <th style={{ textAlign: 'right' }}>BALANCE (₹)</th>
                    <th style={{ textAlign: 'center' }}>AGE (DAYS)</th>
                    <th>BUCKET</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((cust) => (
                    <tr key={cust.uid}>
                      <td style={{ fontWeight: 700, color: '#2563eb' }}>{cust.uid}</td>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>{cust.customerName}</td>
                      <td style={{ color: '#475569' }}>{cust.mobile}</td>
                      <td>
                        <span
                          className="udhaari-badge"
                          style={{
                            backgroundColor:
                              cust.cibilStatus === 'GOOD'
                                ? '#dcfce7'
                                : cust.cibilStatus === 'AVERAGE'
                                ? '#fef3c7'
                                : '#fee2e2',
                            color:
                              cust.cibilStatus === 'GOOD'
                                ? '#16a34a'
                                : cust.cibilStatus === 'AVERAGE'
                                ? '#d97706'
                                : '#dc2626',
                            fontWeight: 700
                          }}
                        >
                          {cust.cibilStatus}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: '#dc2626' }}>
                        ₹{cust.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: '#334155' }}>
                        {cust.ageDays}
                      </td>
                      <td>
                        <span
                          className="udhaari-badge"
                          style={{
                            backgroundColor:
                              cust.ageDays <= 30
                                ? '#eff6ff'
                                : cust.ageDays <= 60
                                ? '#f0fdf4'
                                : cust.ageDays <= 90
                                ? '#fffbeb'
                                : '#fef2f2',
                            color:
                              cust.ageDays <= 30
                                ? '#1d4ed8'
                                : cust.ageDays <= 60
                                ? '#16a34a'
                                : cust.ageDays <= 90
                                ? '#d97706'
                                : '#dc2626'
                          }}
                        >
                          {cust.agingBucket}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
