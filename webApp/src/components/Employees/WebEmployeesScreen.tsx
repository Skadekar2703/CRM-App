import React, { useState, useMemo, useEffect } from 'react';
import { WebEmployee, WebEmployeeTransaction } from '../../types/employees';
import { EmployeeModal } from './EmployeeModal';
import { EmployeeTransactionModal } from './EmployeeTransactionModal';
import { DeleteEmployeeDialog } from './DeleteEmployeeDialog';
import { supabase } from '../../lib/supabase';
import '../Udhaari/Udhaari.css';

const formatDateDisplay = (dateStr?: string) => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

export const WebEmployeesScreen: React.FC = () => {
  const [employees, setEmployees] = useState<WebEmployee[]>([]);
  const [transactions, setTransactions] = useState<WebEmployeeTransaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [toastState, setToastState] = useState<{ msg: string; isError?: boolean } | null>(null);

  // MODALS & DETAIL VIEWS
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<WebEmployee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<WebEmployee | null>(null);
  const [selectedEmployeeDetails, setSelectedEmployeeDetails] = useState<WebEmployee | null>(null);

  // TRANSACTION MODAL
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txModalEmployee, setTxModalEmployee] = useState<WebEmployee | null>(null);
  const [txDefaultType, setTxDefaultType] = useState<WebEmployeeTransaction['type']>('Gift');

  const showToast = (msg: string, isError = false) => {
    setToastState({ msg, isError });
    setTimeout(() => setToastState(null), 5000);
  };

  // FETCH SUPABASE DATA
  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      // Fetch employees
      const { data: empData, error: empErr } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });

      if (empErr) {
        console.error('Error fetching employees:', empErr);
      }

      if (empData) {
        const mappedEmployees: WebEmployee[] = empData.map((item: any, idx: number) => {
          let activeDays = item.active_days || 0;
          if (item.joined_on && !item.active_days) {
            const joined = new Date(item.joined_on);
            const now = item.left_on ? new Date(item.left_on) : new Date();
            const diffTime = Math.abs(now.getTime() - joined.getTime());
            activeDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          }

          return {
            id: item.id,
            uid: item.uid || `EMP-${100 + idx}`,
            name: item.name || 'Staff Member',
            mobile: item.mobile || item.phone || 'N/A',
            email: item.email || '',
            role: item.role || 'Staff',
            address: item.address || '',
            bankName: item.bank_name || '',
            bankAccount: item.bank_account || '',
            idNumber: item.id_number || '',
            emergencyContact: item.emergency_contact || '',
            joinedOn: item.joined_on || item.created_at || new Date().toISOString().split('T')[0],
            leftOn: item.left_on || undefined,
            photoUrl: item.photo_url || '',
            remark: item.remark || '',
            activeDays: activeDays,
            salary: Number(item.salary || 25000),
            salaryType: item.salary_type || 'Monthly',
            ctcYtd: Number(item.ctc_ytd || 300000),
            udhaarBalance: Number(item.udhaar_balance || 0),
            status: item.status || 'Active'
          };
        });
        setEmployees(mappedEmployees);
      }

      // Fetch employee transactions
      const { data: txData, error: txErr } = await supabase
        .from('employee_transactions')
        .select('*')
        .order('date', { ascending: false });

      if (!txErr && txData) {
        const mappedTx: WebEmployeeTransaction[] = txData.map((t: any) => ({
          id: t.id,
          employeeId: t.employee_id,
          employeeUid: t.employee_uid,
          type: t.type,
          amount: Number(t.amount || 0),
          date: t.date || new Date().toISOString().split('T')[0],
          note: t.note || '',
          createdAt: t.created_at
        }));
        setTransactions(mappedTx);
      }
    } catch (e) {
      console.error('Supabase fetch exception:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // SUMMARIES
  const totalEmployees = employees.length;
  const activeEmployeesCount = useMemo(() => {
    return employees.filter((e) => e.status === 'Active').length;
  }, [employees]);

  const totalMonthlySalary = useMemo(() => {
    return employees
      .filter((e) => e.status === 'Active')
      .reduce((sum, e) => sum + e.salary, 0);
  }, [employees]);

  const totalUdhaarOutstanding = useMemo(() => {
    return employees.reduce((sum, e) => sum + (e.udhaarBalance || 0), 0);
  }, [employees]);

  // FILTERED EMPLOYEES
  const filteredEmployees = useMemo(() => {
    return employees.filter((e) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        e.uid.toLowerCase().includes(q) ||
        e.name.toLowerCase().includes(q) ||
        e.role.toLowerCase().includes(q) ||
        e.mobile.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'All' || e.status === statusFilter;
      const matchesRole = roleFilter === 'All' || e.role === roleFilter;

      return matchesQuery && matchesStatus && matchesRole;
    });
  }, [employees, searchQuery, statusFilter, roleFilter]);

  // PAGINATION
  const totalEntries = filteredEmployees.length;
  const totalPages = Math.ceil(totalEntries / itemsPerPage) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const paginatedData = filteredEmployees.slice(startIndex, startIndex + itemsPerPage);

  // CRUD HANDLERS FOR EMPLOYEE
  const handleAddEmployeeClick = () => {
    setEditingEmployee(null);
    setIsEmployeeModalOpen(true);
  };

  const handleEditEmployeeClick = (employee: WebEmployee) => {
    setEditingEmployee(employee);
    setIsEmployeeModalOpen(true);
  };

  const handleDeleteEmployeeClick = (employee: WebEmployee) => {
    setDeletingEmployee(employee);
  };

  const handleSaveEmployee = async (employeeData: Partial<WebEmployee>) => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    const fullPayload: any = {
      uid: employeeData.uid,
      name: employeeData.name,
      mobile: employeeData.mobile,
      phone: employeeData.mobile,
      email: employeeData.email,
      role: employeeData.role,
      salary_type: employeeData.salaryType || 'Monthly',
      salary: Number(employeeData.salary || 0),
      address: employeeData.address,
      bank_name: employeeData.bankName,
      bank_account: employeeData.bankAccount,
      id_number: employeeData.idNumber,
      emergency_contact: employeeData.emergencyContact,
      joined_on: employeeData.joinedOn,
      left_on: employeeData.leftOn || null,
      photo_url: employeeData.photoUrl,
      remark: employeeData.remark,
      status: employeeData.status || 'Active'
    };

    // Baseline payload fallback for legacy tables
    const basePayload: any = {
      name: employeeData.name,
      role: employeeData.role || 'Staff',
      status: employeeData.status || 'Active'
    };

    if (userId) {
      fullPayload.user_id = userId;
      basePayload.user_id = userId;
    }

    if (editingEmployee && editingEmployee.id) {
      // UPDATE SUPABASE
      let { error } = await supabase
        .from('employees')
        .update(fullPayload)
        .eq('id', editingEmployee.id);

      if (error && (error.message.includes('column') || error.message.includes('schema cache'))) {
        console.warn('Falling back to basic update columns due to missing DB columns in schema');
        let retry = await supabase
          .from('employees')
          .update(basePayload)
          .eq('id', editingEmployee.id);
        
        if (retry.error && (retry.error.message.includes('column') || retry.error.message.includes('schema cache'))) {
          retry = await supabase
            .from('employees')
            .update({ name: employeeData.name })
            .eq('id', editingEmployee.id);
        }

        if (!retry.error) {
          showToast(`Employee "${employeeData.name}" updated (Name only). Run 'supabase_employee_v2_extension.sql' in SQL Editor for full fields.`);
          await fetchAllData();
          return;
        } else {
          error = retry.error;
        }
      }

      if (error) {
        console.error('Error updating employee:', error);
        showToast(`Error updating employee: ${error.message}`, true);
        throw new Error(`Failed to update employee: ${error.message}`);
      }

      showToast(`Employee "${employeeData.name}" updated successfully.`);
    } else {
      // INSERT SUPABASE
      let { error } = await supabase
        .from('employees')
        .insert([fullPayload]);

      if (error && (error.message.includes('column') || error.message.includes('schema cache'))) {
        console.warn('Falling back to basic insert columns due to missing DB columns in schema');
        let retry = await supabase
          .from('employees')
          .insert([basePayload]);

        if (retry.error && (retry.error.message.includes('column') || retry.error.message.includes('schema cache'))) {
          const minimalPayload: any = { name: employeeData.name };
          if (userId) minimalPayload.user_id = userId;
          retry = await supabase
            .from('employees')
            .insert([minimalPayload]);
        }

        if (!retry.error) {
          showToast(`Employee "${employeeData.name}" added (Name only). Run 'supabase_employee_v2_extension.sql' in SQL Editor for full fields.`);
          await fetchAllData();
          return;
        } else {
          error = retry.error;
        }
      }

      if (error) {
        console.error('Error adding employee:', error);
        showToast(`Error adding employee: ${error.message}`, true);
        throw new Error(`Failed to add employee: ${error.message}`);
      }

      showToast(`Employee "${employeeData.name}" added successfully.`);
    }
    await fetchAllData();
  };

  const handleConfirmDelete = async () => {
    if (!deletingEmployee || !deletingEmployee.id) return;
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', deletingEmployee.id);

      if (error) {
        showToast(`Error deleting employee: ${error.message}`, true);
      } else {
        showToast(`Employee "${deletingEmployee.name}" deleted.`);
        if (selectedEmployeeDetails?.id === deletingEmployee.id) {
          setSelectedEmployeeDetails(null);
        }
        fetchAllData();
      }
    } catch (e: any) {
      console.error('Delete employee error:', e);
      showToast(`Error: ${e.message}`, true);
    } finally {
      setDeletingEmployee(null);
    }
  };

  // OPEN TRANSACTION MODAL
  const handleOpenTransaction = (employee: WebEmployee, defaultType: WebEmployeeTransaction['type']) => {
    setTxModalEmployee(employee);
    setTxDefaultType(defaultType);
    setIsTxModalOpen(true);
  };

  // SAVE TRANSACTION HANDLER
  const handleSaveTransaction = async (txData: {
    employeeId: string;
    employeeUid?: string;
    type: WebEmployeeTransaction['type'];
    amount: number;
    date: string;
    note?: string;
  }) => {
    try {
      // 1. Insert into employee_transactions
      const { error: txErr } = await supabase.from('employee_transactions').insert([
        {
          employee_id: txData.employeeId,
          employee_uid: txData.employeeUid,
          type: txData.type,
          amount: txData.amount,
          date: txData.date,
          note: txData.note
        }
      ]);

      if (txErr) {
        console.error('Error recording transaction:', txErr);
        if (txErr.message.includes('relation') || txErr.message.includes('does not exist')) {
          showToast(`Table missing: Please run 'supabase_employee_v2_extension.sql' in SQL Editor.`, true);
        } else {
          showToast(`Failed to record transaction: ${txErr.message}`, true);
        }
        return;
      }

      // 2. Update employee udhaar balance if type is Employee Udhaar (+) or Udhaar Repayment (-)
      const targetEmp = employees.find((e) => e.id === txData.employeeId);
      if (targetEmp) {
        let newUdhaar = targetEmp.udhaarBalance;
        if (txData.type === 'Employee Udhaar') {
          newUdhaar += txData.amount;
        } else if (txData.type === 'Udhaar Repayment') {
          newUdhaar = Math.max(0, newUdhaar - txData.amount);
        }

        if (newUdhaar !== targetEmp.udhaarBalance) {
          await supabase
            .from('employees')
            .update({ udhaar_balance: newUdhaar })
            .eq('id', txData.employeeId);
        }
      }

      showToast(`Recorded ${txData.type} entry of ₹${txData.amount.toLocaleString()}`);
      fetchAllData();

      // Refresh selected details if currently viewing
      if (selectedEmployeeDetails && selectedEmployeeDetails.id === txData.employeeId) {
        const updated = employees.find((e) => e.id === txData.employeeId);
        if (updated) setSelectedEmployeeDetails(updated);
      }
    } catch (e: any) {
      console.error('Save transaction exception:', e);
      showToast(`Error: ${e.message}`, true);
    }
  };

  // EXPORT CSV
  const handleExportCSV = () => {
    const headers = [
      'UID',
      'NAME',
      'ROLE',
      'MOBILE',
      'EMAIL',
      'STATUS',
      'JOINED ON',
      'LEFT ON',
      'BANK NAME',
      'BANK ACCOUNT',
      'ID NUMBER',
      'EMERGENCY CONTACT',
      'ACTIVE DAYS',
      'UDHAAR BAL'
    ];
    const rows = filteredEmployees.map((e) => [
      e.uid,
      `"${e.name}"`,
      `"${e.role}"`,
      `"${e.mobile}"`,
      `"${e.email || ''}"`,
      e.status,
      `"${formatDateDisplay(e.joinedOn)}"`,
      `"${formatDateDisplay(e.leftOn)}"`,
      `"${e.bankName || ''}"`,
      `"${e.bankAccount || ''}"`,
      `"${e.idNumber || ''}"`,
      `"${e.emergencyContact || ''}"`,
      e.activeDays,
      `"₹${e.udhaarBalance}"`
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `employees_roster_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Employees CSV downloaded.');
  };

  // Filter transactions for selected employee details modal
  const selectedEmpTxList = useMemo(() => {
    if (!selectedEmployeeDetails || !selectedEmployeeDetails.id) return [];
    return transactions.filter((t) => t.employeeId === selectedEmployeeDetails.id);
  }, [selectedEmployeeDetails, transactions]);

  return (
    <div className="crm-content">
      <div className="udhaari-container">
        {/* PAGE HEADER */}
        <div className="udhaari-page-header">
          <div>
            <h1 className="udhaari-title-text">Employee Management & Financial Roster</h1>
            <div className="udhaari-subtitle-text">
              Manage staff profiles, track attendance active days, gifts, bonuses, advances (Udhaar), & labour expenses
            </div>
          </div>

          <div className="udhaari-header-buttons">
            <button className="btn-secondary-udhaari" onClick={handleExportCSV}>
              📥 Export CSV
            </button>
            <button className="btn-primary-udhaari" onClick={handleAddEmployeeClick}>
              + Add Employee
            </button>
          </div>
        </div>

        {/* TOAST FEEDBACK BANNER */}
        {toastState && (
          <div
            style={{
              backgroundColor: toastState.isError ? '#fef2f2' : '#f0fdf4',
              color: toastState.isError ? '#dc2626' : '#16a34a',
              padding: '12px 16px',
              borderRadius: '10px',
              fontWeight: 600,
              border: `1px solid ${toastState.isError ? '#fecaca' : '#bbf7d0'}`,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px'
            }}
          >
            <span>{toastState.isError ? '⚠️' : '✓'} {toastState.msg}</span>
          </div>
        )}

        {/* SUMMARY CARDS */}
        <div className="udhaari-summary-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {/* CARD 1: TOTAL EMPLOYEES */}
          <div className="summary-card-udhaari blue-accent">
            <div>
              <div className="summary-card-label">TOTAL STAFF</div>
              <div className="summary-card-value">{totalEmployees}</div>
            </div>
            <div className="summary-icon-box blue-bg">
              <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>

          {/* CARD 2: ACTIVE EMPLOYEES */}
          <div className="summary-card-udhaari green-accent">
            <div>
              <div className="summary-card-label">ACTIVE ROSTER</div>
              <div className="summary-card-value" style={{ color: '#16a34a' }}>
                {activeEmployeesCount}
              </div>
            </div>
            <div className="summary-icon-box green-bg">
              <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          {/* CARD 3: TOTAL MONTHLY BASE SALARY */}
          <div className="summary-card-udhaari blue-accent">
            <div>
              <div className="summary-card-label">MONTHLY BASE SALARY</div>
              <div className="summary-card-value" style={{ color: '#0284c7' }}>
                ₹{totalMonthlySalary.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
              </div>
            </div>
            <div className="summary-icon-box blue-bg">
              <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>

          {/* CARD 4: OUTSTANDING ADVANCES (UDHAAR) */}
          <div className="summary-card-udhaari red-accent">
            <div>
              <div className="summary-card-label">TOTAL UDHAAR</div>
              <div className="summary-card-value" style={{ color: totalUdhaarOutstanding > 0 ? '#dc2626' : '#16a34a' }}>
                ₹{totalUdhaarOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
              </div>
            </div>
            <div className="summary-icon-box red-bg">
              <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            </div>
          </div>
        </div>

        {/* MAIN DATA TABLE & TOOLBAR */}
        <div className="udhaari-card-box">
          <div className="udhaari-filter-toolbar">
            <div className="udhaari-filter-dropdowns" style={{ flexWrap: 'wrap', gap: '12px' }}>
              <div className="items-search-box" style={{ width: '260px' }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  className="items-search-input"
                  placeholder="Search by UID, Name, Role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <label style={{ fontSize: '13px', color: '#475569', fontWeight: 600 }}>Role:</label>
                <select className="udhaari-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                  <option value="All">All Roles</option>
                  <option value="Helper">Helper</option>
                  <option value="Labour">Labour</option>
                  <option value="Driver">Driver</option>
                  <option value="Staff">Staff</option>
                  <option value="Manager">Manager</option>
                  <option value="Operator">Operator</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <label style={{ fontSize: '13px', color: '#475569', fontWeight: 600 }}>Status:</label>
                <select className="udhaari-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="All">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* TABLE */}
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>Loading employee roster...</div>
          ) : paginatedData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: '14px' }}>
              No employees found matching criteria.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="udhaari-table">
                <thead>
                  <tr>
                    <th>UID</th>
                    <th>Employee Name</th>
                    <th>Role</th>
                    <th>Mobile</th>
                    <th>Salary / Rate</th>
                    <th>Joined On</th>
                    <th>Active Days</th>
                    <th>Udhaar Balance</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((emp) => (
                    <tr key={emp.id || emp.uid}>
                      <td style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '12px' }}>{emp.uid}</td>
                      <td>
                        <div className="udhaari-customer-cell" style={{ cursor: 'pointer' }} onClick={() => setSelectedEmployeeDetails(emp)}>
                          <div className="customer-initial-avatar green-light" style={{ overflow: 'hidden' }}>
                            {emp.photoUrl ? (
                              <img src={emp.photoUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                              emp.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{emp.name}</div>
                            {emp.idNumber && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID: {emp.idNumber}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--color-primary)', fontWeight: 700, fontSize: '13px' }}>
                        <span style={{ backgroundColor: 'rgba(37, 99, 235, 0.12)', padding: '2px 8px', borderRadius: '6px' }}>{emp.role}</span>
                      </td>
                      <td style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600 }}>{emp.mobile}</td>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '13px' }}>
                        ₹{emp.salary ? emp.salary.toLocaleString('en-IN') : 0} <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>{emp.salaryType === 'Per Day' ? '/ day' : '/ mo'}</span>
                      </td>
                      <td style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>{formatDateDisplay(emp.joinedOn)}</td>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '13px' }}>
                        📅 {emp.activeDays} days
                      </td>
                      <td style={{ color: emp.udhaarBalance > 0 ? 'var(--color-baki)' : 'var(--color-jama)', fontWeight: 800, fontSize: '13px' }}>
                        ₹{emp.udhaarBalance.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 10px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 700,
                            backgroundColor: emp.status === 'Active' ? '#dcfce7' : '#f1f5f9',
                            color: emp.status === 'Active' ? '#16a34a' : '#64748b'
                          }}
                        >
                          {emp.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons-cell" style={{ justifyContent: 'flex-end' }}>
                          <button
                            className="action-btn-icon"
                            onClick={() => setSelectedEmployeeDetails(emp)}
                            title="View Full Profile & History"
                          >
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>

                          <button
                            className="action-btn-icon"
                            onClick={() => handleEditEmployeeClick(emp)}
                            title="Edit Employee Profile"
                          >
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>

                          <button
                            className="action-btn-icon delete"
                            onClick={() => handleDeleteEmployeeClick(emp)}
                            title="Delete Employee"
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
            </div>
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
        <EmployeeModal
          isOpen={isEmployeeModalOpen}
          editingEmployee={editingEmployee}
          onClose={() => setIsEmployeeModalOpen(false)}
          onSave={handleSaveEmployee}
        />

        <EmployeeTransactionModal
          isOpen={isTxModalOpen}
          employee={txModalEmployee}
          defaultType={txDefaultType}
          onClose={() => setIsTxModalOpen(false)}
          onSave={handleSaveTransaction}
        />

        <DeleteEmployeeDialog
          isOpen={deletingEmployee !== null}
          employee={deletingEmployee}
          onClose={() => setDeletingEmployee(null)}
          onConfirm={handleConfirmDelete}
        />

        {/* VIEW DETAILED EMPLOYEE PROFILE & HISTORY MODAL */}
        {selectedEmployeeDetails && (
          <div className="modal-overlay" onClick={() => setSelectedEmployeeDetails(null)}>
            <div className="modal-content" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h3 className="modal-title">Employee Profile & History</h3>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    UID: <strong>{selectedEmployeeDetails.uid}</strong> • Status:{' '}
                    <span style={{ color: selectedEmployeeDetails.status === 'Active' ? '#16a34a' : '#64748b', fontWeight: 700 }}>
                      {selectedEmployeeDetails.status}
                    </span>
                  </div>
                </div>
                <button className="modal-close-btn" onClick={() => setSelectedEmployeeDetails(null)}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* PROFILE TOP HEADER */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div className="customer-initial-avatar green-light" style={{ width: '56px', height: '56px', fontSize: '24px' }}>
                    {selectedEmployeeDetails.photoUrl ? (
                      <img src={selectedEmployeeDetails.photoUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      selectedEmployeeDetails.name.charAt(0).toUpperCase()
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#0f172a' }}>{selectedEmployeeDetails.name}</h2>
                    <div style={{ fontSize: '13px', color: '#0284c7', fontWeight: 600 }}>{selectedEmployeeDetails.role}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                      📞 {selectedEmployeeDetails.mobile} {selectedEmployeeDetails.email ? `• ✉️ ${selectedEmployeeDetails.email}` : ''}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>UDHAAR BALANCE</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: selectedEmployeeDetails.udhaarBalance > 0 ? '#dc2626' : '#16a34a' }}>
                      ₹{selectedEmployeeDetails.udhaarBalance.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                    </div>
                  </div>
                </div>

                {/* METRICS & DETAILS GRID */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px' }}>
                    <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 600 }}>JOINED ON</div>
                    <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{formatDateDisplay(selectedEmployeeDetails.joinedOn)}</div>
                  </div>

                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px' }}>
                    <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 600 }}>ACTIVE DAYS</div>
                    <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>📅 {selectedEmployeeDetails.activeDays} Days</div>
                  </div>

                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px' }}>
                    <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 600 }}>BANK NAME & ACCOUNT</div>
                    <div style={{ fontWeight: 600, color: '#0f172a', marginTop: '2px' }}>
                      {selectedEmployeeDetails.bankName ? `${selectedEmployeeDetails.bankName} - ${selectedEmployeeDetails.bankAccount || 'No A/C'}` : 'Not provided'}
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px' }}>
                    <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 600 }}>IDENTITY / EMERGENCY CONTACT</div>
                    <div style={{ fontWeight: 600, color: '#0f172a', marginTop: '2px' }}>
                      ID: {selectedEmployeeDetails.idNumber || 'N/A'} • SOS: {selectedEmployeeDetails.emergencyContact || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* QUICK ACTION BUTTONS */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>RECORD FINANCIAL ENTRY:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <button
                      className="btn-secondary-web"
                      style={{ fontSize: '12px', padding: '6px 12px', backgroundColor: '#fef3c7', color: '#b45309', borderColor: '#fcd34d' }}
                      onClick={() => handleOpenTransaction(selectedEmployeeDetails, 'Gift')}
                    >
                      + 🎁 Gift
                    </button>
                    <button
                      className="btn-secondary-web"
                      style={{ fontSize: '12px', padding: '6px 12px', backgroundColor: '#dcfce7', color: '#15803d', borderColor: '#86efac' }}
                      onClick={() => handleOpenTransaction(selectedEmployeeDetails, 'Bonus')}
                    >
                      + ⭐ Bonus
                    </button>
                    <button
                      className="btn-secondary-web"
                      style={{ fontSize: '12px', padding: '6px 12px', backgroundColor: '#e0e7ff', color: '#4338ca', borderColor: '#a5b4fc' }}
                      onClick={() => handleOpenTransaction(selectedEmployeeDetails, 'Extra Payment')}
                    >
                      + 💸 Extra Payment
                    </button>
                    <button
                      className="btn-secondary-web"
                      style={{ fontSize: '12px', padding: '6px 12px', backgroundColor: '#fee2e2', color: '#b91c1c', borderColor: '#fca5a5' }}
                      onClick={() => handleOpenTransaction(selectedEmployeeDetails, 'Employee Udhaar')}
                    >
                      + 📉 Udhaar / Advance
                    </button>
                    <button
                      className="btn-secondary-web"
                      style={{ fontSize: '12px', padding: '6px 12px', backgroundColor: '#e0f2fe', color: '#0369a1', borderColor: '#7dd3fc' }}
                      onClick={() => handleOpenTransaction(selectedEmployeeDetails, 'Udhaar Repayment')}
                    >
                      + 📈 Repay Udhaar
                    </button>
                    <button
                      className="btn-secondary-web"
                      style={{ fontSize: '12px', padding: '6px 12px', backgroundColor: '#f3e8ff', color: '#7e22ce', borderColor: '#d8b4fe' }}
                      onClick={() => handleOpenTransaction(selectedEmployeeDetails, 'Labour Expense')}
                    >
                      + 🛠️ Labour Expense
                    </button>
                  </div>
                </div>

                {/* TRANSACTION HISTORY LOG TABLE */}
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
                    Financial & Transaction History ({selectedEmpTxList.length})
                  </div>
                  {selectedEmpTxList.length === 0 ? (
                    <div style={{ padding: '20px', backgroundColor: '#f8fafc', borderRadius: '8px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                      No financial transactions recorded yet for this employee.
                    </div>
                  ) : (
                    <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                      <table className="udhaari-table" style={{ fontSize: '12px' }}>
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Amount</th>
                            <th>Note / Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedEmpTxList.map((tx) => (
                            <tr key={tx.id}>
                              <td style={{ whiteSpace: 'nowrap', color: '#64748b' }}>{formatDateDisplay(tx.date)}</td>
                              <td>
                                <span style={{ fontWeight: 600 }}>{tx.type}</span>
                              </td>
                              <td style={{ fontWeight: 700, color: tx.type === 'Employee Udhaar' ? '#dc2626' : '#16a34a' }}>
                                ₹{tx.amount.toLocaleString('en-IN')}
                              </td>
                              <td style={{ color: '#475569' }}>{tx.note || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: '16px' }}>
                <button className="btn-secondary-web" onClick={() => setSelectedEmployeeDetails(null)}>
                  Close
                </button>
                <button className="btn-primary-item" onClick={() => { const emp = selectedEmployeeDetails; setSelectedEmployeeDetails(null); handleEditEmployeeClick(emp); }}>
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
