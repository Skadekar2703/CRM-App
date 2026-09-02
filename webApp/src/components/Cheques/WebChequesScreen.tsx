import React, { useState, useMemo, useEffect } from 'react';
import { Cheque, INITIAL_CHEQUES } from '../../types/cheques';
import { ChequeModal } from './ChequeModal';
import { DeleteChequeDialog } from './DeleteChequeDialog';
import { supabase } from '../../lib/supabase';
import './Cheques.css';

export const WebChequesScreen: React.FC = () => {
  const [cheques, setCheques] = useState<Cheque[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [directionFilter, setDirectionFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCheque, setEditingCheque] = useState<Cheque | null>(null);
  const [deletingCheque, setDeletingCheque] = useState<Cheque | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadChequesFromSupabase = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('cheques')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        setCheques(
          data.map((c: any) => ({
            id: c.id,
            chequeNo: c.cheque_number || c.chequeNo || 'CHK-000',
            partyName: c.party_name || 'Party Name',
            bankName: c.bank_name || 'HDFC Bank',
            amount: Number(c.amount || 0),
            direction: c.party_type === 'Supplier' ? 'Outward' : 'Inward',
            issueDate: c.issue_date ? c.issue_date.split('T')[0] : 'Today',
            dueDate: c.due_date ? c.due_date.split('T')[0] : 'Today',
            status: c.status || 'Pending',
            notes: c.notes || '',
            createdDate: c.created_at ? new Date(c.created_at).toLocaleDateString() : 'Today'
          }))
        );
      } else {
        setCheques(INITIAL_CHEQUES);
      }
    } catch {
      setCheques(INITIAL_CHEQUES);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadChequesFromSupabase();
  }, []);

  console.log('Loading state:', isLoading);

  // CALCULATED SUMMARY COUNTS (4 CARDS)
  const allCount = cheques.length;
  const pendingCount = cheques.filter((c) => c.status === 'Pending').length;
  const clearedCount = cheques.filter((c) => c.status === 'Cleared').length;
  const bouncedCount = cheques.filter((c) => c.status === 'Bounced').length;

  // FILTERED DATA
  const filteredCheques = useMemo(() => {
    return cheques.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        c.id.toLowerCase().includes(q) ||
        c.chequeNo.toLowerCase().includes(q) ||
        c.partyName.toLowerCase().includes(q) ||
        c.bankName.toLowerCase().includes(q);

      const matchesDirection = directionFilter === 'All' || c.direction === directionFilter;
      const matchesStatus = statusFilter === 'All' || c.status === statusFilter;

      return matchesQuery && matchesDirection && matchesStatus;
    });
  }, [cheques, searchQuery, directionFilter, statusFilter]);

  // PAGINATION LOGIC
  const totalEntries = filteredCheques.length;
  const totalPages = Math.ceil(totalEntries / itemsPerPage) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const paginatedData = filteredCheques.slice(startIndex, startIndex + itemsPerPage);

  // CRUD ACTIONS
  const handleAddClick = () => {
    setEditingCheque(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (cheque: Cheque) => {
    setEditingCheque(cheque);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (cheque: Cheque) => {
    setDeletingCheque(cheque);
  };

  const handleSaveCheque = async (
    chequeNo: string,
    partyName: string,
    bankName: string,
    amount: number,
    direction: 'Inward' | 'Outward',
    issueDate: string,
    dueDate: string,
    status: 'Pending' | 'Cleared' | 'Bounced',
    notes: string
  ) => {
    const partyType = direction === 'Outward' ? 'Supplier' : 'Customer';
    try {
      if (editingCheque) {
        const isUuid = /^[0-9a-fA-F-]{36}$/.test(editingCheque.id);
        if (isUuid) {
          await supabase
            .from('cheques')
            .update({
              cheque_number: chequeNo,
              party_name: partyName,
              party_type: partyType,
              bank_name: bankName,
              amount,
              issue_date: issueDate,
              due_date: dueDate,
              status,
              notes
            })
            .eq('id', editingCheque.id);
        }
        setCheques((prev) =>
          prev.map((c) =>
            c.id === editingCheque.id
              ? { ...c, chequeNo, partyName, bankName, amount, direction, issueDate, dueDate, status, notes }
              : c
          )
        );
        showToast(`Cheque "${chequeNo}" updated successfully.`);
      } else {
        const { data } = await supabase.from('cheques').insert([
          {
            cheque_number: chequeNo,
            party_name: partyName,
            party_type: partyType,
            bank_name: bankName,
            amount,
            issue_date: issueDate,
            due_date: dueDate,
            status,
            notes
          }
        ]).select();

        const created = data && data[0];
        const newCheque: Cheque = {
          id: created?.id || `chk_${Date.now()}`,
          chequeNo,
          partyName,
          bankName,
          amount,
          direction,
          issueDate,
          dueDate,
          status,
          notes,
          createdDate: 'Just now'
        };
        setCheques((prev) => [newCheque, ...prev]);
        showToast(`New Cheque "${chequeNo}" added successfully.`);
      }
    } catch (e: any) {
      showToast(`Cheque operation failed: ${e.message || e}`);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCheque) return;
    try {
      const isUuid = /^[0-9a-fA-F-]{36}$/.test(deletingCheque.id);
      if (isUuid) {
        await supabase.from('cheques').delete().eq('id', deletingCheque.id);
      }
      setCheques((prev) => prev.filter((c) => c.id !== deletingCheque.id));
      showToast(`Cheque "${deletingCheque.chequeNo}" deleted.`);
    } catch (e: any) {
      showToast(`Delete failed: ${e.message || e}`);
    } finally {
      setDeletingCheque(null);
    }
  };

  // EXPORT HANDLERS
  const handleExportCSV = () => {
    const headers = ['DATE', 'CHEQUE NO', 'PARTY', 'BANK', 'AMOUNT (₹)', 'DIRECTION', 'STATUS'];
    const rows = filteredCheques.map((c) => [
      `"${c.issueDate}"`,
      `"${c.chequeNo}"`,
      `"${c.partyName}"`,
      `"${c.bankName}"`,
      `"₹${c.amount.toFixed(2)}"`,
      c.direction,
      c.status
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cheques_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV export downloaded.');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="crm-content">
      <div className="cheques-container">
        {/* PAGE HEADER (WEB REF) */}
        <div className="cheques-page-header">
          <div>
            <h1 className="cheques-title-text">Cheque Register</h1>
            <div className="cheques-subtitle-text">
              Track and manage inward and outward cheque records
            </div>
          </div>

          <button className="btn-primary-item" onClick={handleAddClick}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            + New Cheque
          </button>
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

        {/* 4 SUMMARY CARDS (WEB REF) */}
        <div className="cheques-summary-cards">
          {/* CARD 1: ALL CHEQUES */}
          <div className="summary-card-cheque">
            <div>
              <div className="cheque-card-label">ALL CHEQUES</div>
              <div className="cheque-card-value">{allCount}</div>
            </div>
            <div className="cheque-icon-box blue">
              <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>

          {/* CARD 2: PENDING */}
          <div className="summary-card-cheque">
            <div>
              <div className="cheque-card-label">PENDING</div>
              <div className="cheque-card-value">{pendingCount}</div>
            </div>
            <div className="cheque-icon-box orange">
              <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          {/* CARD 3: CLEARED */}
          <div className="summary-card-cheque">
            <div>
              <div className="cheque-card-label">CLEARED</div>
              <div className="summary-card-value">{clearedCount}</div>
            </div>
            <div className="cheque-icon-box green">
              <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          {/* CARD 4: BOUNCED */}
          <div className="summary-card-cheque">
            <div>
              <div className="cheque-card-label">BOUNCED</div>
              <div className="summary-card-value">{bouncedCount}</div>
            </div>
            <div className="cheque-icon-box red">
              <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
        </div>

        {/* MAIN CARD BOX & TOOLBAR (WEB REF) */}
        <div className="cheques-card-box">
          <div className="cheques-toolbar">
            {/* SEARCH & FILTERS */}
            <div className="cheques-filter-group">
              <div className="items-search-box" style={{ width: '220px' }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  className="items-search-input"
                  placeholder="Search cheques..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              <label style={{ fontSize: '13px', color: '#475569', fontWeight: 600 }}>Direction:</label>
              <select
                className="udhaari-select"
                value={directionFilter}
                onChange={(e) => setDirectionFilter(e.target.value)}
              >
                <option value="All">All</option>
                <option value="Inward">Inward</option>
                <option value="Outward">Outward</option>
              </select>

              <label style={{ fontSize: '13px', color: '#475569', fontWeight: 600, marginLeft: '8px' }}>Status:</label>
              <select
                className="udhaari-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All</option>
                <option value="Pending">Pending</option>
                <option value="Cleared">Cleared</option>
                <option value="Bounced">Bounced</option>
              </select>
            </div>

            {/* ACTION BUTTONS */}
            <div className="toolbar-action-buttons">
              <button className="btn-icon-text" onClick={() => showToast('Cheques refreshed.')} title="Refresh">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              <button className="btn-icon-text" onClick={handleExportCSV} title="Export CSV">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>

              <button className="btn-icon-text" onClick={handlePrint} title="Export PDF">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>

              <button className="btn-icon-text" onClick={handlePrint} title="Print">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
              </button>
            </div>
          </div>

          {/* DESKTOP CHEQUES TABLE (WEB REF) */}
          {paginatedData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: '14px' }}>
              No cheque records found.
            </div>
          ) : (
            <table className="cheques-table">
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>CHEQUE NO</th>
                  <th>PARTY</th>
                  <th>BANK</th>
                  <th>AMOUNT (₹)</th>
                  <th>DIRECTION</th>
                  <th>STATUS</th>
                  <th style={{ textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((cheque) => (
                  <tr key={cheque.id}>
                    <td style={{ color: '#64748b', fontSize: '13px' }}>{cheque.issueDate}</td>
                    <td style={{ fontWeight: 700, color: '#0284c7', fontSize: '13px' }}>{cheque.chequeNo}</td>
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>{cheque.partyName}</td>
                    <td style={{ color: '#475569', fontSize: '13px' }}>{cheque.bankName}</td>
                    <td style={{ fontWeight: 800, color: '#0f172a' }}>
                      ₹{cheque.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <span className={`badge-direction ${cheque.direction.toLowerCase()}`}>
                        {cheque.direction}
                      </span>
                    </td>
                    <td>
                      <span className={`badge-cheque-status ${cheque.status.toLowerCase()}`}>
                        {cheque.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons-cell" style={{ justifyContent: 'flex-end' }}>
                        <button className="action-btn-icon" onClick={() => handleEditClick(cheque)} title="Edit Cheque">
                          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button className="action-btn-icon delete" onClick={() => handleDeleteClick(cheque)} title="Delete Cheque">
                          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* MOBILE CHEQUES LIST (MOBILE REF) */}
          <div className="mobile-cheques-list">
            {filteredCheques.map((cheque) => (
              <div key={cheque.id} className="mobile-cheque-card">
                <div className="mobile-cheque-card-top">
                  <div>
                    <div className="mobile-party-name">{cheque.partyName}</div>
                    <div className="mobile-cheque-ref">Ref: {cheque.chequeNo}</div>
                  </div>

                  <span className={`badge-cheque-status ${cheque.status.toLowerCase()}`}>
                    {cheque.status}
                  </span>
                </div>

                <div className="mobile-cheque-divider" />

                <div className="mobile-cheque-card-bottom">
                  <div className="mobile-cheque-date">Date: {cheque.issueDate}</div>
                  <div className="mobile-cheque-amount">
                    ₹{cheque.amount.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* PAGINATION FOOTER */}
          <div className="items-footer">
            <div>
              Showing {totalEntries > 0 ? startIndex + 1 : 0} to{' '}
              {Math.min(startIndex + itemsPerPage, totalEntries)} of {totalEntries} entries
            </div>

            <div className="pagination-group-item">
              <button
                className="page-btn-item"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`page-btn-item ${safePage === p ? 'active' : ''}`}
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </button>
              ))}

              <button
                className="page-btn-item"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* MODALS */}
        <ChequeModal
          isOpen={isModalOpen}
          editingCheque={editingCheque}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveCheque}
        />

        <DeleteChequeDialog
          isOpen={deletingCheque !== null}
          cheque={deletingCheque}
          onClose={() => setDeletingCheque(null)}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </div>
  );
};
