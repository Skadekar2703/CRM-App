import React, { useState, useMemo, useEffect } from 'react';
import { WebSupplier, INITIAL_WEB_SUPPLIERS } from '../../types/suppliers';
import { SupplierModal } from './SupplierModal';
import { DeleteSupplierDialog } from './DeleteSupplierDialog';
import { supabase } from '../../lib/supabase';
import '../Udhaari/Udhaari.css';

export const WebSuppliersScreen: React.FC = () => {
  const [suppliers, setSuppliers] = useState<WebSupplier[]>(INITIAL_WEB_SUPPLIERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // MODALS
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<WebSupplier | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<WebSupplier | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // FETCH FROM SUPABASE IF AVAILABLE
  const fetchSuppliersFromSupabase = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.from('suppliers').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        const mapped: WebSupplier[] = data.map((item: any, idx: number) => ({
          id: item.id || `SUP-00${idx + 1}`,
          partyName: item.name || item.party_name || 'Supplier',
          contactPerson: item.company || item.contact_person || 'Company',
          mobile: item.phone || item.mobile || '+91 9876543210',
          email: item.email || '',
          paymentTerms: 'Net 30 Days',
          address: item.area || item.address || 'Local Market',
          status: 'Active'
        }));
        setSuppliers(mapped);
      }
    } catch (e) {
      console.log('Supabase suppliers read fallback', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliersFromSupabase();
  }, []);

  // FILTERED SUPPLIERS
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        s.id.toLowerCase().includes(q) ||
        s.partyName.toLowerCase().includes(q) ||
        s.contactPerson.toLowerCase().includes(q) ||
        s.mobile.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'All' || s.status === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [suppliers, searchQuery, statusFilter]);

  // PAGINATION
  const totalEntries = filteredSuppliers.length;
  const totalPages = Math.ceil(totalEntries / itemsPerPage) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const paginatedData = filteredSuppliers.slice(startIndex, startIndex + itemsPerPage);

  // CRUD HANDLERS
  const handleAddSupplierClick = () => {
    setEditingSupplier(null);
    setIsModalOpen(true);
  };

  const handleEditSupplierClick = (supplier: WebSupplier) => {
    setEditingSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleDeleteSupplierClick = (supplier: WebSupplier) => {
    setDeletingSupplier(supplier);
  };

  const handleSaveSupplier = async (
    partyName: string,
    contactPerson: string,
    mobile: string,
    email: string,
    paymentTerms: string,
    address: string,
    status: 'Active' | 'Inactive'
  ) => {
    if (editingSupplier) {
      setSuppliers((prev) =>
        prev.map((s) =>
          s.id === editingSupplier.id
            ? { ...s, partyName, contactPerson, mobile, email, paymentTerms, address, status }
            : s
        )
      );

      try {
        const isUuid = /^[0-9a-fA-F-]{36}$/.test(editingSupplier.id);
        if (isUuid) {
          await supabase
            .from('suppliers')
            .update({ name: partyName, company: contactPerson, phone: mobile, email, area: address })
            .eq('id', editingSupplier.id);
        } else {
          await supabase
            .from('suppliers')
            .update({ name: partyName, company: contactPerson, phone: mobile, email, area: address })
            .eq('name', editingSupplier.partyName);
        }
      } catch (e) {
        console.log('Supabase update warning', e);
      }

      showToast(`Supplier "${partyName}" updated.`);
    } else {
      const nextId = `SUP-00${suppliers.length + 1}`;
      const newS: WebSupplier = {
        id: nextId,
        partyName,
        contactPerson,
        mobile,
        email,
        paymentTerms,
        address,
        status
      };
      setSuppliers((prev) => [newS, ...prev]);

      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        const suppPayload: any = {
          name: partyName,
          company: contactPerson,
          phone: mobile,
          email,
          area: address
        };
        if (userId) suppPayload.user_id = userId;

        const { data } = await supabase.from('suppliers').insert([suppPayload]).select();
        if (data && data[0]) {
          newS.id = data[0].id;
        }
      } catch (e) {
        console.log('Supabase insert warning', e);
      }

      showToast(`New supplier "${partyName}" added.`);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingSupplier) return;
    const targetName = deletingSupplier.partyName;
    const targetId = deletingSupplier.id;
    setSuppliers((prev) => prev.filter((s) => s.id !== deletingSupplier.id));

    try {
      const isUuid = /^[0-9a-fA-F-]{36}$/.test(targetId);
      if (isUuid) {
        await supabase.from('suppliers').delete().eq('id', targetId);
      } else {
        await supabase.from('suppliers').delete().eq('name', targetName);
      }
    } catch (e) {
      console.log('Supabase delete warning', e);
    }

    showToast(`Supplier "${targetName}" deleted.`);
    setDeletingSupplier(null);
  };

  // EXPORT CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'PARTY NAME', 'CONTACT PERSON', 'MOBILE', 'PAYMENT TERMS', 'ADDRESS', 'STATUS'];
    const rows = filteredSuppliers.map((s) => [
      s.id,
      `"${s.partyName}"`,
      `"${s.contactPerson}"`,
      `"${s.mobile}"`,
      `"${s.paymentTerms}"`,
      `"${s.address}"`,
      s.status
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `suppliers_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Suppliers CSV downloaded.');
  };

  return (
    <div className="crm-content">
      <div className="udhaari-container">
        {/* PAGE HEADER */}
        <div className="udhaari-page-header">
          <div>
            <h1 className="udhaari-title-text">Manage Suppliers</h1>
            <div className="udhaari-subtitle-text">
              Track vendor details, contact persons, payment terms & procurement
            </div>
          </div>

          <div className="udhaari-header-buttons">
            <button className="btn-secondary-udhaari" onClick={fetchSuppliersFromSupabase} title="Refresh">
              Refresh
            </button>
            <button className="btn-secondary-udhaari" onClick={handleExportCSV}>
              Export
            </button>
            <button className="btn-primary-udhaari" onClick={handleAddSupplierClick}>
              + Add Supplier
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

        {/* MAIN DATA TABLE & TOOLBAR */}
        <div className="udhaari-card-box">
          <div className="udhaari-filter-toolbar">
            <div className="udhaari-filter-dropdowns">
              <div className="items-search-box" style={{ width: '260px' }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  className="items-search-input"
                  placeholder="Search suppliers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <label style={{ fontSize: '13px', color: '#475569', fontWeight: 600, marginLeft: '8px' }}>Status:</label>
              <select className="udhaari-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="All">All</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* TABLE */}
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>Loading suppliers...</div>
          ) : paginatedData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: '14px' }}>
              No suppliers found.
            </div>
          ) : (
            <table className="udhaari-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Party Name</th>
                  <th>Contact Person</th>
                  <th>Mobile</th>
                  <th>Payment Terms</th>
                  <th>Address</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((supplier) => (
                  <tr key={supplier.id}>
                    <td style={{ fontWeight: 600, color: '#64748b', fontSize: '13px' }}>{supplier.id}</td>
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>{supplier.partyName}</td>
                    <td style={{ color: '#475569', fontSize: '13px' }}>👤 {supplier.contactPerson}</td>
                    <td style={{ color: '#475569', fontSize: '13px' }}>📱 {supplier.mobile}</td>
                    <td style={{ color: '#0369a1', fontWeight: 600, fontSize: '13px' }}>{supplier.paymentTerms}</td>
                    <td style={{ color: '#64748b', fontSize: '13px' }}>{supplier.address}</td>
                    <td>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 700,
                          backgroundColor: supplier.status === 'Active' ? '#dcfce7' : '#f1f5f9',
                          color: supplier.status === 'Active' ? '#16a34a' : '#64748b'
                        }}
                      >
                        {supplier.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons-cell" style={{ justifyContent: 'flex-end' }}>
                        <button
                          className="action-btn-icon"
                          onClick={() => handleEditSupplierClick(supplier)}
                          title="Edit Supplier"
                        >
                          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>

                        <button
                          className="action-btn-icon delete"
                          onClick={() => handleDeleteSupplierClick(supplier)}
                          title="Delete Supplier"
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
        <SupplierModal
          isOpen={isModalOpen}
          editingSupplier={editingSupplier}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveSupplier}
        />

        <DeleteSupplierDialog
          isOpen={deletingSupplier !== null}
          supplier={deletingSupplier}
          onClose={() => setDeletingSupplier(null)}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </div>
  );
};
