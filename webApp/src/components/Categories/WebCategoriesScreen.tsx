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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [errorToastMsg, setErrorToastMsg] = useState<string | null>(null);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const showSuccessToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const showErrorToast = (msg: string) => {
    setErrorToastMsg(msg);
    setTimeout(() => setErrorToastMsg(null), 5000);
  };

  const loadCategoriesFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setCategories(
          data.map((c: any) => ({
            id: c.id,
            name: c.name,
            status: 'Active',
            createdDate: c.created_at ? new Date(c.created_at).toLocaleDateString('en-GB') : '04/09/2026',
            usageCount: 0,
            subText: c.description || 'Customer Classification'
          }))
        );
      } else {
        setCategories(INITIAL_CATEGORIES);
      }
    } catch {
      setCategories(INITIAL_CATEGORIES);
    }
  };

  useEffect(() => {
    loadCategoriesFromSupabase();
  }, []);

  // FILTERED DATA
  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      return (
        !q ||
        c.id.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        (c.subText && c.subText.toLowerCase().includes(q))
      );
    });
  }, [categories, searchQuery]);

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
    status: 'Active' | 'Inactive',
    subText?: string
  ) => {
    try {
      const trimmedName = name.trim();
      const duplicateExists = categories.some(
        (c) => c.name.toLowerCase() === trimmedName.toLowerCase() && c.id !== editingCategory?.id
      );

      if (duplicateExists) {
        showErrorToast(`Category "${trimmedName}" already exists for this business.`);
        return;
      }

      if (editingCategory) {
        const isUuid = /^[0-9a-fA-F-]{36}$/.test(editingCategory.id);
        if (isUuid) {
          const { error } = await supabase
            .from('categories')
            .update({ name: trimmedName, description: subText || '' })
            .eq('id', editingCategory.id);

          if (error) {
            showErrorToast(`Failed to update category: ${error.message}`);
            return;
          }
        }
        setCategories((prev) =>
          prev.map((c) =>
            c.id === editingCategory.id ? { ...c, name: trimmedName, status, subText } : c
          )
        );
        showSuccessToast(`Customer category "${trimmedName}" updated successfully.`);
      } else {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        const payload: any = { name: trimmedName, description: subText || '' };
        if (userId) payload.user_id = userId;

        const { data, error } = await supabase
          .from('categories')
          .insert([payload])
          .select();

        if (error) {
          showErrorToast(`Failed to create category: ${error.message}`);
          return;
        }

        const created = data && data[0];
        const newCat: Category = {
          id: created?.id || `cat_${Date.now()}`,
          name: trimmedName,
          status,
          createdDate: new Date().toLocaleDateString('en-GB'),
          usageCount: 0,
          subText: subText || 'Customer Classification'
        };
        setCategories((prev) => [newCat, ...prev]);
        showSuccessToast(`New Customer Category "${trimmedName}" created successfully.`);
      }
    } catch (e: any) {
      showErrorToast(`Category operation failed: ${e.message || e}`);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCategory) return;
    try {
      // REQUIREMENT 15: DELETE CATEGORY SAFETY
      // Check if any customer is assigned this category name or ID
      const { data: customersUsingCat, error: checkErr } = await supabase
        .from('customers')
        .select('id')
        .or(`category.eq."${deletingCategory.name}",category_id.eq."${deletingCategory.id}"`)
        .limit(1);

      if (!checkErr && customersUsingCat && customersUsingCat.length > 0) {
        showErrorToast('This category is assigned to customers and cannot be deleted.');
        setDeletingCategory(null);
        return;
      }

      const isUuid = /^[0-9a-fA-F-]{36}$/.test(deletingCategory.id);
      if (isUuid) {
        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('id', deletingCategory.id);

        if (error) {
          showErrorToast(`Failed to delete category: ${error.message}`);
          setDeletingCategory(null);
          return;
        }
      }
      setCategories((prev) => prev.filter((c) => c.id !== deletingCategory.id));
      showSuccessToast(`Category "${deletingCategory.name}" deleted.`);
    } catch (e: any) {
      showErrorToast(`Delete failed: ${e.message || e}`);
    } finally {
      setDeletingCategory(null);
    }
  };

  const handleImportSuccess = (count: number) => {
    loadCategoriesFromSupabase();
    showSuccessToast(`Successfully imported ${count} category records.`);
  };

  // EXPORT HANDLERS
  const handleExportCSV = () => {
    const headers = ['CATEGORY ID', 'CATEGORY NAME', 'CREATED DATE'];
    const rows = filteredCategories.map((c) => [
      c.id,
      `"${c.name}"`,
      c.createdDate
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `customer_categories_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSuccessToast('CSV export generated.');
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
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Customer Categories</span>
        </div>

        {/* PAGE HEADER */}
        <div className="categories-page-header">
          <div>
            <h1 className="categories-title-text">Customer Categories</h1>
            <p className="categories-subtitle">
              Manage categories used for customer classification.
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
              + Add Category
            </button>
          </div>
        </div>

        {/* FEEDBACK MESSAGES */}
        {toastMsg && (
          <div
            style={{
              backgroundColor: '#f0fdf4',
              color: '#16a34a',
              padding: '12px 16px',
              borderRadius: '10px',
              fontWeight: 600,
              border: '1px solid #bbf7d0',
              fontSize: '13px',
              marginBottom: '16px'
            }}
          >
            ✓ {toastMsg}
          </div>
        )}

        {errorToastMsg && (
          <div
            style={{
              backgroundColor: '#fef2f2',
              color: '#dc2626',
              padding: '12px 16px',
              borderRadius: '10px',
              fontWeight: 600,
              border: '1px solid #fca5a5',
              fontSize: '13px',
              marginBottom: '16px'
            }}
          >
            ⚠️ {errorToastMsg}
          </div>
        )}

        {/* MAIN CARD BOX */}
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
                  placeholder="Search customer categories..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>

            {/* EXPORT ACTION BUTTONS */}
            <div className="toolbar-export-buttons">
              <button className="export-btn-square" title="Export CSV" onClick={handleExportCSV}>
                CSV
              </button>
              <button className="export-btn-square" title="Print" onClick={handlePrint}>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
              </button>
            </div>
          </div>

          {/* DESKTOP TABLE */}
          {paginatedData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '14px', fontWeight: 600 }}>
              No customer categories found.
              <div style={{ marginTop: '12px' }}>
                <button className="btn-primary-web" onClick={handleAddClick} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  + Add Category
                </button>
              </div>
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
                  <th>ID</th>
                  <th>CATEGORY NAME</th>
                  <th>CREATED</th>
                  <th style={{ textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((cat, idx) => {
                  const isItemSelected = selectedIds.includes(cat.id);
                  const displayId = /^[0-9a-fA-F-]{36}$/.test(cat.id) ? (startIndex + idx + 1).toString() : cat.id;

                  return (
                    <tr key={cat.id} style={{ backgroundColor: isItemSelected ? 'rgba(37, 99, 235, 0.08)' : 'transparent' }}>
                      <td>
                        <input
                          type="checkbox"
                          checked={isItemSelected}
                          onChange={() => handleSelectOne(cat.id)}
                        />
                      </td>
                      <td className="category-id-td">{displayId}</td>
                      <td>
                        <div className="category-name-cell">
                          <div
                            className="category-icon-box"
                            style={{
                              backgroundColor: 'rgba(37, 99, 235, 0.12)',
                              color: '#2563eb'
                            }}
                          >
                            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <div>
                            <div className="category-title" style={{ fontWeight: 700 }}>{cat.name}</div>
                            {cat.subText && <div className="category-desc">{cat.subText}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {cat.createdDate}
                      </td>
                      <td>
                        <div className="action-buttons-cell" style={{ justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            className="btn-secondary-web"
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                            onClick={() => handleEditClick(cat)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn-secondary-web"
                            style={{ padding: '6px 12px', fontSize: '12px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                            onClick={() => handleDeleteClick(cat)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* MOBILE CARDS LIST */}
          <div className="mobile-categories-list">
            {filteredCategories.map((cat) => (
              <div
                key={cat.id}
                className="mobile-category-card"
              >
                <div className="mobile-card-top">
                  <div>
                    <div className="mobile-card-name" style={{ fontWeight: 800 }}>{cat.name}</div>
                    <div className="mobile-card-type" style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                      Created: {cat.createdDate}
                    </div>
                  </div>
                </div>

                <div className="mobile-card-divider" />

                <div className="mobile-card-bottom">
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-secondary-web" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleEditClick(cat)}>
                      Edit
                    </button>
                    <button className="btn-secondary-web" style={{ padding: '6px 12px', fontSize: '12px', color: '#ef4444' }} onClick={() => handleDeleteClick(cat)}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* PAGINATION FOOTER */}
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
