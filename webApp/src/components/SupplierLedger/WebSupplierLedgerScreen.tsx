import React, { useState, useMemo, useEffect } from 'react';
import {
  WebSupplierOverview,
  WebSupplierLedgerEntry,
  INITIAL_WEB_SUPPLIERS,
  INITIAL_WEB_LEDGER_ENTRIES
} from '../../types/supplierledger';
import { SupplierLedgerEntryModal } from './SupplierLedgerEntryModal';
import { DeleteSupplierLedgerDialog } from './DeleteSupplierLedgerDialog';
import { supabase } from '../../lib/supabase';
import '../Udhaari/Udhaari.css';

export const WebSupplierLedgerScreen: React.FC = () => {
  const [suppliers] = useState(INITIAL_WEB_SUPPLIERS);
  const [entries, setEntries] = useState<WebSupplierLedgerEntry[]>(INITIAL_WEB_LEDGER_ENTRIES);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('ALL'); // 'ALL' or specific supplierId
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, _setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [_isLoading, setIsLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // MODALS
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WebSupplierLedgerEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<WebSupplierLedgerEntry | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // FETCH FROM SUPABASE IF CONFIGURED
  const fetchLedgerFromSupabase = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.from('supplier_ledger').select('*');
      if (!error && data && data.length > 0) {
        const mapped: WebSupplierLedgerEntry[] = data.map((item: any, idx: number) => ({
          id: item.id || `SLE-${100 + idx}`,
          supplierId: item.supplier_id || 'SUP-101',
          supplierName: item.supplier_name || 'Supplier',
          date: item.date || '29 Aug 2026',
          transactionType: item.transaction_type || 'Purchase',
          amount: parseFloat(item.amount) || 0.0,
          reference: item.reference || '',
          paymentMode: item.payment_mode || 'Cash',
          description: item.description || '',
          runningBalance: parseFloat(item.running_balance) || 0.0,
          createdAt: item.created_at || '2026-08-29'
        }));
        setEntries(mapped);
      }
    } catch (e) {
      console.log('Supabase supplier ledger read fallback to local state', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLedgerFromSupabase();
  }, []);

  // CALCULATE ALL SUPPLIERS PAYABLE OVERVIEW (SHARED LOGIC: Payable = Opening + Purchases - Paid - Returns)
  const supplierOverviews: WebSupplierOverview[] = useMemo(() => {
    return suppliers.map((sup) => {
      const supEntries = entries.filter((e) => e.supplierId === sup.id);
      const opening = supEntries.filter((e) => e.transactionType === 'Opening Balance').reduce((sum, e) => sum + e.amount, 0);
      const purchases = supEntries.filter((e) => e.transactionType === 'Purchase').reduce((sum, e) => sum + e.amount, 0);
      const paid = supEntries.filter((e) => e.transactionType === 'Payment').reduce((sum, e) => sum + e.amount, 0);
      const returns = supEntries.filter((e) => e.transactionType === 'Return').reduce((sum, e) => sum + e.amount, 0);

      const payable = Math.max(0, opening + purchases - paid - returns);

      return {
        supplierId: sup.id,
        supplierName: sup.name,
        opening,
        purchases,
        paid,
        returns,
        payable
      };
    });
  }, [suppliers, entries]);

  // CALCULATE TOTAL PAYABLE SUMMARY
  const headerSummary = useMemo(() => {
    const totalPayable = supplierOverviews.reduce((sum, s) => sum + s.payable, 0);
    return {
      totalPayable,
      supplierCount: supplierOverviews.length
    };
  }, [supplierOverviews]);

  // FILTERED OVERVIEWS
  const filteredOverviews = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return supplierOverviews.filter((s) => {
      const matchesQ = !q || s.supplierName.toLowerCase().includes(q) || s.supplierId.toLowerCase().includes(q);
      const matchesSelect = selectedSupplierId === 'ALL' || s.supplierId === selectedSupplierId;
      return matchesQ && matchesSelect;
    });
  }, [supplierOverviews, searchQuery, selectedSupplierId]);

  // SUPPLIER SPECIFIC LEDGER ENTRIES
  const selectedSupplierEntries = useMemo(() => {
    if (selectedSupplierId === 'ALL') return [];
    return entries.filter((e) => e.supplierId === selectedSupplierId);
  }, [entries, selectedSupplierId]);

  // PAGINATION
  const totalPages = Math.max(1, Math.ceil(filteredOverviews.length / pageSize));
  const paginatedOverviews = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return filteredOverviews.slice(startIdx, startIdx + pageSize);
  }, [filteredOverviews, currentPage, pageSize]);

  // HANDLERS
  const handleAddClick = () => {
    setEditingEntry(null);
    setIsFormModalOpen(true);
  };

  const handleEditClick = (entry: WebSupplierLedgerEntry) => {
    setEditingEntry(entry);
    setIsFormModalOpen(true);
  };

  const handleSaveEntry = async (
    supplierId: string,
    supplierName: string,
    date: string,
    transactionType: string,
    amount: number,
    reference?: string,
    paymentMode?: string,
    description?: string
  ) => {
    if (editingEntry) {
      setEntries((prev) =>
        prev.map((e) =>
          e.id === editingEntry.id
            ? { ...e, supplierId, supplierName, date, transactionType, amount, reference, paymentMode, description }
            : e
        )
      );

      try {
        await supabase
          .from('supplier_ledger')
          .update({
            supplier_id: supplierId,
            supplier_name: supplierName,
            date,
            transaction_type: transactionType,
            amount,
            reference,
            payment_mode: paymentMode,
            description
          })
          .eq('id', editingEntry.id);
      } catch (e) {
        console.log('Supabase update error', e);
      }

      showToast(`Ledger entry for "${supplierName}" updated.`);
    } else {
      const nextId = `SLE-${100 + entries.length + 1}`;
      const newE: WebSupplierLedgerEntry = {
        id: nextId,
        supplierId,
        supplierName,
        date,
        transactionType,
        amount,
        reference,
        paymentMode,
        description,
        createdAt: 'Just now'
      };

      setEntries((prev) => [newE, ...prev]);

      try {
        await supabase.from('supplier_ledger').insert([
          {
            id: nextId,
            supplier_id: supplierId,
            supplier_name: supplierName,
            date,
            transaction_type: transactionType,
            amount,
            reference,
            payment_mode: paymentMode,
            description
          }
        ]);
      } catch (e) {
        console.log('Supabase insert error', e);
      }

      showToast(`Ledger entry for "${supplierName}" recorded.`);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingEntry) return;
    const targetId = deletingEntry.id;
    const targetSup = deletingEntry.supplierName;

    setEntries((prev) => prev.filter((e) => e.id !== targetId));

    try {
      await supabase.from('supplier_ledger').delete().eq('id', targetId);
    } catch (e) {
      console.log('Supabase delete error', e);
    }

    showToast(`Ledger entry for "${targetSup}" deleted.`);
    setDeletingEntry(null);
  };

  // EXPORT HANDLERS
  const handleExportCSV = () => {
    const headers = ['Supplier ID', 'Supplier Name', 'Opening (INR)', 'Purchases (INR)', 'Paid (INR)', 'Returns (INR)', 'Payable (INR)'];
    const rows = supplierOverviews.map((s) => [
      s.supplierId,
      `"${s.supplierName}"`,
      s.opening,
      s.purchases,
      s.paid,
      s.returns,
      s.payable
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'supplier_ledger_summary.csv');
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
            <h1 className="udhaari-title-text">Supplier Ledger</h1>
            <div className="udhaari-subtitle-text">Track supplier payables, purchases, payments & return records</div>
          </div>

          <div className="udhaari-header-buttons">
            <button className="btn-secondary-udhaari" onClick={fetchLedgerFromSupabase}>
              Refresh
            </button>
            <button className="btn-secondary-udhaari" onClick={handleExportCSV}>
              CSV
            </button>
            <button className="btn-secondary-udhaari" onClick={handlePrint}>
              Print
            </button>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="udhaari-summary-grid">
          <div className="udhaari-card-box">
            <div className="udhaari-stat-label">TOTAL PAYABLE (WE OWE)</div>
            <div className="udhaari-stat-value text-red">₹{headerSummary.totalPayable.toFixed(2)}</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Calculated from active supplier transactions</div>
          </div>

          <div className="udhaari-card-box">
            <div className="udhaari-stat-label">SUPPLIERS</div>
            <div className="udhaari-stat-value text-blue">{headerSummary.supplierCount}</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Suppliers with ledger activity</div>
          </div>

          <div className="udhaari-card-box" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <button className="btn-primary-udhaari" style={{ backgroundColor: '#16a34a', width: '100%', padding: '12px' }} onClick={handleAddClick}>
              + Add Entry
            </button>
          </div>
        </div>

        {/* PICK SUPPLIER SECTION */}
        <div className="udhaari-card-box" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 12px 0' }}>
            Pick Supplier
          </h3>

          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              className="form-control"
              style={{ width: '100%', maxWidth: '380px' }}
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
            >
              <option value="ALL">All Suppliers (Overview)</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.id})
                </option>
              ))}
            </select>

            <button className="btn-secondary-udhaari" onClick={fetchLedgerFromSupabase}>
              Refresh
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

        {/* ALL SUPPLIERS - PAYABLE OVERVIEW TABLE */}
        <div className="udhaari-card-box" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              {selectedSupplierId === 'ALL'
                ? 'All Suppliers — Payable Overview'
                : `Ledger for ${suppliers.find((s) => s.id === selectedSupplierId)?.name || 'Selected Supplier'}`}
            </h3>

            <div className="items-search-box" style={{ width: '100%', maxWidth: '320px' }}>
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                className="items-search-input"
                placeholder="Search supplier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {selectedSupplierId === 'ALL' ? (
            /* OVERVIEW TABLE */
            <div style={{ overflowX: 'auto' }}>
              <table className="udhaari-table">
                <thead>
                  <tr>
                    <th>SUPPLIER</th>
                    <th>OPENING</th>
                    <th>PURCHASES</th>
                    <th>PAID</th>
                    <th>RETURNS</th>
                    <th>PAYABLE</th>
                    <th style={{ textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOverviews.map((overview) => (
                    <tr key={overview.supplierId}>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{overview.supplierName}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>ID: {overview.supplierId}</div>
                      </td>
                      <td style={{ color: '#475569' }}>₹{overview.opening.toFixed(2)}</td>
                      <td style={{ fontWeight: 600, color: '#0284c7' }}>₹{overview.purchases.toFixed(2)}</td>
                      <td style={{ fontWeight: 600, color: '#16a34a' }}>₹{overview.paid.toFixed(2)}</td>
                      <td style={{ color: '#64748b' }}>₹{overview.returns.toFixed(2)}</td>
                      <td style={{ fontWeight: 800, color: overview.payable > 0 ? '#dc2626' : '#16a34a' }}>
                        ₹{overview.payable.toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn-action-view"
                          onClick={() => setSelectedSupplierId(overview.supplierId)}
                        >
                          View Ledger
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* SUPPLIER SPECIFIC DETAILED TRANSACTIONS TABLE */
            <div style={{ overflowX: 'auto' }}>
              <table className="udhaari-table">
                <thead>
                  <tr>
                    <th>DATE</th>
                    <th>TYPE</th>
                    <th>REFERENCE</th>
                    <th>AMOUNT</th>
                    <th>PAYMENT MODE</th>
                    <th>DESCRIPTION</th>
                    <th style={{ textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSupplierEntries.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                        No transactions recorded for this supplier yet.
                      </td>
                    </tr>
                  ) : (
                    selectedSupplierEntries.map((entry) => (
                      <tr key={entry.id}>
                        <td style={{ fontWeight: 600, color: '#334155' }}>{entry.date}</td>
                        <td>
                          <span
                            className="udhaari-badge"
                            style={{
                              backgroundColor:
                                entry.transactionType === 'Purchase'
                                  ? '#e0f2fe'
                                  : entry.transactionType === 'Payment'
                                  ? '#dcfce7'
                                  : '#f1f5f9',
                              color:
                                entry.transactionType === 'Purchase'
                                  ? '#0284c7'
                                  : entry.transactionType === 'Payment'
                                  ? '#16a34a'
                                  : '#475569'
                            }}
                          >
                            {entry.transactionType}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, color: '#0f172a' }}>{entry.reference || '—'}</td>
                        <td style={{ fontWeight: 800, color: entry.transactionType === 'Payment' ? '#16a34a' : '#0f172a' }}>
                          ₹{entry.amount.toFixed(2)}
                        </td>
                        <td>{entry.paymentMode || 'Cash'}</td>
                        <td style={{ fontSize: '13px', color: '#64748b' }}>{entry.description || '—'}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button className="btn-action-view" onClick={() => handleEditClick(entry)}>
                              Edit
                            </button>
                            <button
                              className="btn-action-settle"
                              style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}
                              onClick={() => setDeletingEntry(entry)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* PAGINATION FOOTER FOR OVERVIEW */}
          {selectedSupplierId === 'ALL' && filteredOverviews.length > 0 && (
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
                {Math.min(currentPage * pageSize, filteredOverviews.length)} of {filteredOverviews.length} suppliers
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
        <SupplierLedgerEntryModal
          isOpen={isFormModalOpen}
          editingEntry={editingEntry}
          onClose={() => setIsFormModalOpen(false)}
          onSave={handleSaveEntry}
        />

        <DeleteSupplierLedgerDialog
          isOpen={deletingEntry !== null}
          entry={deletingEntry}
          onClose={() => setDeletingEntry(null)}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </div>
  );
};
