import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { WebProfitLossReport } from '../../types/profitloss';
import '../Udhaari/Udhaari.css';

const formatINR = (val: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(val);
};

export const WebProfitLossScreen: React.FC = () => {
  const getTodayISO = () => new Date().toISOString().split('T')[0];
  const getFirstOfMonthISO = () => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  };

  const [fromDate, setFromDate] = useState(getFirstOfMonthISO());
  const [toDate, setToDate] = useState(getTodayISO());
  const [activeChip, setActiveChip] = useState<'Today' | 'This Week' | 'This Month' | 'Custom'>('This Month');
  const [isLoading, setIsLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [reportData, setReportData] = useState<WebProfitLossReport>({
    fromDate: getFirstOfMonthISO(),
    toDate: getTodayISO(),
    udhaari: 0,
    jama: 0,
    salaries: 0,
    netProfit: 0,
    revenue: 0,
    purchases: 0,
    expenses: 0,
    expensesPlusSalaries: 0,
    isLoss: false,
    statementItems: [],
    breakdown: { purchases: 0, expenses: 0, salaries: 0, netProfit: 0 }
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const fetchRealProfitLoss = useCallback(async (startISO: string, endISO: string) => {
    try {
      setIsLoading(true);
      const startMs = new Date(`${startISO}T00:00:00`).getTime();
      const endMs = new Date(`${endISO}T23:59:59.999`).getTime();

      // 1. REVENUE (from sales table)
      let revenueSum = 0;
      const { data: salesData, error: salesErr } = await supabase
        .from('sales')
        .select('*');

      if (salesErr) console.error('Error fetching sales:', salesErr);
      if (salesData && salesData.length > 0) {
        salesData.forEach((s: any) => {
          if (s.status && s.status.toLowerCase() === 'cancelled') return;
          const dtStr = s.sale_date || s.date || s.created_at;
          if (dtStr) {
            const tMs = new Date(dtStr).getTime();
            if (tMs >= startMs && tMs <= endMs) {
              const amt = parseFloat(s.total || s.grand_total || s.total_amount || s.subtotal || 0);
              revenueSum += isNaN(amt) ? 0 : amt;
            }
          }
        });
      }

      // 2. PURCHASES / COST (from supplier_ledger table)
      let purchasesSum = 0;
      const { data: ledgerData, error: ledgerErr } = await supabase
        .from('supplier_ledger')
        .select('*');

      if (ledgerErr) console.error('Error fetching supplier_ledger:', ledgerErr);
      if (ledgerData && ledgerData.length > 0) {
        ledgerData.forEach((item: any) => {
          const type = (item.transaction_type || item.type || '').toLowerCase();
          if (type === 'purchase' || type === 'bill' || type === 'debit') {
            const dtStr = item.date || item.created_at;
            if (dtStr) {
              const tMs = new Date(dtStr).getTime();
              if (tMs >= startMs && tMs <= endMs) {
                const amt = parseFloat(item.amount || 0);
                purchasesSum += isNaN(amt) ? 0 : amt;
              }
            }
          }
        });
      }

      // 3. OPERATING EXPENSES (from expenses table, excluding Salary/Labour)
      let expensesSum = 0;
      const { data: expData, error: expErr } = await supabase
        .from('expenses')
        .select('*');

      if (expErr) console.error('Error fetching expenses:', expErr);
      if (expData && expData.length > 0) {
        expData.forEach((item: any) => {
          const cat = (item.category || '').toLowerCase();
          // Exclude Salary category from general expenses to prevent double-counting with employee_transactions
          if (!cat.includes('salary') && !cat.includes('labour') && !cat.includes('labor')) {
            const dtStr = item.expense_date || item.date || item.created_at;
            if (dtStr) {
              const tMs = new Date(dtStr).getTime();
              if (tMs >= startMs && tMs <= endMs) {
                const amt = parseFloat(item.amount || 0);
                expensesSum += isNaN(amt) ? 0 : amt;
              }
            }
          }
        });
      }

      // 4. EMPLOYEE / LABOUR COSTS (from employees & employee_transactions tables)
      let salariesSum = 0;

      // 4A. Attributable recurring employee salary for active days in reporting period
      const { data: empData, error: empListErr } = await supabase
        .from('employees')
        .select('*');

      if (empListErr) console.error('Error fetching employees for P&L:', empListErr);
      if (empData && empData.length > 0) {
        empData.forEach((emp: any) => {
          const status = emp.status || 'Active';
          if (status.toLowerCase() === 'inactive' && !emp.left_on) return;

          const joinedOn = emp.joined_on ? emp.joined_on.substring(0, 10) : startISO;
          const leftOn = emp.left_on ? emp.left_on.substring(0, 10) : null;

          const overlapStart = joinedOn > startISO ? joinedOn : startISO;
          const overlapEnd = leftOn && leftOn < endISO ? leftOn : endISO;

          if (overlapStart <= overlapEnd) {
            const sDate = new Date(`${overlapStart}T00:00:00`);
            const eDate = new Date(`${overlapEnd}T00:00:00`);
            const days = Math.round((eDate.getTime() - sDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            if (days > 0) {
              const salary = parseFloat(emp.salary || 0);
              const isMonthly = (emp.salary_type || 'Monthly').toLowerCase() === 'monthly';
              const cost = isMonthly ? (salary / 30.0) * days : salary * days;
              salariesSum += isNaN(cost) ? 0 : cost;
            }
          }
        });
      }

      // 4B. One-off bonuses, gifts, and extra labour expenses from employee_transactions
      const { data: empTxData, error: empErr } = await supabase
        .from('employee_transactions')
        .select('*');

      if (empErr) console.error('Error fetching employee_transactions:', empErr);
      if (empTxData && empTxData.length > 0) {
        empTxData.forEach((item: any) => {
          const type = (item.type || '').toLowerCase();
          // Add one-off bonuses, gifts, and labour expenses
          if (type.includes('bonus') || type.includes('gift') || type.includes('labour') || type.includes('labor') || type.includes('extra')) {
            const dtStr = item.date || item.created_at;
            if (dtStr) {
              const tMs = new Date(dtStr).getTime();
              if (tMs >= startMs && tMs <= endMs) {
                const amt = parseFloat(item.amount || 0);
                salariesSum += isNaN(amt) ? 0 : amt;
              }
            }
          }
        });
      }

      // 5. UDHAARI & JAMA (from udhaari table)
      let udhaariSum = 0;
      let jamaSum = 0;
      const { data: udhaariData, error: udhaariErr } = await supabase
        .from('udhaari')
        .select('*');

      if (udhaariErr) console.error('Error fetching udhaari:', udhaariErr);
      if (udhaariData && udhaariData.length > 0) {
        udhaariData.forEach((item: any) => {
          const dtStr = item.date || item.created_at;
          if (dtStr) {
            const tMs = new Date(dtStr).getTime();
            if (tMs >= startMs && tMs <= endMs) {
              const type = (item.type || '').toLowerCase();
              const amt = parseFloat(item.amount || 0);
              const val = isNaN(amt) ? 0 : amt;
              if (type === 'baki' || type === 'udhaar' || type === 'debit' || type.includes('baki') || type.includes('udhaar')) {
                udhaariSum += val;
              } else if (type === 'jama' || type === 'payment' || type === 'credit' || type.includes('jama') || type.includes('payment')) {
                jamaSum += val;
              }
            }
          }
        });
      }

      // CALCULATE TOTALS & PROFIT/LOSS (Shared Formula)
      const expensesPlusSalaries = expensesSum + salariesSum;
      const netProfit = revenueSum - purchasesSum - expensesSum - salariesSum;
      const isLoss = netProfit < 0;

      const statementItems = [
        { label: '+ Revenue (Sales)', amount: revenueSum, type: 'INCOME' as const },
        { label: '− Purchases / Cost', amount: purchasesSum, type: 'COST' as const },
        { label: '− Operating Expenses', amount: expensesSum, type: 'COST' as const },
        { label: '− Employee / Labour Costs', amount: salariesSum, type: 'COST' as const },
        {
          label: isLoss ? '= Net Loss' : '= Net Profit',
          amount: netProfit,
          type: 'NET' as const,
          isHighlight: true
        }
      ];

      setReportData({
        fromDate: startISO,
        toDate: endISO,
        udhaari: udhaariSum,
        jama: jamaSum,
        salaries: salariesSum,
        netProfit,
        revenue: revenueSum,
        purchases: purchasesSum,
        expenses: expensesSum,
        expensesPlusSalaries,
        isLoss,
        statementItems,
        breakdown: {
          purchases: purchasesSum,
          expenses: expensesSum,
          salaries: salariesSum,
          netProfit: Math.max(0, netProfit)
        }
      });
    } catch (e) {
      console.error('Error calculating P&L from Supabase', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRealProfitLoss(fromDate, toDate);
  }, [fromDate, toDate, fetchRealProfitLoss]);

  const handleApplyFilter = () => {
    fetchRealProfitLoss(fromDate, toDate);
    showToast(`P&L report recalculated for ${fromDate} to ${toDate}`);
  };

  const handleChipClick = (chip: 'Today' | 'This Week' | 'This Month' | 'Custom') => {
    setActiveChip(chip);
    const today = new Date();
    if (chip === 'Today') {
      const iso = getTodayISO();
      setFromDate(iso);
      setToDate(iso);
    } else if (chip === 'This Week') {
      const day = today.getDay();
      const diffToMon = today.getDate() - day + (day === 0 ? -6 : 1);
      const mon = new Date(today.setDate(diffToMon)).toISOString().split('T')[0];
      setFromDate(mon);
      setToDate(getTodayISO());
    } else if (chip === 'This Month') {
      setFromDate(getFirstOfMonthISO());
      setToDate(getTodayISO());
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // CHART PERCENTAGE CALCULATIONS DYNAMICALLY
  const totalCostAndProfit = reportData.purchases + reportData.expenses + reportData.salaries + reportData.breakdown.netProfit;
  const purchasesPct = totalCostAndProfit > 0 ? (reportData.purchases / totalCostAndProfit) * 100 : 0;
  const expensesPct = totalCostAndProfit > 0 ? (reportData.expenses / totalCostAndProfit) * 100 : 0;
  const salariesPct = totalCostAndProfit > 0 ? (reportData.salaries / totalCostAndProfit) * 100 : 0;
  const netProfitPct = totalCostAndProfit > 0 ? (reportData.breakdown.netProfit / totalCostAndProfit) * 100 : 0;

  return (
    <div className="crm-content">
      <div className="udhaari-container">
        {/* PAGE HEADER */}
        <div className="udhaari-page-header">
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Accounts &rsaquo; Profit &amp; Loss
            </div>
            <h1 className="udhaari-title-text" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📊</span> Profit &amp; Loss
            </h1>
            <div className="udhaari-subtitle-text">Real-time financial performance statement &amp; profitability statement</div>
          </div>

          <div className="udhaari-header-buttons">
            <button className="btn-secondary-udhaari" onClick={() => { fetchRealProfitLoss(fromDate, toDate); showToast('Report refreshed from Supabase'); }}>
              Refresh
            </button>
            <button className="btn-secondary-udhaari" onClick={handlePrint}>
              Print
            </button>
          </div>
        </div>

        {/* REPORT PERIOD & CHIPS BOX */}
        <div className="udhaari-card-box" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Report Period
            </h3>

            {/* QUICK DATE RANGE CHIPS */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {(['Today', 'This Week', 'This Month', 'Custom'] as const).map((chip) => {
                const isSelected = activeChip === chip;
                return (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleChipClick(chip)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: isSelected ? 800 : 600,
                      border: '1px solid',
                      borderColor: isSelected ? 'var(--color-primary)' : 'var(--border-color)',
                      backgroundColor: isSelected ? 'var(--color-primary)' : 'var(--bg-card)',
                      color: isSelected ? '#ffffff' : 'var(--text-primary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {chip}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }}>FROM:</span>
              <input
                type="date"
                className="form-control"
                style={{ padding: '8px 12px', fontSize: '13px', width: 'auto' }}
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setActiveChip('Custom');
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }}>TO:</span>
              <input
                type="date"
                className="form-control"
                style={{ padding: '8px 12px', fontSize: '13px', width: 'auto' }}
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setActiveChip('Custom');
                }}
              />
            </div>

            <button className="btn-primary-udhaari" style={{ padding: '8px 22px', fontSize: '13px', fontWeight: 700 }} onClick={handleApplyFilter}>
              Recalculate
            </button>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px', fontWeight: 600 }}>
            Selected Period: <strong>{reportData.fromDate}</strong> to <strong>{reportData.toDate}</strong>
          </div>
        </div>

        {/* TOAST FEEDBACK */}
        {toastMsg && (
          <div
            style={{
              backgroundColor: 'rgba(34, 197, 94, 0.15)',
              color: 'var(--color-jama)',
              padding: '12px 16px',
              borderRadius: '10px',
              fontWeight: 700,
              border: '1px solid var(--color-jama)',
              fontSize: '13px'
            }}
          >
            ✓ {toastMsg}
          </div>
        )}

        {/* FOUR SUMMARY CARDS */}
        <div className="udhaari-summary-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {/* CARD 1: UDHAARI */}
          <div className="udhaari-card-box">
            <div className="udhaari-stat-label">UDHAARI</div>
            <div className="udhaari-stat-value text-red">{formatINR(reportData.udhaari)}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 500 }}>
              Customer credit / Baki
            </div>
          </div>

          {/* CARD 2: JAMA */}
          <div className="udhaari-card-box">
            <div className="udhaari-stat-label">JAMA</div>
            <div className="udhaari-stat-value text-green">{formatINR(reportData.jama)}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 500 }}>
              Payments received
            </div>
          </div>

          {/* CARD 3: SALARIES */}
          <div className="udhaari-card-box">
            <div className="udhaari-stat-label">SALARIES</div>
            <div className="udhaari-stat-value text-amber">{formatINR(reportData.salaries)}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 500 }}>
              Employee / labour cost
            </div>
          </div>

          {/* CARD 4: NET PROFIT / LOSS */}
          <div className="udhaari-card-box">
            <div className="udhaari-stat-label">{reportData.isLoss ? 'NET LOSS' : 'NET PROFIT'}</div>
            <div className={`udhaari-stat-value ${reportData.isLoss ? 'text-red' : 'text-green'}`}>
              {formatINR(reportData.netProfit)}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 500 }}>
              Revenue &minus; all costs
            </div>
          </div>
        </div>

        {/* TWO-COLUMN GRID: P&L STATEMENT & COST VS PROFIT CHART */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {/* P&L STATEMENT */}
          <div className="udhaari-card-box" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                P&amp;L Financial Statement
              </h3>
            </div>

            {isLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>
                Calculating P&amp;L from Supabase...
              </div>
            ) : (
              <table className="udhaari-table">
                <thead>
                  <tr>
                    <th>LINE ITEM</th>
                    <th style={{ textAlign: 'right' }}>AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.statementItems.map((item, idx) => (
                    <tr
                      key={idx}
                      style={{
                        backgroundColor: item.isHighlight ? 'var(--bg-surface-secondary)' : 'transparent',
                        borderTop: item.isHighlight ? '2px solid var(--border-color)' : 'none'
                      }}
                    >
                      <td
                        style={{
                          fontWeight: item.isHighlight ? 800 : 600,
                          color: item.isHighlight ? 'var(--text-primary)' : 'var(--text-secondary)',
                          fontSize: item.isHighlight ? '15px' : '13px'
                        }}
                      >
                        {item.label}
                      </td>
                      <td
                        style={{
                          textAlign: 'right',
                          fontWeight: item.isHighlight ? 800 : 700,
                          fontSize: item.isHighlight ? '15px' : '13px',
                          color:
                            item.type === 'INCOME'
                              ? 'var(--color-primary)'
                              : item.type === 'COST'
                              ? 'var(--color-baki)'
                              : reportData.isLoss
                              ? 'var(--color-baki)'
                              : 'var(--color-jama)'
                        }}
                      >
                        {formatINR(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* COST VS PROFIT BREAKDOWN CHART */}
          <div className="udhaari-card-box" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 16px 0' }}>
              Cost vs Profit Breakdown (%)
            </h3>

            {isLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>
                Updating breakdown chart...
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* PURCHASES BAR */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                    <span style={{ color: 'var(--color-primary)' }}>Purchases</span>
                    <span style={{ color: 'var(--text-primary)' }}>{formatINR(reportData.purchases)} ({purchasesPct.toFixed(1)}%)</span>
                  </div>
                  <div style={{ height: '10px', backgroundColor: 'rgba(37, 99, 235, 0.15)', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{ width: `${purchasesPct}%`, height: '100%', backgroundColor: 'var(--color-primary)', borderRadius: '6px', transition: 'width 0.3s ease' }} />
                  </div>
                </div>

                {/* EXPENSES BAR */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                    <span style={{ color: 'var(--color-baki)' }}>Operating Expenses</span>
                    <span style={{ color: 'var(--text-primary)' }}>{formatINR(reportData.expenses)} ({expensesPct.toFixed(1)}%)</span>
                  </div>
                  <div style={{ height: '10px', backgroundColor: 'rgba(239, 68, 68, 0.15)', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{ width: `${expensesPct}%`, height: '100%', backgroundColor: 'var(--color-baki)', borderRadius: '6px', transition: 'width 0.3s ease' }} />
                  </div>
                </div>

                {/* SALARIES BAR */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                    <span style={{ color: '#d97706' }}>Employee / Labour</span>
                    <span style={{ color: 'var(--text-primary)' }}>{formatINR(reportData.salaries)} ({salariesPct.toFixed(1)}%)</span>
                  </div>
                  <div style={{ height: '10px', backgroundColor: 'rgba(217, 119, 6, 0.15)', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{ width: `${salariesPct}%`, height: '100%', backgroundColor: '#d97706', borderRadius: '6px', transition: 'width 0.3s ease' }} />
                  </div>
                </div>

                {/* NET PROFIT BAR */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                    <span style={{ color: 'var(--color-jama)' }}>Net Profit Margin</span>
                    <span style={{ color: 'var(--text-primary)' }}>{formatINR(reportData.breakdown.netProfit)} ({netProfitPct.toFixed(1)}%)</span>
                  </div>
                  <div style={{ height: '10px', backgroundColor: 'rgba(34, 197, 94, 0.15)', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{ width: `${netProfitPct}%`, height: '100%', backgroundColor: 'var(--color-jama)', borderRadius: '6px', transition: 'width 0.3s ease' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

