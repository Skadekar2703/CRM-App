import React, { useState, useMemo, useEffect } from 'react';
import { WebCustomer } from '../../types/customers';
import { CustomerModal } from './CustomerModal';
import { DeleteCustomerDialog } from './DeleteCustomerDialog';
import { supabase } from '../../lib/supabase';
import '../Udhaari/Udhaari.css';

export const WebCustomersScreen: React.FC = () => {
  const [customers, setCustomers] = useState<WebCustomer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // FILTERS
  const [areaFilter, setAreaFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [cibilFilter, setCibilFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // MODALS & DETAIL VIEWS
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<WebCustomer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<WebCustomer | null>(null);
  const [selectedCustomerDetails, setSelectedCustomerDetails] = useState<WebCustomer | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // FETCH SUPABASE DATA IF AVAILABLE
  const fetchCustomersFromSupabase = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        const mapped: WebCustomer[] = data.map((item: any, idx: number) => {
          const bal = Math.abs(Number(item.balance || item.baki || 0));
          const bType = (item.balance_type || (Number(item.baki || 0) < 0 ? 'Jama' : 'Baki')) as 'Baki' | 'Jama';
          return {
            uid: item.uid || item.id || `CUS-${32 + idx}`,
            name: item.name || 'Customer',
            mobile: item.phone || item.mobile || '',
            area: item.area || 'Local Market',
            category: item.category || 'Regular',
            cibilScore: item.cibil_score || 750,
            cibilStatus: item.cibil_status || 'Good',
            creditLimit: item.credit_limit || 50000,
            balance: bal,
            balanceType: bType,
            baakiAmount: bType === 'Baki' ? bal : 0,
            jamaAmount: bType === 'Jama' ? bal : 0,
            lastTxnDate: item.last_txn_date || 'Recent',
            status: item.status || 'Active'
          };
        });
        setCustomers(mapped);
      } else {
        setCustomers([]);
      }
    } catch (e) {
      console.log('Supabase read error', e);
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomersFromSupabase();
  }, []);

  // CALCULATED SUMMARIES
  const totalCustomers = customers.length;
  const activeCustomersCount = useMemo(() => {
    return customers.filter((c) => c.status === 'Active').length;
  }, [customers]);

  const totalBakiAmount = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.baakiAmount || (c.balanceType === 'Baki' ? c.balance : 0)), 0);
  }, [customers]);

  const totalJamaAmount = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.jamaAmount || (c.balanceType === 'Jama' ? c.balance : 0)), 0);
  }, [customers]);

  // FILTER DROPDOWNS
  const availableAreas = useMemo(() => {
    const set = new Set(customers.map((c) => c.area));
    return ['All', ...Array.from(set)];
  }, [customers]);

  const availableCategories = useMemo(() => {
    const set = new Set(customers.map((c) => c.category));
    return ['All', ...Array.from(set)];
  }, [customers]);

  // FILTERED DATA
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        c.uid.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.mobile.toLowerCase().includes(q) ||
        c.area.toLowerCase().includes(q);

      const matchesArea = areaFilter === 'All' || c.area === areaFilter;
      const matchesCat = categoryFilter === 'All' || c.category === categoryFilter;
      const matchesCibil = cibilFilter === 'All' || c.cibilStatus === cibilFilter;
      const matchesStatus = statusFilter === 'All' || c.status === statusFilter;

      return matchesQuery && matchesArea && matchesCat && matchesCibil && matchesStatus;
    });
  }, [customers, searchQuery, areaFilter, categoryFilter, cibilFilter, statusFilter]);

  // PAGINATION LOGIC
  const totalEntries = filteredCustomers.length;
  const totalPages = Math.ceil(totalEntries / itemsPerPage) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const paginatedData = filteredCustomers.slice(startIndex, startIndex + itemsPerPage);

  // CRUD HANDLERS
  const handleAddCustomerClick = () => {
    setEditingCustomer(null);
    setIsModalOpen(true);
  };

  const handleEditCustomerClick = (customer: WebCustomer) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const handleDeleteCustomerClick = (customer: WebCustomer) => {
    setDeletingCustomer(customer);
  };

  const handleSaveCustomer = async (
    name: string,
    mobile: string,
    area: string,
    category: string,
    cibilScore: number,
    cibilStatus: 'Good' | 'Average' | 'Bad' | 'Normal',
    creditLimit: number,
    baaki: number,
    jama: number,
    status: 'Active' | 'Inactive'
  ) => {
    const netBaki = baaki - jama;
    const bType: 'Baki' | 'Jama' = netBaki < 0 ? 'Jama' : 'Baki';
    const absBal = Math.abs(netBaki);

    if (editingCustomer) {
      setCustomers((prev) =>
        prev.map((c) =>
          c.uid === editingCustomer.uid
            ? {
                ...c,
                name,
                mobile,
                area,
                category,
                cibilScore,
                cibilStatus,
                creditLimit,
                balance: absBal,
                balanceType: bType,
                baakiAmount: baaki,
                jamaAmount: jama,
                status
              }
            : c
        )
      );

      // Attempt Supabase Update
      try {
        await supabase
          .from('customers')
          .update({ name, phone: mobile, area, category, credit_limit: creditLimit, baki: netBaki, status })
          .eq('name', editingCustomer.name);
      } catch (e) {
        console.log('Supabase sync warning', e);
      }

      showToast(`Customer "${name}" updated.`);
    } else {
      const nextIdNum = 32 + customers.length;
      const newC: WebCustomer = {
        uid: `CUS-${nextIdNum}`,
        name,
        mobile,
        area,
        category,
        cibilScore,
        cibilStatus,
        creditLimit,
        balance: absBal,
        balanceType: bType,
        baakiAmount: baaki,
        jamaAmount: jama,
        lastTxnDate: 'Just now',
        status
      };
      setCustomers((prev) => [newC, ...prev]);

      // Attempt Supabase Insert
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        const custPayload: any = {
          name,
          phone: mobile,
          area,
          baki: netBaki,
          email: `${name.toLowerCase().replace(/\s+/g, '')}@crm.com`
        };
        if (userId) custPayload.user_id = userId;

        await supabase.from('customers').insert([custPayload]);
      } catch (e) {
        console.log('Supabase sync warning', e);
      }

      showToast(`New customer "${name}" added.`);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCustomer) return;
    const targetName = deletingCustomer.name;
    setCustomers((prev) => prev.filter((c) => c.uid !== deletingCustomer.uid));

    try {
      await supabase.from('customers').delete().eq('name', targetName);
    } catch (e) {
      console.log('Supabase delete warning', e);
    }

    showToast(`Customer "${targetName}" deleted.`);
    setDeletingCustomer(null);
  };

  // EXPORT HANDLERS
  const handleExportCSV = () => {
    const headers = ['UID', 'NAME', 'MOBILE', 'AREA', 'CATEGORY', 'CIBIL', 'LIMIT', 'BAAKI', 'JAMA', 'STATUS'];
    const rows = filteredCustomers.map((c) => [
      c.uid,
      `"${c.name}"`,
      `"${c.mobile}"`,
      `"${c.area}"`,
      `"${c.category}"`,
      c.cibilStatus,
      `"₹${c.creditLimit}"`,
      `"₹${c.baakiAmount}"`,
      `"₹${c.jamaAmount}"`,
      c.status
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `customers_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Customers CSV downloaded.');
  };

  return (
    <div className="crm-content">
      <div className="udhaari-container">
        {/* PAGE HEADER */}
        <div className="udhaari-page-header">
          <div>
            <h1 className="udhaari-title-text">Customers</h1>
            <div className="udhaari-subtitle-text">
              Manage client records, CIBIL scores, credit limits & accounts
            </div>
          </div>

          <div className="udhaari-header-buttons">
            <button className="btn-secondary-udhaari" onClick={handleExportCSV}>
              Export CSV
            </button>
            <button className="btn-primary-udhaari" onClick={handleAddCustomerClick}>
              + New Customer
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
          {/* CARD 1: TOTAL CUSTOMERS */}
          <div className="summary-card-udhaari blue-accent">
            <div>
              <div className="summary-card-label">TOTAL CUSTOMERS</div>
              <div className="summary-card-value">{totalCustomers}</div>
            </div>
            <div className="summary-icon-box blue-bg">
              <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>

          {/* CARD 2: ACTIVE CUSTOMERS */}
          <div className="summary-card-udhaari">
            <div>
              <div className="summary-card-label">ACTIVE CUSTOMERS</div>
              <div className="summary-card-value" style={{ color: '#16a34a' }}>
                {activeCustomersCount}
              </div>
            </div>
            <div className="summary-icon-box green-bg">
              <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          {/* CARD 3: TOTAL BAKI */}
          <div className="summary-card-udhaari red-accent">
            <div>
              <div className="summary-card-label">TOTAL BAAKI</div>
              <div className="summary-card-value red-text">
                ₹{totalBakiAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="summary-icon-box red-bg">
              <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          {/* CARD 4: TOTAL JAMA */}
          <div className="summary-card-udhaari green-accent">
            <div>
              <div className="summary-card-label">TOTAL JAMA</div>
              <div className="summary-card-value" style={{ color: '#16a34a' }}>
                ₹{totalJamaAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="summary-icon-box green-bg">
              <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* MAIN DATA TABLE & TOOLBAR */}
        <div className="udhaari-card-box">
          <div className="udhaari-filter-toolbar">
            <div className="udhaari-filter-dropdowns">
              <div className="items-search-box" style={{ width: '220px' }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  className="items-search-input"
                  placeholder="Search customers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <label style={{ fontSize: '13px', color: '#475569', fontWeight: 600 }}>Area:</label>
              <select className="udhaari-select" value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)}>
                {availableAreas.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>

              <label style={{ fontSize: '13px', color: '#475569', fontWeight: 600, marginLeft: '8px' }}>Category:</label>
              <select className="udhaari-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                {availableCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <label style={{ fontSize: '13px', color: '#475569', fontWeight: 600, marginLeft: '8px' }}>CIBIL:</label>
              <select className="udhaari-select" value={cibilFilter} onChange={(e) => setCibilFilter(e.target.value)}>
                <option value="All">All</option>
                <option value="Good">Good</option>
                <option value="Average">Average</option>
                <option value="Bad">Bad</option>
              </select>

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
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>Loading customer data...</div>
          ) : paginatedData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: '14px' }}>
              No customers found.
            </div>
          ) : (
            <table className="udhaari-table">
              <thead>
                <tr>
                  <th>UID</th>
                  <th>Customer Name</th>
                  <th>Mobile</th>
                  <th>Area</th>
                  <th>CIBIL</th>
                  <th>Credit Limit</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((customer) => (
                  <tr key={customer.uid}>
                    <td style={{ fontWeight: 600, color: '#64748b', fontSize: '13px' }}>{customer.uid}</td>
                    <td>
                      <div className="udhaari-customer-cell">
                        <div className="customer-initial-avatar">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        {customer.name}
                      </div>
                    </td>
                    <td style={{ color: '#475569', fontSize: '13px' }}>{customer.mobile}</td>
                    <td style={{ color: '#475569', fontSize: '13px' }}>{customer.area}</td>
                    <td>
                      <span className={`cibil-pill ${customer.cibilStatus.toLowerCase()}`}>
                        {customer.cibilStatus} ({customer.cibilScore})
                      </span>
                    </td>
                    <td style={{ color: '#475569', fontSize: '13px' }}>
                      ₹{customer.creditLimit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <span className={customer.balanceType === 'Baki' ? 'balance-red-text' : 'balance-green-text'}>
                        ₹{customer.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })} {customer.balanceType}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 700,
                          backgroundColor: customer.status === 'Active' ? '#dcfce7' : '#f1f5f9',
                          color: customer.status === 'Active' ? '#16a34a' : '#64748b'
                        }}
                      >
                        {customer.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons-cell" style={{ justifyContent: 'flex-end' }}>
                        <button
                          className="action-btn-icon"
                          onClick={() => setSelectedCustomerDetails(customer)}
                          title="View Details"
                        >
                          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>

                        <button
                          className="action-btn-icon"
                          onClick={() => handleEditCustomerClick(customer)}
                          title="Edit Customer"
                        >
                          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>

                        <button
                          className="action-btn-icon delete"
                          onClick={() => handleDeleteCustomerClick(customer)}
                          title="Delete Customer"
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
        <CustomerModal
          isOpen={isModalOpen}
          editingCustomer={editingCustomer}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveCustomer}
        />

        <DeleteCustomerDialog
          isOpen={deletingCustomer !== null}
          customer={deletingCustomer}
          onClose={() => setDeletingCustomer(null)}
          onConfirm={handleConfirmDelete}
        />

        {/* VIEW DETAILS MODAL */}
        {selectedCustomerDetails && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '480px' }}>
              <div className="modal-header">
                <h2>Customer Details</h2>
                <button className="modal-close-btn" onClick={() => setSelectedCustomerDetails(null)}>
                  &times;
                </button>
              </div>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Customer UID:</span>
                  <span style={{ fontWeight: 700 }}>{selectedCustomerDetails.uid}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Name:</span>
                  <span style={{ fontWeight: 700 }}>{selectedCustomerDetails.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Mobile:</span>
                  <span>{selectedCustomerDetails.mobile}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Area:</span>
                  <span>{selectedCustomerDetails.area}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>CIBIL Rating:</span>
                  <span className={`cibil-pill ${selectedCustomerDetails.cibilStatus.toLowerCase()}`}>
                    {selectedCustomerDetails.cibilStatus} ({selectedCustomerDetails.cibilScore})
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Credit Limit:</span>
                  <span>₹{selectedCustomerDetails.creditLimit.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Current Balance:</span>
                  <span style={{ fontWeight: 700, color: selectedCustomerDetails.balanceType === 'Baki' ? '#dc2626' : '#16a34a' }}>
                    ₹{selectedCustomerDetails.balance.toLocaleString()} {selectedCustomerDetails.balanceType}
                  </span>
                </div>
              </div>
              <div className="modal-footer" style={{ marginTop: '16px' }}>
                <button className="btn-primary-udhaari" onClick={() => setSelectedCustomerDetails(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
