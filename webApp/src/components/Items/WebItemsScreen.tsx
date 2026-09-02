import React, { useState, useMemo, useEffect } from 'react';
import { Item, INITIAL_ITEMS } from '../../types/items';
import { ItemModal } from './ItemModal';
import { DeleteItemDialog } from './DeleteItemDialog';
import { supabase } from '../../lib/supabase';
import './Items.css';

export const WebItemsScreen: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [deletingItem, setDeletingItem] = useState<Item | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadItemsFromSupabase = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        setItems(
          data.map((p: any) => ({
            id: p.id,
            name: p.name,
            brand: p.brand || 'Generic',
            code: p.sku || '',
            category: p.category || 'General',
            unit: p.unit || 'Pcs',
            lowStockAlert: p.low_stock_alert ?? 5,
            salePrice: Number(p.price || 0),
            status: p.stock_quantity <= 0 ? 'Draft' : p.stock_quantity <= (p.low_stock_alert || 5) ? 'Low Stock' : p.status || 'Active',
            createdDate: p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Today'
          }))
        );
      } else {
        setItems(INITIAL_ITEMS);
      }
    } catch {
      setItems(INITIAL_ITEMS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadItemsFromSupabase();
  }, []);

  // FILTERED DATA
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      return (
        !q ||
        item.id.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [items, searchQuery]);

  // PAGINATION LOGIC
  const totalEntries = filteredItems.length;
  const totalPages = Math.ceil(totalEntries / itemsPerPage) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const paginatedData = filteredItems.slice(startIndex, startIndex + itemsPerPage);

  // CRUD ACTIONS
  const handleAddClick = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (item: Item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (item: Item) => {
    setDeletingItem(item);
  };

  const handleSaveItem = async (
    name: string,
    brand: string,
    code: string,
    category: string,
    unit: string,
    lowStockAlert: number,
    salePrice: number,
    status: 'Active' | 'Low Stock' | 'Draft' | 'Inactive'
  ) => {
    const sku = code || `SKU-${Date.now().toString().slice(-6)}`;
    if (editingItem) {
      const { error } = await supabase
        .from('items')
        .update({
          name,
          brand,
          sku,
          category,
          unit,
          low_stock_alert: lowStockAlert,
          price: salePrice,
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingItem.id);

      if (error) {
        showToast(`Error: ${error.message}`);
      } else {
        showToast(`Item "${name}" updated successfully.`);
        loadItemsFromSupabase();
      }
    } else {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      const itemPayload: any = {
        name,
        brand,
        sku,
        category,
        unit,
        stock_quantity: 10,
        low_stock_alert: lowStockAlert,
        price: salePrice,
        status
      };
      if (userId) itemPayload.user_id = userId;

      const { error } = await supabase.from('items').insert(itemPayload);

      if (error) {
        showToast(`Error: ${error.message}`);
      } else {
        showToast(`New item "${name}" created successfully.`);
        loadItemsFromSupabase();
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    const { error } = await supabase.from('items').delete().eq('id', deletingItem.id);
    if (error) {
      showToast(`Delete error: ${error.message}`);
    } else {
      showToast(`Item "${deletingItem.name}" deleted.`);
      loadItemsFromSupabase();
    }
    setDeletingItem(null);
  };

  // EXPORT HANDLERS
  const handleExportCSV = () => {
    const headers = ['#', 'ITEM NAME', 'BRAND', 'CODE', 'CATEGORY', 'UNIT', 'LOW ALERT', 'SALE PRICE', 'STATUS'];
    const rows = filteredItems.map((i) => [
      i.id,
      `"${i.name}"`,
      `"${i.brand}"`,
      `"${i.code}"`,
      `"${i.category}"`,
      `"${i.unit}"`,
      i.lowStockAlert,
      `$${i.salePrice.toFixed(2)}`,
      i.status
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `items_export_${Date.now()}.csv`);
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
      <div className="items-container">
        {/* PAGE HEADER (REF 2) */}
        <div className="items-page-header">
          <h1 className="items-title-text">Items</h1>
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

        {/* MAIN CARD BOX & TOOLBAR (REF 2) */}
        <div className="items-card-box">
          <div className="items-toolbar">
            {/* SEARCH INPUT */}
            <div className="items-search-box">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                className="items-search-input"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* ACTION BUTTONS (REF 2) */}
            <div className="toolbar-action-buttons">
              <button className="btn-icon-text" onClick={handlePrint} title="Export PDF">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                PDF
              </button>

              <button className="btn-icon-text" onClick={handlePrint} title="Print">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </button>

              <button className="btn-icon-text" onClick={loadItemsFromSupabase} title="Refresh Items">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>

              <button className="btn-icon-text" onClick={handleExportCSV} title="Export CSV">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                CSV
              </button>

              <button className="btn-primary-item" onClick={handleAddClick}>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                + Add Item
              </button>
            </div>
          </div>

          {/* DESKTOP TABLE (REF 2) */}
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#0284c7', fontWeight: 600, fontSize: '14px' }}>
              Loading items from database...
            </div>
          ) : paginatedData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: '14px' }}>
              No items found. Try a different search query or click Add Item to create one.
            </div>
          ) : (
            <table className="items-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>#</th>
                  <th>ITEM NAME</th>
                  <th>BRAND</th>
                  <th>CODE</th>
                  <th>CATEGORY</th>
                  <th>UNIT</th>
                  <th>LOW ALERT</th>
                  <th>SALE PRICE</th>
                  <th>STATUS</th>
                  <th style={{ textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((item) => (
                  <tr key={item.id}>
                    <td className="item-id-td">{item.id}</td>
                    <td className="item-name-td">{item.name}</td>
                    <td style={{ color: '#475569', fontSize: '13px' }}>{item.brand}</td>
                    <td style={{ color: '#475569', fontSize: '13px' }}>{item.code}</td>
                    <td style={{ color: '#475569', fontSize: '13px' }}>{item.category}</td>
                    <td style={{ color: '#475569', fontSize: '13px' }}>{item.unit}</td>
                    <td style={{ color: '#475569', fontSize: '13px' }}>{item.lowStockAlert}</td>
                    <td className="item-price-td">${item.salePrice.toFixed(2)}</td>
                    <td>
                      <span
                        className={`badge-item-status ${item.status
                          .toLowerCase()
                          .replace(' ', '-')}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons-cell" style={{ justifyContent: 'flex-end' }}>
                        <button
                          className="action-btn-icon"
                          onClick={() => handleEditClick(item)}
                          title="Edit Item"
                        >
                          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          className="action-btn-icon delete"
                          onClick={() => handleDeleteClick(item)}
                          title="Delete Item"
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

          {/* MOBILE ITEMS LIST (REF 1) */}
          <div className="mobile-items-list">
            {filteredItems.map((item) => (
              <div key={item.id} className="mobile-item-card">
                <div className="mobile-item-card-top">
                  <div>
                    <div className="mobile-item-name">{item.name}</div>
                    <div className="mobile-item-subtitle">
                      {item.brand} • {item.category}
                    </div>
                  </div>

                  <span
                    className={`badge-item-status ${item.status
                      .toLowerCase()
                      .replace(' ', '-')}`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="mobile-item-card-bottom">
                  <div>
                    <div className="mobile-item-price-label">SALE PRICE</div>
                    <div className="mobile-item-price-val">${item.salePrice.toFixed(2)}</div>
                  </div>

                  <div className="mobile-item-actions">
                    <button className="mobile-action-btn-gray" onClick={() => handleEditClick(item)}>
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button className="mobile-action-btn-red" onClick={() => handleDeleteClick(item)}>
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* PAGINATION FOOTER (REF 2) */}
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
        <ItemModal
          isOpen={isModalOpen}
          editingItem={editingItem}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveItem}
        />

        <DeleteItemDialog
          isOpen={deletingItem !== null}
          item={deletingItem}
          onClose={() => setDeletingItem(null)}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </div>
  );
};
