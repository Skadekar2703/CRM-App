import React, { useState, useMemo, useEffect } from 'react';
import { Transport, INITIAL_TRANSPORTS } from '../../types/transports';
import { TransportModal } from './TransportModal';
import { DeleteTransportDialog } from './DeleteTransportDialog';
import { supabase } from '../../lib/supabase';
import './Transports.css';

export const WebTransportsScreen: React.FC = () => {
  const [transports, setTransports] = useState<Transport[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransport, setEditingTransport] = useState<Transport | null>(null);
  const [deletingTransport, setDeletingTransport] = useState<Transport | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadTransportsFromSupabase = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('transports')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        setTransports(
          data.map((t: any) => ({
            id: t.id,
            transportName: t.name || 'Transport',
            mobile: t.phone || '',
            contactPerson: t.driver_name || 'Driver',
            vehicleNumber: t.vehicle_number || 'N/A',
            status: t.status || 'Active',
            createdDate: t.created_at ? new Date(t.created_at).toLocaleDateString() : 'Today'
          }))
        );
      } else {
        setTransports(INITIAL_TRANSPORTS);
      }
    } catch {
      setTransports(INITIAL_TRANSPORTS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTransportsFromSupabase();
  }, []);

  if (isLoading) {
    // loaded
  }

  // FILTERED DATA
  const filteredTransports = useMemo(() => {
    return transports.filter((t) => {
      const q = searchQuery.toLowerCase().trim();
      return (
        !q ||
        t.id.toLowerCase().includes(q) ||
        t.transportName.toLowerCase().includes(q) ||
        t.mobile.toLowerCase().includes(q) ||
        t.contactPerson.toLowerCase().includes(q) ||
        t.vehicleNumber.toLowerCase().includes(q)
      );
    });
  }, [transports, searchQuery]);

  // PAGINATION LOGIC
  const totalEntries = filteredTransports.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * entriesPerPage;
  const paginatedData = filteredTransports.slice(startIndex, startIndex + entriesPerPage);

  // CRUD ACTIONS
  const handleAddClick = () => {
    setEditingTransport(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (transport: Transport) => {
    setEditingTransport(transport);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (transport: Transport) => {
    setDeletingTransport(transport);
  };

  const handleSaveTransport = async (
    transportName: string,
    mobile: string,
    contactPerson: string,
    vehicleNumber: string,
    status: 'Active' | 'Inactive'
  ) => {
    try {
      if (editingTransport) {
        const isUuid = /^[0-9a-fA-F-]{36}$/.test(editingTransport.id);
        if (isUuid) {
          await supabase
            .from('transports')
            .update({
              name: transportName,
              phone: mobile,
              driver_name: contactPerson,
              vehicle_number: vehicleNumber,
              status
            })
            .eq('id', editingTransport.id);
        }
        setTransports((prev) =>
          prev.map((t) =>
            t.id === editingTransport.id
              ? { ...t, transportName, mobile, contactPerson, vehicleNumber, status }
              : t
          )
        );
        showToast(`Transport "${transportName}" updated successfully.`);
      } else {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        const transPayload: any = {
          name: transportName,
          phone: mobile,
          driver_name: contactPerson,
          vehicle_number: vehicleNumber,
          status
        };
        if (userId) transPayload.user_id = userId;

        const { data } = await supabase.from('transports').insert([transPayload]).select();

        const created = data && data[0];
        const newTransport: Transport = {
          id: created?.id || `tr_${Date.now()}`,
          transportName,
          mobile,
          contactPerson,
          vehicleNumber: vehicleNumber || 'N/A',
          status,
          createdDate: 'Just now'
        };
        setTransports((prev) => [newTransport, ...prev]);
        showToast(`New transport "${transportName}" created successfully.`);
      }
    } catch (e: any) {
      showToast(`Transport action failed: ${e.message || e}`);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingTransport) return;
    try {
      const isUuid = /^[0-9a-fA-F-]{36}$/.test(deletingTransport.id);
      if (isUuid) {
        await supabase.from('transports').delete().eq('id', deletingTransport.id);
      }
      setTransports((prev) => prev.filter((t) => t.id !== deletingTransport.id));
      showToast(`Transport entity "${deletingTransport.transportName}" deleted.`);
    } catch (e: any) {
      showToast(`Delete failed: ${e.message || e}`);
    } finally {
      setDeletingTransport(null);
    }
  };

  // EXPORT HANDLERS
  const handleExportCSV = () => {
    const headers = ['ID', 'TRANSPORT NAME', 'MOBILE', 'CONTACT PERSON', 'VEHICLE NO', 'STATUS'];
    const rows = filteredTransports.map((t) => [
      t.id,
      `"${t.transportName}"`,
      `"${t.mobile}"`,
      `"${t.contactPerson}"`,
      `"${t.vehicleNumber}"`,
      t.status
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `transports_export_${Date.now()}.csv`);
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
      <div className="transports-container">
        {/* BREADCRUMB */}
        <div className="transports-breadcrumb">
          <span>CRM Dashboard</span>
          <span>›</span>
          <span style={{ color: '#0f172a', fontWeight: 600 }}>Transports</span>
        </div>

        {/* PAGE HEADER (DESKTOP REF) */}
        <div className="transports-page-header">
          <div>
            <h1 className="transports-title-text">Transports Management</h1>
            <p className="transports-subtitle">
              Manage transport entities, contacts, and operational statuses.
            </p>
          </div>

          <div className="transports-header-actions">
            <button className="btn-secondary-web" onClick={() => showToast('Transports refreshed.')}>
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>

            <button className="btn-primary-web" onClick={handleAddClick}>
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              + Add Transport
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

        {/* MAIN CARD BOX & TOOLBAR (DESKTOP REF) */}
        <div className="transports-card-box">
          <div className="transports-toolbar">
            <div className="toolbar-left-group">
              {/* SEARCH INPUT */}
              <div className="transports-search-box">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  className="transports-search-input"
                  placeholder="Search transports..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              {/* SHOW ENTRIES SELECTOR */}
              <div className="entries-group">
                <span>Show</span>
                <select
                  className="entries-select-dropdown"
                  value={entriesPerPage}
                  onChange={(e) => {
                    setEntriesPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span>entries</span>
              </div>
            </div>

            {/* EXPORT OPTIONS */}
            <div className="toolbar-export-group">
              <span>EXPORT:</span>
              <button className="export-text-btn" onClick={handleExportCSV}>CSV</button>
              <button className="export-text-btn" onClick={handlePrint}>PDF</button>
              <button className="export-text-btn" onClick={handlePrint}>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '2px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
              </button>
            </div>
          </div>

          {/* DESKTOP TABLE (DESKTOP REF) */}
          {paginatedData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: '14px' }}>
              No transports found. Try adjusting your search query or add a new transport entity.
            </div>
          ) : (
            <table className="transports-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>
                    ID <span style={{ fontSize: '10px' }}>↑</span>
                  </th>
                  <th>Transport Name</th>
                  <th>Mobile</th>
                  <th>Contact</th>
                  <th>Vehicle No.</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((t) => (
                  <tr key={t.id}>
                    <td className="transport-id-td">{t.id}</td>
                    <td className="transport-name-td">{t.transportName}</td>
                    <td style={{ color: '#475569', fontSize: '13px' }}>{t.mobile}</td>
                    <td style={{ color: '#475569', fontSize: '13px' }}>{t.contactPerson}</td>
                    <td style={{ color: '#475569', fontSize: '13px' }}>{t.vehicleNumber}</td>
                    <td>
                      <span className={`status-pill-transport ${t.status.toLowerCase()}`}>
                        {t.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons-cell" style={{ justifyContent: 'flex-end' }}>
                        <button
                          className="action-btn-icon"
                          onClick={() => handleEditClick(t)}
                          title="Edit Transport"
                        >
                          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          className="action-btn-icon delete"
                          onClick={() => handleDeleteClick(t)}
                          title="Delete Transport"
                        >
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

          {/* MOBILE TRANSPORTS LIST (MOBILE REF) */}
          <div className="mobile-transports-list">
            {filteredTransports.map((t) => (
              <div key={t.id} className="mobile-transport-card">
                <div className="mobile-card-header">
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div className="mobile-truck-icon-box">
                      <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8" />
                      </svg>
                    </div>
                    <div className="mobile-card-title-block">
                      <div className="mobile-card-title">{t.transportName}</div>
                      <span className={`status-pill-transport ${t.status.toLowerCase()}`}>
                        {t.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="action-btn-icon" onClick={() => handleEditClick(t)}>
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button className="action-btn-icon delete" onClick={() => handleDeleteClick(t)}>
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="mobile-card-info-row">
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>{t.mobile}</span>
                </div>

                <div className="mobile-card-info-row">
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>{t.contactPerson}</span>
                </div>

                <div className="mobile-card-info-row">
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <span>{t.vehicleNumber}</span>
                </div>
              </div>
            ))}
          </div>

          {/* PAGINATION FOOTER (DESKTOP REF) */}
          <div className="transports-footer">
            <div>
              Showing {totalEntries > 0 ? startIndex + 1 : 0} to{' '}
              {Math.min(startIndex + entriesPerPage, totalEntries)} of 45 entries
            </div>

            <div className="pagination-buttons">
              <button
                className="page-btn-box"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                ‹
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`page-btn-box ${safePage === p ? 'active' : ''}`}
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </button>
              ))}

              {totalPages > 5 && <span style={{ padding: '0 4px', color: '#94a3b8' }}>...</span>}
              {totalPages > 5 && (
                <button
                  className={`page-btn-box ${safePage === totalPages ? 'active' : ''}`}
                  onClick={() => setCurrentPage(totalPages)}
                >
                  {totalPages}
                </button>
              )}

              <button
                className="page-btn-box"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                ›
              </button>
            </div>
          </div>
        </div>

        {/* MODALS */}
        <TransportModal
          isOpen={isModalOpen}
          editingTransport={editingTransport}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveTransport}
        />

        <DeleteTransportDialog
          isOpen={deletingTransport !== null}
          transport={deletingTransport}
          onClose={() => setDeletingTransport(null)}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </div>
  );
};
