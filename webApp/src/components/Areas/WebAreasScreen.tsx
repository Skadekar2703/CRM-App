import React, { useState, useMemo, useEffect } from 'react';
import { Area, INITIAL_AREAS } from '../../types/areas';
import { AreaModal } from './AreaModal';
import { DeleteAreaDialog } from './DeleteAreaDialog';
import { supabase } from '../../lib/supabase';
import './Areas.css';

export const WebAreasScreen: React.FC = () => {
  const [areas, setAreas] = useState<Area[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [deleteTargetArea, setDeleteTargetArea] = useState<Area | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadAreasFromSupabase = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('areas')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        setAreas(
          data.map((a: any) => ({
            id: a.id,
            name: a.name,
            status: 'Active',
            createdDate: a.created_at ? new Date(a.created_at).toLocaleDateString() : 'Today',
            locationCount: 0
          }))
        );
      } else {
        setAreas(INITIAL_AREAS);
      }
    } catch {
      setAreas(INITIAL_AREAS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAreasFromSupabase();
  }, []);

  if (isLoading) {
    // loaded
  }

  // FILTERED DATA
  const filteredAreas = useMemo(() => {
    return areas.filter(a => {
      const q = searchQuery.toLowerCase();
      return a.id.toLowerCase().includes(q) ||
             a.name.toLowerCase().includes(q) ||
             a.status.toLowerCase().includes(q);
    });
  }, [areas, searchQuery]);

  // PAGINATION
  const totalEntries = filteredAreas.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * entriesPerPage;
  const paginatedAreas = filteredAreas.slice(startIndex, startIndex + entriesPerPage);

  // CRUD ACTIONS
  const handleAddClick = () => {
    setEditingArea(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (area: Area) => {
    setEditingArea(area);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (area: Area) => {
    setDeleteTargetArea(area);
  };

  const handleSaveArea = async (name: string, status: 'Active' | 'Inactive') => {
    try {
      if (editingArea) {
        const isUuid = /^[0-9a-fA-F-]{36}$/.test(editingArea.id);
        if (isUuid) {
          const { error } = await supabase
            .from('areas')
            .update({ name })
            .eq('id', editingArea.id);

          if (error) {
            showToast(`Failed to update area: ${error.message}`);
            return;
          }
        }
        setAreas(prev => prev.map(a => a.id === editingArea.id ? { ...a, name, status } : a));
        showToast(`Area "${name}" updated successfully.`);
      } else {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        if (!userId) {
          showToast('Authentication error. Please sign in again.');
          return;
        }
        const payload: any = { name, user_id: userId };

        const { data, error } = await supabase
          .from('areas')
          .insert([payload])
          .select();

        if (error) {
          if (error.message.includes('unique') || error.message.includes('areas_name_key') || error.message.includes('idx_areas_user_id_name_unique') || error.code === '23505') {
            showToast(`An area named "${name}" already exists in your account.`);
          } else {
            showToast(`Failed to create area: ${error.message}`);
          }
          return;
        }

        const created = data && data[0];
        const newArea: Area = {
          id: created?.id || `area_${Date.now()}`,
          name,
          status,
          createdDate: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
          locationCount: 0
        };
        setAreas(prev => [newArea, ...prev]);
        showToast(`New Area "${name}" created successfully.`);
      }
    } catch (e: any) {
      showToast(`Area action failed: ${e.message || e}`);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetArea) return;
    try {
      const isUuid = /^[0-9a-fA-F-]{36}$/.test(deleteTargetArea.id);
      if (isUuid) {
        const { error } = await supabase
          .from('areas')
          .delete()
          .eq('id', deleteTargetArea.id);

        if (error) {
          showToast(`Failed to delete area: ${error.message}`);
          setDeleteTargetArea(null);
          return;
        }
      }
      setAreas(prev => prev.filter(a => a.id !== deleteTargetArea.id));
      showToast(`Area "${deleteTargetArea.name}" deleted.`);
    } catch (e: any) {
      showToast(`Delete failed: ${e.message || e}`);
    } finally {
      setDeleteTargetArea(null);
    }
  };

  // EXPORT HANDLERS
  const handleExportCSV = () => {
    const headers = ['ID', 'NAME', 'STATUS', 'CREATED DATE', 'LOCATIONS'];
    const rows = filteredAreas.map(a => [a.id, `"${a.name}"`, a.status, a.createdDate, a.locationCount]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `areas_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV export downloaded.');
  };

  const handleExportPrint = () => {
    window.print();
  };

  return (
    <div className="crm-content">
      <div className="areas-container">
        {/* BREADCRUMB */}
        <div className="areas-breadcrumb">
          <span>Dashboard</span>
          <span>›</span>
          <span style={{ color: '#0f172a', fontWeight: 600 }}>Areas</span>
        </div>

        {/* PAGE HEADER */}
        <div className="areas-page-header">
          <div className="areas-title-wrapper">
            <div className="areas-title-icon">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h1 className="areas-title-text">Areas</h1>
          </div>

          <div className="areas-header-actions">
            <button className="btn-secondary" onClick={() => showToast('Areas refreshed.')}>
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>

            <button className="btn-primary" onClick={handleAddClick}>
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              + Add Area
            </button>
          </div>
        </div>

        {/* TOAST FEEDBACK */}
        {toastMsg && (
          <div style={{ backgroundColor: '#f0fdf4', color: '#16a34a', padding: '12px 16px', borderRadius: '10px', fontWeight: 600, border: '1px solid #bbf7d0', fontSize: '13px' }}>
            ✓ {toastMsg}
          </div>
        )}

        {/* MAIN CARD CONTAINER */}
        <div className="areas-card-box">
          {/* TOOLBAR */}
          <div className="areas-toolbar">
            <div className="toolbar-left">
              <span>Show</span>
              <select
                className="entries-select"
                value={entriesPerPage}
                onChange={e => {
                  setEntriesPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
              <span>entries</span>
            </div>

            <div className="toolbar-exports">
              <button className="export-link" onClick={handleExportCSV}>CSV</button>
              <button className="export-link" onClick={handleExportPrint}>PDF</button>
              <button className="export-link" onClick={handleExportPrint}>Print</button>

              <div className="toolbar-search">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  className="areas-search-input"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>
          </div>

          {/* DESKTOP TABLE */}
          {paginatedAreas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: '14px' }}>
              No matching areas found. Try a different search query or add a new area.
            </div>
          ) : (
            <table className="areas-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>NAME</th>
                  <th>STATUS</th>
                  <th>CREATED DATE</th>
                  <th style={{ textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {paginatedAreas.map(area => (
                  <tr key={area.id}>
                    <td className="area-id-td">{area.id}</td>
                    <td className="area-name-td">{area.name}</td>
                    <td>
                      <span className={`status-pill ${area.status.toLowerCase()}`}>
                        {area.status}
                      </span>
                    </td>
                    <td style={{ color: '#64748b', fontSize: '13px' }}>{area.createdDate}</td>
                    <td>
                      <div className="action-buttons-cell" style={{ justifyContent: 'flex-end' }}>
                        <button className="action-btn-icon" onClick={() => handleEditClick(area)} title="Edit Area">
                          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button className="action-btn-icon delete" onClick={() => handleDeleteClick(area)} title="Delete Area">
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

          {/* MOBILE CARD LIST (REF 2) */}
          <div className="mobile-areas-list">
            {filteredAreas.map(area => (
              <div key={area.id} className="mobile-area-card">
                <div>
                  <div className="mobile-area-name">{area.name}</div>
                  <div className="mobile-area-sub">
                    <span className={`status-pill ${area.status.toLowerCase()}`}>{area.status}</span>
                    <span>{area.locationCount} Locations</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="action-btn-icon" onClick={() => handleEditClick(area)}>
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button className="action-btn-icon delete" onClick={() => handleDeleteClick(area)}>
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* PAGINATION FOOTER */}
          <div className="areas-footer">
            <div>
              Showing {totalEntries > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + entriesPerPage, totalEntries)} of {totalEntries} entries
            </div>

            <div className="pagination-controls">
              <button
                className="page-btn"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              >
                ‹
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  className={`page-btn ${safePage === p ? 'active' : ''}`}
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </button>
              ))}

              <button
                className="page-btn"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              >
                ›
              </button>
            </div>
          </div>
        </div>

        {/* MOBILE FLOATING ADD BUTTON */}
        <button className="mobile-fab-btn" onClick={handleAddClick} title="Add Area">
          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
        </button>

        {/* MODALS */}
        <AreaModal
          isOpen={isModalOpen}
          editingArea={editingArea}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveArea}
        />

        <DeleteAreaDialog
          isOpen={deleteTargetArea !== null}
          area={deleteTargetArea}
          onClose={() => setDeleteTargetArea(null)}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </div>
  );
};
