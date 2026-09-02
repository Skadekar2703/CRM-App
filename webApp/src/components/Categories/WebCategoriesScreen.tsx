import React, { useState, useMemo, useEffect } from 'react';
import { Category, INITIAL_CATEGORIES } from '../../types/categories';
import { CategoryModal } from './CategoryModal';
import { DeleteCategoryDialog } from './DeleteCategoryDialog';
import { CategoryImportModal } from './CategoryImportModal';
import { supabase } from '../../lib/supabase';
import './Categories.css';

export const WebCategoriesScreen: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadCategoriesFromSupabase = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        setCategories(
          data.map((c: any) => ({
            id: c.id,
            name: c.name,
            type: 'Item Category',
            status: 'Active',
            createdDate: c.created_at ? new Date(c.created_at).toLocaleDateString() : 'Today',
            usageCount: 0,
            subText: c.description || 'System category'
          }))
        );
      } else {
        setCategories(INITIAL_CATEGORIES);
      }
    } catch {
      setCategories(INITIAL_CATEGORIES);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategoriesFromSupabase();
  }, []);

  if (isLoading) {
    // loaded
  }

  // FILTERED DATA
  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        c.id.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        (c.subText && c.subText.toLowerCase().includes(q));

      const matchesType =
        typeFilter === 'All Types' ||
        (typeFilter === 'Item Category' && c.type === 'Item Category') ||
        (typeFilter === 'Customer Category' && c.type === 'Customer Category');

      return matchesQuery && matchesType;
    });
  }, [categories, searchQuery, typeFilter]);

  // PAGINATION LOGIC
  const totalResults = filteredCategories.length;
  const totalPages = Math.ceil(totalResults / itemsPerPage) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const paginatedData = filteredCategories.slice(startIndex, startIndex + itemsPerPage);

  // SELECTION HANDLERS
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginatedData.map((c) => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // CRUD ACTIONS
  const handleAddClick = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (cat: Category) => {
    setEditingCategory(cat);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (cat: Category) => {
    setDeletingCategory(cat);
  };

  const handleSaveCategory = async (
    name: string,
    type: 'Item Category' | 'Customer Category',
    status: 'Active' | 'Inactive',
    subText?: string
  ) => {
    try {
      if (editingCategory) {
        const isUuid = /^[0-9a-fA-F-]{36}$/.test(editingCategory.id);
        if (isUuid) {
          const { error } = await supabase
            .from('categories')
            .update({ name, description: subText || '' })
            .eq('id', editingCategory.id);

          if (error) {
            showToast(`Failed to update category: ${error.message}`);
            return;
          }
        }
        setCategories((prev) =>
          prev.map((c) =>
            c.id === editingCategory.id ? { ...c, name, type, status, subText } : c
          )
        );
        showToast(`Category "${name}" updated successfully.`);
      } else {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        const payload: any = { name, description: subText || '' };
        if (userId) payload.user_id = userId;

        const { data, error } = await supabase
          .from('categories')
          .insert([payload])
          .select();

        if (error) {
          showToast(`Failed to create category: ${error.message}`);
          return;
        }

        const created = data && data[0];
        const newCat: Category = {
          id: created?.id || `cat_${Date.now()}`,
          name,
          type,
          status,
          createdDate: 'Just now',
          usageCount: 0,
          subText: subText || 'Newly added classification'
        };
        setCategories((prev) => [newCat, ...prev]);
        showToast(`New Category "${name}" created successfully.`);
      }
    } catch (e: any) {
      showToast(`Category operation failed: ${e.message || e}`);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCategory) return;
    try {
      const isUuid = /^[0-9a-fA-F-]{36}$/.test(deletingCategory.id);
      if (isUuid) {
        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('id', deletingCategory.id);

        if (error) {
          showToast(`Failed to delete category: ${error.message}`);
          setDeletingCategory(null);
          return;
        }
      }
      setCategories((prev) => prev.filter((c) => c.id !== deletingCategory.id));
      showToast(`Category "${deletingCategory.name}" deleted.`);
    } catch (e: any) {
      showToast(`Delete failed: ${e.message || e}`);
    } finally {
      setDeletingCategory(null);
    }
  };

  const handleImportSuccess = (count: number) => {
    loadCategoriesFromSupabase();
    showToast(`Successfully imported ${count} category records.`);
  };

  // EXPORT HANDLERS
  const handleExportCSV = () => {
    const headers = ['CATEGORY ID', 'NAME', 'TYPE', 'USAGE COUNT', 'STATUS'];
    const rows = filteredCategories.map((c) => [
      c.id,
      `"${c.name}"`,
      `"${c.type}"`,
      c.usageCount,
      c.status
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `categories_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV export generated.');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="crm-content">
      <div className="categories-container">
        {/* BREADCRUMB */}
        <div className="categories-breadcrumb">
          <span>CRM Dashboard</span>
          <span>›</span>
          <span style={{ color: '#0f172a', fontWeight: 600 }}>Categories</span>
        </div>

        {/* PAGE HEADER (REF 3) */}
        <div className="categories-page-header">
          <div>
            <h1 className="categories-title-text">Categories Management</h1>
            <p className="categories-subtitle">
              Organize and manage classification types across your inventory and contacts.
            </p>
          </div>

          <div className="categories-header-actions">
            <button className="btn-secondary-web" onClick={() => setIsImportOpen(true)}>
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import
            </button>

            <button className="btn-primary-web" onClick={handleAddClick}>
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              + New Category
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

        {/* MAIN CARD BOX & TOOLBAR (REF 3) */}
        <div className="categories-card-box">
          <div className="categories-toolbar">
            <div className="toolbar-filter-group">
              {/* SEARCH */}
              <div className="toolbar-search-box">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  className="toolbar-search-input"
                  placeholder="Search by name or ID..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              {/* TYPE DROPDOWN */}
              <select
                className="toolbar-select"
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="All Types">All Types</option>
                <option value="Item Category">Item Category</option>
                <option value="Customer Category">Customer Category</option>
              </select>

              {/* DATE RANGE PICKER MOCK */}
              <div className="toolbar-date-picker">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Oct 1 - Oct 31, 2023</span>
              </div>
            </div>

            {/* EXPORT ACTION BUTTONS (REF 3) */}
            <div className="toolbar-export-buttons">
              <button className="export-btn-square" title="Export CSV" onClick={handleExportCSV}>
                CSV
              </button>
              <button className="export-btn-square" title="Export PDF" onClick={handlePrint}>
                PDF
              </button>
              <button className="export-btn-square" title="Print" onClick={handlePrint}>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
              </button>
            </div>
          </div>

          {/* DESKTOP TABLE (REF 3) */}
          {paginatedData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: '14px' }}>
              No categories found. Adjust search query or add a new category.
            </div>
          ) : (
            <table className="categories-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={
                        paginatedData.length > 0 &&
                        paginatedData.every((c) => selectedIds.includes(c.id))
                      }
                    />
                  </th>
                  <th>CATEGORY ID</th>
                  <th>NAME</th>
                  <th>TYPE</th>
                  <th>USAGE COUNT</th>
                  <th>STATUS</th>
                  <th style={{ textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((cat) => {
                  const isItemSelected = selectedIds.includes(cat.id);
                  const isItemCat = cat.type === 'Item Category';

                  return (
                    <tr key={cat.id} style={{ backgroundColor: isItemSelected ? '#f0f9ff' : 'transparent' }}>
                      <td>
                        <input
                          type="checkbox"
                          checked={isItemSelected}
                          onChange={() => handleSelectOne(cat.id)}
                        />
                      </td>
                      <td className="category-id-td">{cat.id}</td>
                      <td>
                        <div className="category-name-cell">
                          <div
                            className="category-icon-box"
                            style={{
                              backgroundColor: isItemCat ? '#e0f2fe' : '#f0fdf4',
                              color: isItemCat ? '#0284c7' : '#16a34a'
                            }}
                          >
                            {isItemCat ? (
                              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                            ) : (
                              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <div className="category-title">{cat.name}</div>
                            {cat.subText && <div className="category-desc">{cat.subText}</div>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`type-pill ${isItemCat ? 'item' : 'customer'}`}>
                          {cat.type}
                        </span>
                      </td>
                      <td style={{ fontSize: '13px', color: '#475569', fontWeight: 600 }}>
                        {cat.usageCount.toLocaleString()}{' '}
                        {isItemCat ? 'items' : 'accounts'}
                      </td>
                      <td>
                        <span
                          className={`badge-status ${
                            cat.status === 'Active' ? 'active' : 'archived'
                          }`}
                        >
                          {cat.status === 'Active' ? 'Active' : 'Archived'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons-cell" style={{ justifyContent: 'flex-end' }}>
                          <button
                            className="action-btn-icon"
                            onClick={() => handleEditClick(cat)}
                            title="Edit Category"
                          >
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            className="action-btn-icon delete"
                            onClick={() => handleDeleteClick(cat)}
                            title="Delete Category"
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

          {/* MOBILE CARDS LIST (REF 2) */}
          <div className="mobile-categories-list">
            {filteredCategories.map((cat) => (
              <div
                key={cat.id}
                className={`mobile-category-card ${cat.status !== 'Active' ? 'inactive' : ''}`}
              >
                <div className="mobile-card-top">
                  <div>
                    <div className="mobile-card-name">{cat.name}</div>
                    <div className="mobile-card-type">{cat.type}</div>
                  </div>
                  <span
                    className={`badge-status ${
                      cat.status === 'Active' ? 'active' : 'archived'
                    }`}
                  >
                    {cat.status.toUpperCase()}
                  </span>
                </div>

                <div className="mobile-card-divider" />

                <div className="mobile-card-bottom">
                  <div className="mobile-card-usage">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    {cat.usageCount} {cat.type === 'Item Category' ? 'Items' : 'Customers'}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="action-btn-icon" onClick={() => handleEditClick(cat)}>
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button className="action-btn-icon delete" onClick={() => handleDeleteClick(cat)}>
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* PAGINATION FOOTER (REF 3) */}
          <div className="categories-footer">
            <div>
              Showing {totalResults > 0 ? startIndex + 1 : 0} to{' '}
              {Math.min(startIndex + itemsPerPage, totalResults)} of {totalResults} results
            </div>

            <div className="pagination-group">
              <button
                className="page-nav-btn"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                ‹
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`page-nav-btn ${safePage === p ? 'active' : ''}`}
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </button>
              ))}

              <button
                className="page-nav-btn"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                ›
              </button>
            </div>
          </div>
        </div>

        {/* MODALS */}
        <CategoryModal
          isOpen={isModalOpen}
          editingCategory={editingCategory}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveCategory}
        />

        <DeleteCategoryDialog
          isOpen={deletingCategory !== null}
          category={deletingCategory}
          onClose={() => setDeletingCategory(null)}
          onConfirm={handleConfirmDelete}
        />

        <CategoryImportModal
          isOpen={isImportOpen}
          onClose={() => setIsImportOpen(false)}
          onImport={handleImportSuccess}
        />
      </div>
    </div>
  );
};
