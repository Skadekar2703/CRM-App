import React, { useState, useMemo, useEffect } from 'react';
import { UdhaariCustomer } from '../../types/udhaari';
import { UdhaariCustomerModal } from './UdhaariCustomerModal';
import { UdhaariTransactionModal } from './UdhaariTransactionModal';
import { UdhaariHistoryModal } from './UdhaariHistoryModal';
import { DeleteUdhaariDialog } from './DeleteUdhaariDialog';
import { supabase } from '../../lib/supabase';
import './Udhaari.css';

export const formatIndianCurrency = (amount: number): string => {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const formatted = absAmount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return `${isNegative ? '-' : ''}₹${formatted}`;
};

export const WebUdhaariScreen: React.FC = () => {
  const [customers, setCustomers] = useState<UdhaariCustomer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // FILTERS
  const [areaFilter, setAreaFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [cibilFilter, setCibilFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('Active');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Modals
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isTxnModalOpen, setIsTxnModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [presetTxnType, setPresetTxnType] = useState<'Baki' | 'Jama'>('Baki');
  const [selectedTxnCustomerUid, setSelectedTxnCustomerUid] = useState<string>('');
  const [historyCustomer, setHistoryCustomer] = useState<UdhaariCustomer | null>(null);

  const [editingCustomer, setEditingCustomer] = useState<UdhaariCustomer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<UdhaariCustomer | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const loadDataFromSupabase = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching customers from Supabase:', error);
        showToast(`Fetch error: ${error.message}`);
        setCustomers([]);
        return;
      }

      if (data && data.length > 0) {
        setCustomers(
          data.map((c: any) => {
            const rawBaki = Number(c.baki || 0);
            const rawJama = Number(c.jama || 0);
            const bakiVal = rawBaki >= 0 ? rawBaki : 0;
            const jamaVal = rawBaki < 0 ? Math.abs(rawBaki) : rawJama;
            const outstandingVal = bakiVal - jamaVal;
            return {
              uid: String(c.id),
              name: c.name || 'Unknown',
              mobile: c.phone || '',
              area: c.area || 'Local Market',
              category: c.category || 'General',
              cibilStatus: c.cibil_status || 'Good',
              baki: bakiVal,
              jama: jamaVal,
              outstanding: outstandingVal,
              balance: outstandingVal,
              balanceType: outstandingVal >= 0 ? 'Baki' : 'Jama',
              creditLimit: Number(c.credit_limit || 100000),
              lastTxnDate: 'Recent',
              status: c.status || 'Active'
            };
          })
        );
      } else {
        setCustomers([]);
      }
    } catch (e: any) {
      console.error('Exception fetching customers from Supabase:', e);
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDataFromSupabase();
  }, []);

  // CALCULATED SUMMARIES (Accounting Formula: SUM across all customers)
  const totalBaki = useMemo(() => {
    return customers
      .filter((c) => c.status === 'Active')
      .reduce((sum, c) => sum + (c.baki || 0), 0);
  }, [customers]);

  const totalJama = useMemo(() => {
    return customers
      .filter((c) => c.status === 'Active')
      .reduce((sum, c) => sum + (c.jama || 0), 0);
  }, [customers]);

  const totalOutstanding = useMemo(() => {
    return totalBaki - totalJama;
  }, [totalBaki, totalJama]);

  const activeCustomerCount = useMemo(() => {
    return customers.filter((c) => c.status === 'Active').length;
  }, [customers]);

  // UNIQUE AREAS & CATEGORIES FOR FILTER DROPDOWNS
  const availableAreas = useMemo(() => {
    const set = new Set(customers.map((c) => c.area).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [customers]);

  const availableCategories = useMemo(() => {
    const set = new Set(customers.map((c) => c.category).filter(Boolean));
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

  // ACTION HANDLERS
  const handleAddCustomerClick = () => {
    setEditingCustomer(null);
    setIsCustomerModalOpen(true);
  };

  const handleAddBakiClick = (customer?: UdhaariCustomer) => {
    setPresetTxnType('Baki');
    setSelectedTxnCustomerUid(customer?.uid || (customers[0]?.uid ?? ''));
    setIsTxnModalOpen(true);
  };

  const handleAddJamaClick = (customer?: UdhaariCustomer) => {
    setPresetTxnType('Jama');
    setSelectedTxnCustomerUid(customer?.uid || (customers[0]?.uid ?? ''));
    setIsTxnModalOpen(true);
  };

  const handleViewHistoryClick = (customer: UdhaariCustomer) => {
    setHistoryCustomer(customer);
    setIsHistoryModalOpen(true);
  };

  const handleEditCustomerClick = (customer: UdhaariCustomer) => {
    setEditingCustomer(customer);
    setIsCustomerModalOpen(true);
  };

  const handleDeleteCustomerClick = (customer: UdhaariCustomer) => {
    setDeletingCustomer(customer);
  };

  const handleSaveCustomer = async (
    name: string,
    mobile: string,
    area: string,
    category: string,
    cibilStatus: 'Good' | 'Average' | 'Bad',
    initialBalance: number,
    balanceType: 'Baki' | 'Jama',
    creditLimit: number,
    status: 'Active' | 'Inactive'
  ) => {
    const isBaki = balanceType === 'Baki';
    const initialBakiVal = isBaki ? initialBalance : 0;
    const initialJamaVal = isBaki ? 0 : initialBalance;

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    if (editingCustomer) {
      const { error } = await supabase
        .from('customers')
        .update({
          name,
          phone: mobile,
          area,
          category,
          cibil_status: cibilStatus,
          credit_limit: creditLimit,
          status
        })
        .eq('id', editingCustomer.uid);

      if (error) {
        showToast(`Update failed: ${error.message}`);
      } else {
        showToast(`Customer "${name}" profile updated.`);
      }
    } else {
      const payload: any = {
        name,
        phone: mobile,
        area,
        category,
        cibil_status: cibilStatus,
        baki: initialBakiVal,
        jama: initialJamaVal,
        credit_limit: creditLimit,
        status
      };
      if (userId) payload.user_id = userId;

      const { error } = await supabase.from('customers').insert([payload]);
      if (error) {
        showToast(`Add customer failed: ${error.message}`);
      } else {
        showToast(`New customer "${name}" added.`);
      }
    }
    await loadDataFromSupabase();
  };

  const handleSaveTransaction = async (
    customerUid: string,
    type: 'Baki' | 'Jama',
    amount: number,
    notes: string
  ) => {
    const targetCust = customers.find((c) => c.uid === customerUid);
    if (!targetCust) return;

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    try {
      const txnPayload: any = {
        customer_id: customerUid,
        customer_name: targetCust.name,
        type: type,
        amount: amount,
        notes: notes,
        status: 'Completed'
      };
      if (userId) txnPayload.user_id = userId;

      const { error: txnError } = await supabase.from('udhaari').insert([txnPayload]);
      if (txnError) {
        console.error('Supabase transaction insert error:', txnError);
      }

      let newBaki = targetCust.baki;
      let newJama = targetCust.jama;
      if (type === 'Baki') {
        newBaki += amount;
      } else {
        newBaki = Math.max(0, targetCust.baki - amount);
        newJama += amount;
      }

      let { error: custError } = await supabase
        .from('customers')
        .update({ baki: newBaki, jama: newJama })
        .eq('id', customerUid);

      if (custError && custError.message.includes('jama')) {
        // Fallback if 'jama' column is missing in Supabase schema cache
        const netBalance = type === 'Baki' ? targetCust.baki + amount : Math.max(0, targetCust.baki - amount);
        const { error: fallbackErr } = await supabase
          .from('customers')
          .update({ baki: netBalance })
          .eq('id', customerUid);
        custError = fallbackErr;
      }

      if (custError) {
        console.error('Supabase customer update error:', custError);
        showToast(`Update error: ${custError.message}`);
      } else {
        showToast(`₹${amount.toLocaleString('en-IN')} ${type} saved for ${targetCust.name}.`);
      }
    } catch (e: any) {
      console.error('Supabase transaction error:', e);
      showToast(`Error saving: ${e?.message || e}`);
    }

    await loadDataFromSupabase();
  };

  const handleConfirmDelete = async () => {
    if (!deletingCustomer) return;
    const { error } = await supabase.from('customers').delete().eq('id', deletingCustomer.uid);
    if (error) {
      showToast(`Delete failed: ${error.message}`);
    } else {
      showToast(`Customer "${deletingCustomer.name}" deleted.`);
    }
    setDeletingCustomer(null);
    await loadDataFromSupabase();
  };

  // EXPORT HANDLERS
  const handleExportCSV = () => {
    const headers = ['UID', 'CUSTOMER', 'MOBILE', 'AREA', 'CIBIL', 'BAKI', 'JAMA', 'OUTSTANDING', 'LIMIT'];
    const rows = filteredCustomers.map((c) => [
      c.uid,
      `"${c.name}"`,
      `"${c.mobile}"`,
      `"${c.area}"`,
      c.cibilStatus,
      `"${formatIndianCurrency(c.baki)}"`,
      `"${formatIndianCurrency(c.jama)}"`,
      `"${formatIndianCurrency(c.outstanding)}"`,
      `"${formatIndianCurrency(c.creditLimit)}"`
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `udhaari_export_${Date.now()}.csv`);
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
      <div className="udhaari-container">
        {/* PAGE HEADER */}
        <div className="udhaari-page-header">
          <div>
            <h1 className="udhaari-title-text">Udhaari</h1>
            <div className="udhaari-subtitle-text">
              Manage customer debt, payments, and outstanding balances
            </div>
          </div>

          <div className="udhaari-header-buttons">
            <button className="btn-secondary-udhaari" onClick={handleAddCustomerClick}>
              + Add Customer
            </button>
            <button className="btn-secondary-udhaari" style={{ backgroundColor: '#fef2f2', color: '#dc2626', borderColor: '#fca5a5' }} onClick={() => handleAddBakiClick()}>
              + Add Baki
            </button>
            <button className="btn-primary-udhaari" style={{ backgroundColor: '#16a34a', borderColor: '#16a34a' }} onClick={() => handleAddJamaClick()}>
              + Add Jama
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
        <div className="udhaari-summary-cards" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {/* CARD 1: TOTAL BAKI */}
          <div className="summary-card-udhaari red-accent">
            <div>
              <div className="summary-card-label">TOTAL BAKI (DEBT)</div>
              <div className="summary-card-value red-text">
                {formatIndianCurrency(totalBaki)}
              </div>
            </div>
            <div className="summary-icon-box red-bg">
              <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            </div>
          </div>

          {/* CARD 2: TOTAL JAMA */}
          <div className="summary-card-udhaari">
            <div>
              <div className="summary-card-label">TOTAL JAMA (CREDIT)</div>
              <div className="summary-card-value green-text" style={{ color: '#16a34a' }}>
                {formatIndianCurrency(totalJama)}
              </div>
            </div>
            <div className="summary-icon-box green-bg">
              <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>

          {/* CARD 3: OUTSTANDING */}
          <div className="summary-card-udhaari blue-accent">
            <div>
              <div className="summary-card-label">TOTAL OUTSTANDING</div>
              <div className="summary-card-value" style={{ color: totalOutstanding >= 0 ? '#1e293b' : '#16a34a' }}>
                {formatIndianCurrency(totalOutstanding)}
              </div>
            </div>
            <div className="summary-icon-box blue-bg">
              <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M12 7h.01M15 7h.01" />
              </svg>
            </div>
          </div>

          {/* CARD 4: CUSTOMERS */}
          <div className="summary-card-udhaari blue-accent">
            <div>
              <div className="summary-card-label">CUSTOMERS</div>
              <div className="summary-card-value">
                {activeCustomerCount} <span style={{ fontSize: '14px', fontWeight: 600, color: '#64748b' }}>Active</span>
              </div>
            </div>
            <div className="summary-icon-box blue-bg">
              <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* MAIN CARD BOX & FILTER TOOLBAR */}
        <div className="udhaari-card-box">
          <div className="udhaari-filter-toolbar">
            {/* DROPDOWN FILTERS */}
            <div className="udhaari-filter-dropdowns">
              <div className="items-search-box" style={{ width: '220px' }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  className="items-search-input"
                  placeholder="Search Udhaari records..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <label style={{ fontSize: '13px', color: '#475569', fontWeight: 600 }}>Area:</label>
              <select
                className="udhaari-select"
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value)}
              >
                {availableAreas.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>

              <label style={{ fontSize: '13px', color: '#475569', fontWeight: 600, marginLeft: '8px' }}>Category:</label>
              <select
                className="udhaari-select"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                {availableCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <label style={{ fontSize: '13px', color: '#475569', fontWeight: 600, marginLeft: '8px' }}>CIBIL:</label>
              <select
                className="udhaari-select"
                value={cibilFilter}
                onChange={(e) => setCibilFilter(e.target.value)}
              >
                <option value="All">All</option>
                <option value="Good">Good</option>
                <option value="Average">Average</option>
                <option value="Bad">Bad</option>
              </select>

              <label style={{ fontSize: '13px', color: '#475569', fontWeight: 600, marginLeft: '8px' }}>Status:</label>
              <select
                className="udhaari-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {/* ACTION BUTTONS */}
            <div className="toolbar-action-buttons">
              <button className="btn-icon-text" onClick={() => loadDataFromSupabase()} title="Refresh">
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
            </div>
          </div>

          {/* DESKTOP DATA TABLE */}
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: '14px' }}>
              Loading Udhaari records...
            </div>
          ) : paginatedData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: '14px' }}>
              No Udhaari records found matching your filters.
            </div>
          ) : (
            <table className="udhaari-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Area</th>
                  <th>CIBIL</th>
                  <th>Total Baki</th>
                  <th>Total Jama</th>
                  <th>Outstanding</th>
                  <th>Limit</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((customer) => (
                  <tr key={customer.uid}>
                    <td>
                      <div className="udhaari-customer-cell">
                        <div
                          className={`customer-initial-avatar ${customer.cibilStatus === 'Good' ? 'green' : 'blue-light'}`}
                        >
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700 }}>{customer.name}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>{customer.mobile}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: '#475569', fontSize: '13px' }}>{customer.area}</td>
                    <td>
                      <span className={`cibil-pill ${customer.cibilStatus.toLowerCase()}`}>
                        {customer.cibilStatus}
                      </span>
                    </td>
                    <td>
                      <span className="balance-red-text">
                        {formatIndianCurrency(customer.baki)}
                      </span>
                    </td>
                    <td>
                      <span className="balance-green-text" style={{ color: '#16a34a' }}>
                        {formatIndianCurrency(customer.jama)}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 800, color: customer.outstanding >= 0 ? '#dc2626' : '#16a34a' }}>
                        {formatIndianCurrency(customer.outstanding)}
                      </span>
                    </td>
                    <td style={{ color: '#475569', fontSize: '13px' }}>
                      {formatIndianCurrency(customer.creditLimit)}
                    </td>
                    <td>
                      <div className="action-buttons-cell" style={{ justifyContent: 'flex-end', gap: '4px' }}>
                        <button
                          style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                          onClick={() => handleAddBakiClick(customer)}
                          title="Add Baki (Debt)"
                        >
                          + Baki
                        </button>
                        <button
                          style={{ backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #86efac', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                          onClick={() => handleAddJamaClick(customer)}
                          title="Add Jama (Payment)"
                        >
                          + Jama
                        </button>
                        <button
                          className="action-btn-icon"
                          onClick={() => handleViewHistoryClick(customer)}
                          title="View Transaction History"
                        >
                          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                        <button
                          className="action-btn-icon"
                          onClick={() => handleEditCustomerClick(customer)}
                          title="Edit Customer Profile"
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

          {/* MOBILE UDHAARI CARDS */}
          <div className="mobile-udhaari-list">
            {filteredCustomers.map((c) => (
              <div key={c.uid} className="mobile-customer-card" style={{ padding: '16px' }}>
                <div className="mobile-card-top-row">
                  <div className="mobile-card-customer-info">
                    <div className="mobile-avatar-circle blue-bg">
                      {c.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                    <div>
                      <div className="mobile-customer-name" style={{ fontWeight: 800, fontSize: '16px' }}>
                        {c.name}
                      </div>
                      <div className="mobile-customer-area">
                        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        {c.area}
                      </div>
                    </div>
                  </div>

                  <div className="mobile-card-balance-box" style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Outstanding</div>
                    <div style={{ color: c.outstanding >= 0 ? '#dc2626' : '#16a34a', fontWeight: 900, fontSize: '16px' }}>
                      {formatIndianCurrency(c.outstanding)}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '10px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#dc2626', fontWeight: 700 }}>Total Baki</div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#dc2626' }}>{formatIndianCurrency(c.baki)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: 700 }}>Total Jama</div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#16a34a' }}>{formatIndianCurrency(c.jama)}</div>
                  </div>
                </div>

                <div className="mobile-card-divider" />

                <div className="mobile-card-bottom-row" style={{ marginTop: '8px' }}>
                  <div className="mobile-cibil-group">
                    CIBIL: <span className={`cibil-pill ${c.cibilStatus.toLowerCase()}`}>{c.cibilStatus}</span>
                  </div>

                  <div className="mobile-action-buttons" style={{ gap: '6px' }}>
                    <button style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }} onClick={() => handleAddBakiClick(c)}>
                      + Baki
                    </button>
                    <button style={{ backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #86efac', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }} onClick={() => handleAddJamaClick(c)}>
                      + Jama
                    </button>
                    <button className="circle-action-btn" onClick={() => handleViewHistoryClick(c)} title="History">
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    <button className="circle-action-btn" onClick={() => handleEditCustomerClick(c)} title="Edit Profile">
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
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
        <UdhaariCustomerModal
          isOpen={isCustomerModalOpen}
          editingCustomer={editingCustomer}
          onClose={() => setIsCustomerModalOpen(false)}
          onSave={handleSaveCustomer}
        />

        <UdhaariTransactionModal
          isOpen={isTxnModalOpen}
          customers={customers}
          initialType={presetTxnType}
          initialCustomerUid={selectedTxnCustomerUid}
          onClose={() => setIsTxnModalOpen(false)}
          onSave={handleSaveTransaction}
        />

        <UdhaariHistoryModal
          isOpen={isHistoryModalOpen}
          customer={historyCustomer}
          onClose={() => setIsHistoryModalOpen(false)}
          onRefresh={loadDataFromSupabase}
        />

        <DeleteUdhaariDialog
          isOpen={deletingCustomer !== null}
          customer={deletingCustomer}
          onClose={() => setDeletingCustomer(null)}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </div>
  );
};
