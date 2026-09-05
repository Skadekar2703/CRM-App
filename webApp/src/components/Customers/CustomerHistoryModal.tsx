import React, { useState, useEffect, useMemo } from 'react';
import { WebCustomer } from '../../types/customers';
import { supabase } from '../../lib/supabase';
import { getSignedPhotoUrl } from '../../utils/photoUtils';

interface CustomerHistoryModalProps {
  isOpen: boolean;
  customer: WebCustomer | null;
  onClose: () => void;
}

interface StatementRow {
  id: string;
  date: string;
  rawDate: string;
  particulars: string;
  debit: number;
  credit: number;
  balance: number;
}

export const CustomerHistoryModal: React.FC<CustomerHistoryModalProps> = ({
  isOpen,
  customer,
  onClose
}) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [rawTransactions, setRawTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // DATE RANGE FILTERS
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    if (customer?.photoUrl) {
      getSignedPhotoUrl(customer.photoUrl).then(url => setSignedUrl(url));
    } else {
      setSignedUrl(null);
    }
  }, [customer?.photoUrl]);

  const fetchTransactions = async () => {
    if (!customer) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase
        .from('udhaari')
        .select('*')
        .or(`customer_id.eq.${customer.id},customer_name.eq.${customer.name}`)
        .order('created_at', { ascending: true }); // Chronological order for running balance calculation

      if (error) {
        console.error('Error loading customer transactions:', error);
        setErrorMsg('Unable to load transaction history.');
        setRawTransactions([]);
      } else if (data) {
        setRawTransactions(data);
      } else {
        setRawTransactions([]);
      }
    } catch (e: any) {
      console.error('Exception fetching transactions:', e);
      setErrorMsg('Unable to load transaction history.');
      setRawTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && customer) {
      fetchTransactions();
      setFromDate('');
      setToDate('');
    }
  }, [isOpen, customer]);

  // DATE-FILTERED TRANSACTIONS WITH RUNNING BALANCE
  const statementRows = useMemo<StatementRow[]>(() => {
    let filtered = rawTransactions;

    if (fromDate) {
      filtered = filtered.filter(t => {
        const d = t.created_at || t.date || '';
        return d.split('T')[0] >= fromDate;
      });
    }

    if (toDate) {
      filtered = filtered.filter(t => {
        const d = t.created_at || t.date || '';
        return d.split('T')[0] <= toDate;
      });
    }

    let runningBal = (customer?.openingBalance || 0);
    return filtered.map((t: any) => {
      const amt = Number(t.amount || 0);
      const isDebit = t.type === 'Udhaar' || t.type === 'Baki';
      const debit = isDebit ? amt : 0;
      const credit = !isDebit ? amt : 0;

      if (isDebit) {
        runningBal += amt;
      } else {
        runningBal -= amt;
      }

      const rawD = t.created_at || t.date || '';
      const formattedD = rawD ? new Date(rawD).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

      return {
        id: String(t.id),
        date: formattedD,
        rawDate: rawD,
        particulars: t.notes || (isDebit ? 'Udhaar Transaction' : 'Jama Transaction'),
        debit,
        credit,
        balance: runningBal
      };
    });
  }, [rawTransactions, fromDate, toDate, customer?.openingBalance]);

  // DATE-FILTERED FINANCIAL SUMMARY
  const totalDebit = useMemo(() => statementRows.reduce((sum, r) => sum + r.debit, 0), [statementRows]);
  const totalCredit = useMemo(() => statementRows.reduce((sum, r) => sum + r.credit, 0), [statementRows]);
  const netBalance = useMemo(() => (customer?.openingBalance || 0) + totalDebit - totalCredit, [totalDebit, totalCredit, customer?.openingBalance]);

  if (!isOpen || !customer) return null;

  const handlePrintPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Statement of Account - ${customer.name}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 24px; color: #0F172A; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #2563EB; padding-bottom: 16px; margin-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; color: #2563EB; }
            .subtitle { font-size: 14px; color: #64748B; margin-top: 4px; }
            .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px; background: #F8FAFC; padding: 16px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #E2E8F0; }
            .summary-cards { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 20px; }
            .card { padding: 12px; border-radius: 8px; text-align: center; border: 1px solid #CBD5E1; }
            .card-red { background: #FEF2F2; border-color: #FCA5A5; color: #DC2626; }
            .card-green { background: #F0FDF4; border-color: #86EFAC; color: #16A34A; }
            .card-blue { background: #EFF6FF; border-color: #93C5FD; color: #2563EB; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
            th { background: #0F172A; color: #FFFFFF; padding: 10px; text-align: left; }
            td { padding: 10px; border-bottom: 1px solid #E2E8F0; }
            .text-red { color: #DC2626; font-weight: bold; }
            .text-green { color: #16A34A; font-weight: bold; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #94A3B8; border-top: 1px solid #E2E8F0; padding-top: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">CLIENT CRM</div>
              <div class="subtitle">Statement of Account</div>
            </div>
            <div style="text-align: right; font-size: 12px; color: #64748B;">
              <div>Date: ${new Date().toLocaleDateString('en-IN')}</div>
              <div>Filter: ${fromDate || 'Beginning'} to ${toDate || 'Present'}</div>
            </div>
          </div>

          <div class="meta-grid">
            <div><strong>Customer Name:</strong> ${customer.name}</div>
            <div><strong>Customer ID:</strong> ${customer.customerId}</div>
            <div><strong>Mobile:</strong> ${customer.mobile}</div>
            <div><strong>Customer Code:</strong> ${customer.customerCode}</div>
            <div><strong>Area / Location:</strong> ${customer.area}</div>
            <div><strong>CIBIL Status:</strong> ${customer.cibilStatus}</div>
          </div>

          <div class="summary-cards">
            <div class="card card-red">
              <div style="font-size: 11px; font-weight: bold;">TOTAL UDHAR / DEBIT</div>
              <div style="font-size: 18px; font-weight: bold; margin-top: 4px;">₹${totalDebit.toLocaleString('en-IN')}</div>
            </div>
            <div class="card card-green">
              <div style="font-size: 11px; font-weight: bold;">TOTAL JAMA / CREDIT</div>
              <div style="font-size: 18px; font-weight: bold; margin-top: 4px;">₹${totalCredit.toLocaleString('en-IN')}</div>
            </div>
            <div class="card card-blue">
              <div style="font-size: 11px; font-weight: bold;">BAKI BALANCE</div>
              <div style="font-size: 18px; font-weight: bold; margin-top: 4px;">₹${netBalance.toLocaleString('en-IN')}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>DATE</th>
                <th>PARTICULARS</th>
                <th style="text-align: right;">DEBIT (₹)</th>
                <th style="text-align: right;">CREDIT (₹)</th>
                <th style="text-align: right;">BALANCE (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${statementRows.length === 0 ? `
                <tr>
                  <td colspan="5" style="text-align: center; color: #64748B; padding: 24px;">No transactions found</td>
                </tr>
              ` : statementRows.map(r => `
                <tr>
                  <td>${r.date}</td>
                  <td>${r.particulars}</td>
                  <td style="text-align: right;" class="text-red">${r.debit > 0 ? '₹' + r.debit.toLocaleString('en-IN') : '—'}</td>
                  <td style="text-align: right;" class="text-green">${r.credit > 0 ? '₹' + r.credit.toLocaleString('en-IN') : '—'}</td>
                  <td style="text-align: right; font-weight: bold; color: ${r.balance > 0 ? '#DC2626' : '#16A34A'}">₹${r.balance.toLocaleString('en-IN')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            Generated automatically by Client CRM System • Computer Generated Statement
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div className="modal-content" style={{ maxWidth: '880px', borderRadius: '16px', padding: '0', overflow: 'hidden', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
        {/* HEADER SECTION */}
        <div style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '18px', cursor: 'pointer', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              ← Back
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {signedUrl ? (
                <img src={signedUrl} alt={customer.name} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-primary)' }} />
              ) : (
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', color: '#FFFFFF', fontSize: '18px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {customer.name.substring(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>{customer.name} — Statement History</h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  ID: <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>{customer.customerId}</span> • Mobile: {customer.mobile} • Area: {customer.area}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handlePrintPDF}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', backgroundColor: 'var(--color-primary)', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}
          >
            🖨️ Print / PDF
          </button>
        </div>

        {/* BODY CONTAINER */}
        <div style={{ padding: '24px', maxHeight: '75vh', overflowY: 'auto' }}>
          {/* DATE RANGE FILTER BAR */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', backgroundColor: 'var(--bg-app)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>From Date:</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '13px' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>To Date:</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '13px' }}
              />
            </div>
            <button
              onClick={() => fetchTransactions()}
              style={{ padding: '8px 16px', backgroundColor: 'var(--color-primary)', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}
            >
              Apply Filter
            </button>
            {(fromDate || toDate) && (
              <button
                onClick={() => { setFromDate(''); setToDate(''); }}
                style={{ padding: '8px 14px', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
              >
                Clear
              </button>
            )}
          </div>

          {/* DATE-FILTERED FINANCIAL SUMMARY CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div style={{ backgroundColor: 'var(--bg-app)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-baki)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>TOTAL UDHAR / DEBIT</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-baki)', marginTop: '4px' }}>₹{totalDebit.toLocaleString('en-IN')}</div>
            </div>
            <div style={{ backgroundColor: 'var(--bg-app)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-jama)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>TOTAL JAMA / CREDIT</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-jama)', marginTop: '4px' }}>₹{totalCredit.toLocaleString('en-IN')}</div>
            </div>
            <div style={{ backgroundColor: 'var(--bg-app)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>CREDIT LIMIT</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>₹{(customer?.creditLimit || 50000).toLocaleString('en-IN')}</div>
            </div>
          </div>

          {/* STATEMENT TABLE */}
          <div style={{ backgroundColor: 'var(--bg-app)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
            {isLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-primary)', fontWeight: 600 }}>Loading transaction statement...</div>
            ) : errorMsg ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--color-baki)', fontWeight: 700 }}>⚠️ {errorMsg}</div>
            ) : statementRows.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>No transactions found</div>
                <div style={{ fontSize: '13px', marginTop: '4px' }}>There are no recorded transactions for this customer within the selected date range.</div>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 800 }}>DATE</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 800 }}>PARTICULARS</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '11px', fontWeight: 800 }}>DEBIT (₹)</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '11px', fontWeight: 800 }}>CREDIT (₹)</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '11px', fontWeight: 800 }}>BALANCE (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {statementRows.map((r) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{r.date}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>{r.particulars}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: 700, color: r.debit > 0 ? 'var(--color-baki)' : 'var(--text-muted)' }}>
                        {r.debit > 0 ? `₹${r.debit.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: 700, color: r.credit > 0 ? 'var(--color-jama)' : 'var(--text-muted)' }}>
                        {r.credit > 0 ? `₹${r.credit.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: 800, color: r.balance > 0 ? 'var(--color-baki)' : 'var(--color-jama)' }}>
                        ₹{r.balance.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
