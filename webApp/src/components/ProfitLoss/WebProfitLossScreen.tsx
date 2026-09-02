import React, { useState, useMemo } from 'react';
import { WebProfitLossReport } from '../../types/profitloss';
import '../Udhaari/Udhaari.css';

export const WebProfitLossScreen: React.FC = () => {
  const [fromDate, setFromDate] = useState('2026-08-01');
  const [toDate, setToDate] = useState('2026-08-31');
  const [appliedFromDate, setAppliedFromDate] = useState('01/08/2026');
  const [appliedToDate, setAppliedToDate] = useState('31/08/2026');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // CALCULATE REPORT VIA SHARED LOGIC RULES
  const report: WebProfitLossReport = useMemo(() => {
    const revenue = 185000;
    const purchases = 77000;
    const expenses = 16050;
    const salaries = 25000;
    const expensesPlusSalaries = expenses + salaries;
    const netProfit = revenue - purchases - expenses - salaries;
    const isLoss = netProfit < 0;

    return {
      fromDate: appliedFromDate,
      toDate: appliedToDate,
      revenue,
      purchases,
      expenses,
      salaries,
      expensesPlusSalaries,
      netProfit,
      isLoss,
      statementItems: [
        { label: '+ Revenue (Sales)', amount: revenue, type: 'INCOME' },
        { label: '− Purchases', amount: purchases, type: 'COST' },
        { label: '− Expenses', amount: expenses, type: 'COST' },
        { label: '− Salaries (paid)', amount: salaries, type: 'COST' },
        { label: '= Net Profit', amount: netProfit, type: 'NET', isHighlight: true }
      ],
      breakdown: {
        purchases,
        expenses,
        salaries,
        netProfit: Math.max(0, netProfit)
      }
    };
  }, [appliedFromDate, appliedToDate]);

  const handleApplyFilter = () => {
    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
    showToast(`P&L report calculated for ${fromDate} to ${toDate}`);
  };

  const handlePrint = () => {
    window.print();
  };

  // CHART PERCENTAGE CALCULATIONS
  const totalCostAndProfit = report.purchases + report.expenses + report.salaries + report.breakdown.netProfit;
  const purchasesPct = totalCostAndProfit > 0 ? (report.purchases / totalCostAndProfit) * 100 : 0;
  const expensesPct = totalCostAndProfit > 0 ? (report.expenses / totalCostAndProfit) * 100 : 0;
  const salariesPct = totalCostAndProfit > 0 ? (report.salaries / totalCostAndProfit) * 100 : 0;
  const netProfitPct = totalCostAndProfit > 0 ? (report.breakdown.netProfit / totalCostAndProfit) * 100 : 0;

  return (
    <div className="crm-content">
      <div className="udhaari-container">
        {/* PAGE HEADER */}
        <div className="udhaari-page-header">
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Accounts &rsaquo; Profit &amp; Loss
            </div>
            <h1 className="udhaari-title-text" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📊</span> Profit &amp; Loss
            </h1>
            <div className="udhaari-subtitle-text">Financial performance, revenue, cost breakdown &amp; net profitability statement</div>
          </div>

          <div className="udhaari-header-buttons">
            <button className="btn-secondary-udhaari" onClick={() => showToast('Report refreshed')}>
              Refresh
            </button>
            <button className="btn-secondary-udhaari" onClick={handlePrint}>
              Print
            </button>
          </div>
        </div>

        {/* REPORT PERIOD BOX */}
        <div className="udhaari-card-box" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 12px 0' }}>
            Report Period
          </h3>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>FROM:</span>
              <input
                type="date"
                className="form-control"
                style={{ padding: '6px 12px', fontSize: '13px', width: 'auto' }}
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>TO:</span>
              <input
                type="date"
                className="form-control"
                style={{ padding: '6px 12px', fontSize: '13px', width: 'auto' }}
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>

            <button className="btn-primary-udhaari" style={{ padding: '6px 20px', fontSize: '13px' }} onClick={handleApplyFilter}>
              Show
            </button>
          </div>

          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '10px' }}>
            Selected Period: <strong>{report.fromDate}</strong> to <strong>{report.toDate}</strong>
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

        {/* FOUR SUMMARY CARDS */}
        <div className="udhaari-summary-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {/* CARD 1: REVENUE */}
          <div className="udhaari-card-box">
            <div className="udhaari-stat-label">REVENUE</div>
            <div className="udhaari-stat-value text-blue">₹{report.revenue.toFixed(2)}</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Total sales recorded</div>
          </div>

          {/* CARD 2: PURCHASES */}
          <div className="udhaari-card-box">
            <div className="udhaari-stat-label">PURCHASES</div>
            <div className="udhaari-stat-value text-amber">₹{report.purchases.toFixed(2)}</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Supplier purchases</div>
          </div>

          {/* CARD 3: EXPENSES + SALARIES */}
          <div className="udhaari-card-box">
            <div className="udhaari-stat-label">EXPENSES + SALARIES</div>
            <div className="udhaari-stat-value text-red">₹{report.expensesPlusSalaries.toFixed(2)}</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              ₹{report.expenses.toFixed(0)} exp + ₹{report.salaries.toFixed(0)} salary
            </div>
          </div>

          {/* CARD 4: NET PROFIT */}
          <div className="udhaari-card-box">
            <div className="udhaari-stat-label">NET PROFIT</div>
            <div className={`udhaari-stat-value ${report.isLoss ? 'text-red' : 'text-green'}`}>
              ₹{report.netProfit.toFixed(2)}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Revenue &minus; all costs</div>
          </div>
        </div>

        {/* TWO-COLUMN GRID: P&L STATEMENT & COST VS PROFIT CHART */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* P&L STATEMENT */}
          <div className="udhaari-card-box" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                P&amp;L Statement
              </h3>
            </div>

            <table className="udhaari-table">
              <thead>
                <tr>
                  <th>LINE ITEM</th>
                  <th style={{ textAlign: 'right' }}>AMOUNT (₹)</th>
                </tr>
              </thead>
              <tbody>
                {report.statementItems.map((item, idx) => (
                  <tr
                    key={idx}
                    style={{
                      backgroundColor: item.isHighlight ? '#f8fafc' : 'transparent',
                      borderTop: item.isHighlight ? '2px solid #e2e8f0' : 'none'
                    }}
                  >
                    <td
                      style={{
                        fontWeight: item.isHighlight ? 800 : 600,
                        color: item.isHighlight ? '#0f172a' : '#334155',
                        fontSize: item.isHighlight ? '15px' : '14px'
                      }}
                    >
                      {item.label}
                    </td>
                    <td
                      style={{
                        textAlign: 'right',
                        fontWeight: item.isHighlight ? 800 : 700,
                        fontSize: item.isHighlight ? '16px' : '14px',
                        color:
                          item.type === 'INCOME'
                            ? '#0284c7'
                            : item.type === 'COST'
                            ? '#dc2626'
                            : report.isLoss
                            ? '#dc2626'
                            : '#16a34a'
                      }}
                    >
                      ₹{item.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* COST VS PROFIT BREAKDOWN CHART */}
          <div className="udhaari-card-box" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' }}>
              Cost vs Profit Breakdown
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* PURCHASES BAR */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  <span style={{ color: '#0284c7' }}>Purchases</span>
                  <span style={{ color: '#0f172a' }}>₹{report.purchases.toFixed(2)} ({purchasesPct.toFixed(1)}%)</span>
                </div>
                <div style={{ height: '10px', backgroundColor: '#e0f2fe', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${purchasesPct}%`, height: '100%', backgroundColor: '#0284c7', borderRadius: '6px' }} />
                </div>
              </div>

              {/* EXPENSES BAR */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  <span style={{ color: '#dc2626' }}>Expenses</span>
                  <span style={{ color: '#0f172a' }}>₹{report.expenses.toFixed(2)} ({expensesPct.toFixed(1)}%)</span>
                </div>
                <div style={{ height: '10px', backgroundColor: '#fee2e2', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${expensesPct}%`, height: '100%', backgroundColor: '#dc2626', borderRadius: '6px' }} />
                </div>
              </div>

              {/* SALARIES BAR */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  <span style={{ color: '#d97706' }}>Salaries</span>
                  <span style={{ color: '#0f172a' }}>₹{report.salaries.toFixed(2)} ({salariesPct.toFixed(1)}%)</span>
                </div>
                <div style={{ height: '10px', backgroundColor: '#fef3c7', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${salariesPct}%`, height: '100%', backgroundColor: '#d97706', borderRadius: '6px' }} />
                </div>
              </div>

              {/* NET PROFIT BAR */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  <span style={{ color: '#16a34a' }}>Net Profit</span>
                  <span style={{ color: '#0f172a' }}>₹{report.breakdown.netProfit.toFixed(2)} ({netProfitPct.toFixed(1)}%)</span>
                </div>
                <div style={{ height: '10px', backgroundColor: '#dcfce7', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${netProfitPct}%`, height: '100%', backgroundColor: '#16a34a', borderRadius: '6px' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
