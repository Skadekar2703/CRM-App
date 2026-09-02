import React, { useState, useMemo, useEffect } from 'react';
import { WebEmployee, INITIAL_WEB_EMPLOYEES } from '../../types/employees';
import { EmployeeModal } from './EmployeeModal';
import { DeleteEmployeeDialog } from './DeleteEmployeeDialog';
import { supabase } from '../../lib/supabase';
import '../Udhaari/Udhaari.css';

export const WebEmployeesScreen: React.FC = () => {
  const [employees, setEmployees] = useState<WebEmployee[]>(INITIAL_WEB_EMPLOYEES);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // MODALS & DETAIL VIEWS
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<WebEmployee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<WebEmployee | null>(null);
  const [selectedEmployeeDetails, setSelectedEmployeeDetails] = useState<WebEmployee | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // FETCH SUPABASE DATA IF AVAILABLE
  const fetchEmployeesFromSupabase = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.from('employees').select('*');
      if (!error && data && data.length > 0) {
        const mapped: WebEmployee[] = data.map((item: any, idx: number) => ({
          uid: item.uid || item.id || `EMP-00${idx + 1}`,
          name: item.name || 'Staff Member',
          mobile: item.mobile || item.phone || '+91 98765 43210',
          email: item.email || '',
          role: item.role || 'Staff',
          salary: item.salary || 35000,
          ctcYtd: item.ctc_ytd || 420000,
          udhaarBalance: item.udhaar_balance || 0,
          joinedDate: item.joined_date || 'Jan 2024',
          status: item.status || 'Active'
        }));
        setEmployees(mapped);
      }
    } catch (e) {
      console.log('Supabase employees read fallback', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeesFromSupabase();
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

      return matchesQuery && matchesStatus;
    });
  }, [employees, searchQuery, statusFilter]);

  // PAGINATION
  const totalEntries = filteredEmployees.length;
  const totalPages = Math.ceil(totalEntries / itemsPerPage) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const paginatedData = filteredEmployees.slice(startIndex, startIndex + itemsPerPage);

  // CRUD HANDLERS
  const handleAddEmployeeClick = () => {
    setEditingEmployee(null);
    setIsModalOpen(true);
  };

  const handleEditEmployeeClick = (employee: WebEmployee) => {
    setEditingEmployee(employee);
    setIsModalOpen(true);
  };

  const handleDeleteEmployeeClick = (employee: WebEmployee) => {
    setDeletingEmployee(employee);
  };

  const handleSaveEmployee = async (
    name: string,
    mobile: string,
    email: string,
    role: string,
    salary: number,
    ctcYtd: number,
    udhaarBalance: number,
    status: 'Active' | 'Inactive'
  ) => {
    if (editingEmployee) {
      setEmployees((prev) =>
        prev.map((e) =>
          e.uid === editingEmployee.uid
            ? { ...e, name, mobile, email, role, salary, ctcYtd, udhaarBalance, status }
            : e
        )
      );

      try {
        await supabase
          .from('employees')
          .update({ name, mobile, email, role, salary, ctc_ytd: ctcYtd, udhaar_balance: udhaarBalance, status })
          .eq('name', editingEmployee.name);
      } catch (err) {
        console.log('Supabase update warning', err);
      }

      showToast(`Employee "${name}" updated.`);
    } else {
      const nextUid = `EMP-00${employees.length + 1}`;
      const newE: WebEmployee = {
        uid: nextUid,
        name,
        mobile,
        email,
        role,
        salary,
        ctcYtd,
        udhaarBalance,
        joinedDate: 'Today',
        status
      };
      setEmployees((prev) => [newE, ...prev]);

      try {
        await supabase.from('employees').insert([
          {
            name,
            mobile,
            email,
            role,
            salary,
            ctc_ytd: ctcYtd,
            udhaar_balance: udhaarBalance,
            status
          }
        ]);
      } catch (err) {
        console.log('Supabase insert warning', err);
      }

      showToast(`New employee "${name}" added.`);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingEmployee) return;
    const name = deletingEmployee.name;
    setEmployees((prev) => prev.filter((e) => e.uid !== deletingEmployee.uid));

    try {
      await supabase.from('employees').delete().eq('name', name);
    } catch (err) {
      console.log('Supabase delete warning', err);
    }

    showToast(`Employee "${name}" deleted.`);
    setDeletingEmployee(null);
  };

  // EXPORT CSV
  const handleExportCSV = () => {
    const headers = ['UID', 'NAME', 'ROLE', 'MOBILE', 'SALARY', 'CTC YTD', 'UDHAAR BAL', 'JOINED', 'STATUS'];
    const rows = filteredEmployees.map((e) => [
      e.uid,
      `"${e.name}"`,
      `"${e.role}"`,
      `"${e.mobile}"`,
      `"₹${e.salary}"`,
      `"₹${e.ctcYtd}"`,
      `"₹${e.udhaarBalance}"`,
      `"${e.joinedDate}"`,
      e.status
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `employees_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Employees CSV downloaded.');
  };

  return (
    <div className="crm-content">
      <div className="udhaari-container">
        {/* PAGE HEADER */}
        <div className="udhaari-page-header">
          <div>
            <h1 className="udhaari-title-text">Employee Management</h1>
            <div className="udhaari-subtitle-text">
              Track team roster, staff roles, payroll & udhaar advances
            </div>
          </div>

          <div className="udhaari-header-buttons">
            <button className="btn-secondary-udhaari" onClick={handleExportCSV}>
              Export
            </button>
            <button className="btn-primary-udhaari" onClick={handleAddEmployeeClick}>
              + Add Employee
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
          {/* CARD 1: TOTAL EMPLOYEES */}
          <div className="summary-card-udhaari blue-accent">
            <div>
              <div className="summary-card-label">TOTAL EMPLOYEES</div>
              <div className="summary-card-value">{totalEmployees}</div>
            </div>
            <div className="summary-icon-box blue-bg">
              <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>

          {/* CARD 2: ACTIVE EMPLOYEES */}
          <div className="summary-card-udhaari">
            <div>
              <div className="summary-card-label">ACTIVE EMPLOYEES</div>
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

          {/* CARD 3: TOTAL MONTHLY SALARY */}
          <div className="summary-card-udhaari red-accent">
            <div>
              <div className="summary-card-label">TOTAL MONTHLY SALARY</div>
              <div className="summary-card-value">
                ₹{totalMonthlySalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="summary-icon-box red-bg">
              <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

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
                  placeholder="Search employees..."
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
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>Loading employees...</div>
          ) : paginatedData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: '14px' }}>
              No employees found.
            </div>
          ) : (
            <table className="udhaari-table">
              <thead>
                <tr>
                  <th>UID</th>
                  <th>Employee Name</th>
                  <th>Mobile</th>
                  <th>Role</th>
                  <th>Salary</th>
                  <th>CTC YTD</th>
                  <th>Udhaar Bal</th>
                  <th>Joined Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((emp) => (
                  <tr key={emp.uid}>
                    <td style={{ fontWeight: 600, color: '#64748b', fontSize: '13px' }}>{emp.uid}</td>
                    <td>
                      <div className="udhaari-customer-cell">
                        <div className="customer-initial-avatar green-light">
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        {emp.name}
                      </div>
                    </td>
                    <td style={{ color: '#475569', fontSize: '13px' }}>{emp.mobile}</td>
                    <td style={{ color: '#0369a1', fontWeight: 600, fontSize: '13px' }}>{emp.role}</td>
                    <td style={{ color: '#0f172a', fontWeight: 700, fontSize: '13px' }}>
                      ₹{emp.salary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ color: '#64748b', fontSize: '13px' }}>
                      ₹{emp.ctcYtd.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ color: emp.udhaarBalance > 0 ? '#dc2626' : '#16a34a', fontWeight: 700, fontSize: '13px' }}>
                      ₹{emp.udhaarBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ color: '#64748b', fontSize: '13px' }}>{emp.joinedDate}</td>
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
                          title="View Details"
                        >
                          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>

                        <button
                          className="action-btn-icon"
                          onClick={() => handleEditEmployeeClick(emp)}
                          title="Edit Employee"
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
          isOpen={isModalOpen}
          editingEmployee={editingEmployee}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveEmployee}
        />

        <DeleteEmployeeDialog
          isOpen={deletingEmployee !== null}
          employee={deletingEmployee}
          onClose={() => setDeletingEmployee(null)}
          onConfirm={handleConfirmDelete}
        />

        {/* VIEW DETAILS MODAL */}
        {selectedEmployeeDetails && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '480px' }}>
              <div className="modal-header">
                <h2>Employee Details</h2>
                <button className="modal-close-btn" onClick={() => setSelectedEmployeeDetails(null)}>
                  &times;
                </button>
              </div>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Employee UID:</span>
                  <span style={{ fontWeight: 700 }}>{selectedEmployeeDetails.uid}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Name:</span>
                  <span style={{ fontWeight: 700 }}>{selectedEmployeeDetails.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Role / Designation:</span>
                  <span>{selectedEmployeeDetails.role}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Mobile:</span>
                  <span>{selectedEmployeeDetails.mobile}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Monthly Salary:</span>
                  <span>₹{selectedEmployeeDetails.salary.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>CTC YTD:</span>
                  <span>₹{selectedEmployeeDetails.ctcYtd.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Udhaar Balance:</span>
                  <span style={{ fontWeight: 700, color: selectedEmployeeDetails.udhaarBalance > 0 ? '#dc2626' : '#16a34a' }}>
                    ₹{selectedEmployeeDetails.udhaarBalance.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="modal-footer" style={{ marginTop: '16px' }}>
                <button className="btn-primary-udhaari" onClick={() => setSelectedEmployeeDetails(null)}>
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
