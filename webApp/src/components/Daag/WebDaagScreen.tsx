import React, { useState, useMemo, useEffect } from 'react';
import { WebStockMovement, INITIAL_WEB_DAAG_MOVEMENTS } from '../../types/daag';
import { DaagModal } from './DaagModal';
import { DeleteDaagDialog } from './DeleteDaagDialog';
import { supabase } from '../../lib/supabase';
import '../Udhaari/Udhaari.css';

export const WebDaagScreen: React.FC = () => {
  const [movements, setMovements] = useState<WebStockMovement[]>(INITIAL_WEB_DAAG_MOVEMENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [directionFilter, setDirectionFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(false);

  const [availableItems, setAvailableItems] = useState<{ id: string; name: string; sku?: string }[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // MODALS
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMovement, setEditingMovement] = useState<WebStockMovement | null>(null);
  const [deletingMovement, setDeletingMovement] = useState<WebStockMovement | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // FETCH SUPABASE DATA IF AVAILABLE
  const fetchMovementsFromSupabase = async () => {
    try {
      setIsLoading(true);
      const { data: itemData } = await supabase.from('items').select('*');
      let itemMovements: WebStockMovement[] = [];
      if (itemData && itemData.length > 0) {
        setAvailableItems(itemData.map((i: any) => ({ id: i.id, name: i.name, sku: i.sku || i.code })));

        // Map user's actual items to Daag view so Daag screen displays real inventory items
        itemMovements = itemData.map((item: any, idx: number) => ({
          id: `DAG-${item.code || item.id || (1001 + idx)}`,
          date: item.created_at ? new Date(item.created_at).toLocaleDateString('en-IN') : 'Active Item',
          direction: 'OUT' as const,
          item: item.name || 'Inventory Item',
          quantity: `${item.stock || 1} Pcs`,
          amount: Number(item.price || item.rate || 0.0),
          supplier: item.supplier || 'Main Warehouse',
          transport: item.transport || 'Local Cargo',
          status: (item.stock > 0 ? 'Pending' : 'Complete') as ('Pending' | 'Complete')
        }));
      }

      const { data, error } = await supabase.from('stock_movements').select('*');
      if (!error && data && data.length > 0) {
        const mapped: WebStockMovement[] = data.map((item: any, idx: number) => ({
          id: item.id || `TRX-${98234 + idx}`,
          date: item.date || item.created_at || 'Recent',
          direction: item.direction || 'IN',
          item: item.item_name || item.item || 'Item',
          quantity: item.quantity || '1 qty',
          amount: item.amount || 0.0,
          supplier: item.supplier || '—',
          transport: item.transport || '—',
          status: item.status || 'Pending'
        }));
        setMovements([...mapped, ...itemMovements]);
      } else {
        setMovements(itemMovements);
      }
    } catch (e) {
      console.log('Supabase stock movements read fallback', e);
      setMovements([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMovementsFromSupabase();
  }, []);

  // SUMMARIES
  const totalMovements = movements.length;
  const pendingCount = useMemo(() => movements.filter((m) => m.status === 'Pending').length, [movements]);
  const inTransitCount = useMemo(() => movements.filter((m) => m.status === 'In Transit').length, [movements]);
  const completeCount = useMemo(() => movements.filter((m) => m.status === 'Complete').length, [movements]);

  // FILTERED MOVEMENTS
  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        m.id.toLowerCase().includes(q) ||
        m.item.toLowerCase().includes(q) ||
        m.supplier.toLowerCase().includes(q) ||
        m.transport.toLowerCase().includes(q);

      const matchesDirection = directionFilter === 'All' || m.direction === directionFilter;
      const matchesStatus = statusFilter === 'All' || m.status === statusFilter;

      return matchesQuery && matchesDirection && matchesStatus;
    });
  }, [movements, searchQuery, directionFilter, statusFilter]);

  // PAGINATION
  const totalEntries = filteredMovements.length;
  const totalPages = Math.ceil(totalEntries / itemsPerPage) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const paginatedData = filteredMovements.slice(startIndex, startIndex + itemsPerPage);

  // CRUD HANDLERS
  const handleAddMovementClick = () => {
    setEditingMovement(null);
    setIsModalOpen(true);
  };

  const handleEditMovementClick = (movement: WebStockMovement) => {
    setEditingMovement(movement);
    setIsModalOpen(true);
  };

  const handleDeleteMovementClick = (movement: WebStockMovement) => {
    setDeletingMovement(movement);
  };

  const handleSaveMovement = async (
    direction: 'IN' | 'OUT',
    item: string,
    quantity: string,
    amount: number,
    supplier: string,
    transport: string,
    status: 'Complete' | 'Pending' | 'In Transit' | 'Cancelled',
    date: string
  ) => {
    if (editingMovement) {
      setMovements((prev) =>
        prev.map((m) =>
          m.id === editingMovement.id
            ? { ...m, direction, item, quantity, amount, supplier, transport, status, date }
            : m
        )
      );

      try {
        await supabase
          .from('stock_movements')
          .update({ direction, item_name: item, quantity, amount, supplier, transport, status, date })
          .eq('id', editingMovement.id);
      } catch (e) {
        console.log('Supabase update warning', e);
      }

      showToast(`Movement "${editingMovement.id}" updated.`);
    } else {
      const nextId = `TRX-${98234 + movements.length}`;
      const newM: WebStockMovement = {
        id: nextId,
        date,
        direction,
        item,
        quantity,
        amount,
        supplier,
        transport,
        status
      };
      setMovements((prev) => [newM, ...prev]);

      try {
        await supabase.from('stock_movements').insert([
          {
            id: nextId,
            direction,
            item_name: item,
            quantity,
            amount,
            supplier,
            transport,
            status,
            date
          }
        ]);
      } catch (e) {
        console.log('Supabase insert warning', e);
      }

      showToast(`New movement "${nextId}" recorded.`);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingMovement) return;
    const targetId = deletingMovement.id;
    setMovements((prev) => prev.filter((m) => m.id !== targetId));

    try {
      await supabase.from('stock_movements').delete().eq('id', targetId);
    } catch (e) {
      console.log('Supabase delete warning', e);
    }

    showToast(`Movement "${targetId}" deleted.`);
    setDeletingMovement(null);
  };

  // EXPORT CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'DATE', 'DIRECTION', 'ITEM', 'QUANTITY', 'AMOUNT', 'SUPPLIER', 'TRANSPORT', 'STATUS'];
    const rows = filteredMovements.map((m) => [
      m.id,
      `"${m.date}"`,
      m.direction,
      `"${m.item}"`,
      `"${m.quantity}"`,
      `"₹${m.amount}"`,
      `"${m.supplier}"`,
      `"${m.transport}"`,
      m.status
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `daag_stock_movements_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Stock movements CSV downloaded.');
  };

  const getStatusBadgeStyle = (st: string) => {
    switch (st) {
      case 'Complete':
        return { bg: '#dcfce7', text: '#16a34a' };
      case 'Pending':
        return { bg: '#fef9c3', text: '#ca8a04' };
      case 'In Transit':
        return { bg: '#e0f2fe', text: '#0284c7' };
      case 'Cancelled':
        return { bg: '#fef2f2', text: '#dc2626' };
      default:
        return { bg: '#f1f5f9', text: '#64748b' };
    }
  };

  return (
    <div className="crm-content">
      <div className="udhaari-container">
        {/* PAGE HEADER */}
        <div className="udhaari-page-header">
          <div>
            <h1 className="udhaari-title-text">Stock Movements (Daag)</h1>
            <div className="udhaari-subtitle-text">
              Manage and track all your inventory transit records
            </div>
          </div>

          <div className="udhaari-header-buttons">
            <button className="btn-secondary-udhaari" onClick={handleExportCSV}>
              Export
            </button>
            <button className="btn-primary-udhaari" onClick={handleAddMovementClick}>
              + New Movement
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

        {/* SUMMARY CARDS */}
        <div className="udhaari-summary-cards">
          {/* CARD 1: TOTAL MOVEMENTS */}
          <div className="summary-card-udhaari blue-accent">
            <div>
              <div className="summary-card-label">TOTAL MOVEMENTS</div>
              <div className="summary-card-value">{totalMovements}</div>
            </div>
            <div className="summary-icon-box blue-bg">
              <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8" />
              </svg>
            </div>
          </div>

          {/* CARD 2: PENDING */}
          <div className="summary-card-udhaari">
            <div>
              <div className="summary-card-label">PENDING</div>
              <div className="summary-card-value" style={{ color: '#ca8a04' }}>
                {pendingCount}
              </div>
            </div>
            <div className="summary-icon-box" style={{ backgroundColor: '#fef9c3', color: '#ca8a04' }}>
              <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          {/* CARD 3: IN TRANSIT */}
          <div className="summary-card-udhaari blue-accent">
            <div>
              <div className="summary-card-label">IN TRANSIT</div>
              <div className="summary-card-value" style={{ color: '#0284c7' }}>
                {inTransitCount}
              </div>
            </div>
            <div className="summary-icon-box blue-bg">
              <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>

          {/* CARD 4: COMPLETE */}
          <div className="summary-card-udhaari">
            <div>
              <div className="summary-card-label">COMPLETE</div>
              <div className="summary-card-value" style={{ color: '#16a34a' }}>
                {completeCount}
              </div>
            </div>
            <div className="summary-icon-box green-bg">
              <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        {/* MAIN DATA TABLE & TOOLBAR */}
        <div className="udhaari-card-box">
          <div className="udhaari-filter-toolbar">
            <div className="udhaari-filter-dropdowns">
              <div className="items-search-box" style={{ width: '240px' }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  className="items-search-input"
                  placeholder="Search movements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <label style={{ fontSize: '13px', color: '#475569', fontWeight: 600, marginLeft: '8px' }}>Direction:</label>
              <select className="udhaari-select" value={directionFilter} onChange={(e) => setDirectionFilter(e.target.value)}>
                <option value="All">All</option>
                <option value="IN">IN (Stock Received)</option>
                <option value="OUT">OUT (Dispatched)</option>
              </select>

              <label style={{ fontSize: '13px', color: '#475569', fontWeight: 600, marginLeft: '8px' }}>Status:</label>
              <select className="udhaari-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="All">All</option>
                <option value="Complete">Complete</option>
                <option value="Pending">Pending</option>
                <option value="In Transit">In Transit</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <button className="btn-secondary-udhaari" onClick={fetchMovementsFromSupabase} title="Refresh">
              Refresh
            </button>
          </div>

          {/* TABLE */}
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>Loading stock movements...</div>
          ) : paginatedData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: '14px' }}>
              No stock movements found matching filters.
            </div>
          ) : (
            <table className="udhaari-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Direction</th>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Amount (₹)</th>
                  <th>Supplier</th>
                  <th>Transport</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((m) => {
                  const badge = getStatusBadgeStyle(m.status);
                  return (
                    <tr key={m.id}>
                      <td style={{ color: '#64748b', fontSize: '13px', fontWeight: 600 }}>{m.date}</td>
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 800,
                            backgroundColor: m.direction === 'IN' ? '#dcfce7' : '#eff6ff',
                            color: m.direction === 'IN' ? '#16a34a' : '#0284c7'
                          }}
                        >
                          {m.direction}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>
                        {m.item}
                        <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>{m.id}</div>
                      </td>
                      <td style={{ color: '#0f172a', fontWeight: 700, fontSize: '13px' }}>{m.quantity}</td>
                      <td style={{ color: '#475569', fontSize: '13px', fontWeight: 600 }}>
                        ₹{m.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ color: '#475569', fontSize: '13px' }}>{m.supplier}</td>
                      <td style={{ color: '#64748b', fontSize: '13px' }}>{m.transport}</td>
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 10px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 700,
                            backgroundColor: badge.bg,
                            color: badge.text
                          }}
                        >
                          {m.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons-cell" style={{ justifyContent: 'flex-end' }}>
                          <button
                            className="action-btn-icon"
                            onClick={() => handleEditMovementClick(m)}
                            title="Edit Movement"
                          >
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>

                          <button
                            className="action-btn-icon delete"
                            onClick={() => handleDeleteMovementClick(m)}
                            title="Delete Movement"
                          >
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

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
        <DaagModal
          isOpen={isModalOpen}
          editingMovement={editingMovement}
          availableItems={availableItems}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveMovement}
        />

        <DeleteDaagDialog
          isOpen={deletingMovement !== null}
          movement={deletingMovement}
          onClose={() => setDeletingMovement(null)}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </div>
  );
};
