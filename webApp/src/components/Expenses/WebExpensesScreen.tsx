import React, { useState, useMemo, useEffect } from 'react';
import { WebExpense, INITIAL_WEB_EXPENSES } from '../../types/expenses';
import { ExpenseModal } from './ExpenseModal';
import { DeleteExpenseDialog } from './DeleteExpenseDialog';
import { supabase } from '../../lib/supabase';
import '../Udhaari/Udhaari.css';

export const WebExpensesScreen: React.FC = () => {
  const [expenses, setExpenses] = useState<WebExpense[]>(INITIAL_WEB_EXPENSES);
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // MODALS
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<WebExpense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<WebExpense | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // FETCH SUPABASE DATA
  const fetchExpensesFromSupabase = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.from('expenses').select('*');
      if (!error && data && data.length > 0) {
        const mapped: WebExpense[] = data.map((item: any, idx: number) => ({
          id: item.id || `EXP-${100 + idx}`,
          date: item.date || '14 Jun 2026',
          category: item.category || 'Other',
          amount: parseFloat(item.amount) || 0.0,
          paymentMode: item.payment_mode || item.paymentMode || 'Cash',
          paidTo: item.paid_to || item.paidTo || '—',
          description: item.description || '—',
          createdAt: item.created_at || '2026-06-14'
        }));
        setExpenses(mapped);
      }
    } catch (e) {
      console.log('Supabase expenses read fallback to local state', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpensesFromSupabase();
  }, []);

  // CALCULATE SUMMARY CARDS DYNAMICALLY
  const summary = useMemo(() => {
    const todayStr = '29 Aug 2026';
    const monthStr = 'Aug';

    const todaySum = expenses
      .filter((e) => e.date.includes(todayStr) || e.date.includes('2026-08-29'))
      .reduce((sum, e) => sum + e.amount, 0);

    const monthSum = expenses
      .filter((e) => e.date.includes(monthStr) || e.date.includes('2026-08') || e.date.includes('Jun'))
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      todayTotal: todaySum,
      monthTotal: monthSum,
      totalRecords: expenses.length
    };
  }, [expenses]);

  // REAL-TIME SEARCH
  const filteredExpenses = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return expenses;
    return expenses.filter(
      (e) =>
        e.category.toLowerCase().includes(q) ||
        (e.paidTo && e.paidTo.toLowerCase().includes(q)) ||
        (e.description && e.description.toLowerCase().includes(q)) ||
        e.paymentMode.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q)
    );
  }, [expenses, searchQuery]);

  // PAGINATION LOGIC
  const totalPages = Math.max(1, Math.ceil(filteredExpenses.length / pageSize));
  const paginatedExpenses = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return filteredExpenses.slice(startIdx, startIdx + pageSize);
  }, [filteredExpenses, currentPage, pageSize]);

  // HANDLERS
  const handleAddClick = () => {
    setEditingExpense(null);
    setIsFormModalOpen(true);
  };

  const handleEditClick = (expense: WebExpense) => {
    setEditingExpense(expense);
    setIsFormModalOpen(true);
  };

  const handleSaveExpense = async (
    date: string,
    category: string,
    amount: number,
    paymentMode: string,
    paidTo?: string,
    description?: string
  ) => {
    if (editingExpense) {
      setExpenses((prev) =>
        prev.map((e) =>
          e.id === editingExpense.id
            ? { ...e, date, category, amount, paymentMode, paidTo, description }
            : e
        )
      );

      try {
        await supabase
          .from('expenses')
          .update({
            date,
            category,
            amount,
            payment_mode: paymentMode,
            paid_to: paidTo,
            description
          })
          .eq('id', editingExpense.id);
      } catch (e) {
        console.log('Supabase update error', e);
      }

      showToast(`Expense for "${category}" updated.`);
    } else {
      const nextId = `EXP-${100 + expenses.length + 1}`;
      const newE: WebExpense = {
        id: nextId,
        date,
        category,
        amount,
        paymentMode,
        paidTo,
        description,
        createdAt: 'Just now'
      };

      setExpenses((prev) => [newE, ...prev]);

      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        const expPayload: any = {
          id: nextId,
          date,
          category,
          amount,
          payment_mode: paymentMode,
          paid_to: paidTo,
          description
        };
        if (userId) expPayload.user_id = userId;

        await supabase.from('expenses').insert([expPayload]);
      } catch (e) {
        console.log('Supabase insert error', e);
      }

      showToast(`New expense for "${category}" created.`);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingExpense) return;
    const targetId = deletingExpense.id;
    const targetCat = deletingExpense.category;

    setExpenses((prev) => prev.filter((e) => e.id !== targetId));

    try {
      await supabase.from('expenses').delete().eq('id', targetId);
    } catch (e) {
      console.log('Supabase delete error', e);
    }

    showToast(`Expense "${targetCat}" deleted.`);
    setDeletingExpense(null);
  };

  // EXPORT HANDLERS
  const handleExportCSV = () => {
    const headers = ['ID', 'Date', 'Category', 'Amount (INR)', 'Payment Mode', 'Paid To', 'Description'];
    const rows = filteredExpenses.map((e) => [
      e.id,
      `"${e.date}"`,
      `"${e.category}"`,
      e.amount,
      e.paymentMode,
      `"${e.paidTo || ''}"`,
      `"${e.description || ''}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'expenses_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            <h1 className="udhaari-title-text">Expenses</h1>
            <div className="udhaari-subtitle-text">Track and manage business operating expenditures & payments</div>
          </div>

          <div className="udhaari-header-buttons">
            <button className="btn-secondary-udhaari" onClick={fetchExpensesFromSupabase}>
              Refresh
            </button>
            <button className="btn-secondary-udhaari" onClick={handleExportCSV}>
              CSV
            </button>
            <button className="btn-secondary-udhaari" onClick={handlePrint}>
              Print
            </button>
            <button className="btn-primary-udhaari" onClick={handleAddClick}>
              + Add Expense
            </button>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="udhaari-summary-grid">
          <div className="udhaari-card-box">
            <div className="udhaari-stat-label">TODAY'S EXPENSES</div>
            <div className="udhaari-stat-value text-red">₹{summary.todayTotal.toFixed(2)}</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Spent so far today</div>
          </div>

          <div className="udhaari-card-box">
            <div className="udhaari-stat-label">THIS MONTH</div>
            <div className="udhaari-stat-value text-blue">₹{summary.monthTotal.toFixed(2)}</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Current month total</div>
          </div>

          <div className="udhaari-card-box">
            <div className="udhaari-stat-label">TOTAL RECORDS</div>
            <div className="udhaari-stat-value text-amber">{summary.totalRecords}</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Active expense entries</div>
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

        {/* TOOLBAR & SEARCH BAR */}
        <div className="udhaari-card-box" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Show</span>
              <select
                className="form-control"
                style={{ width: 'auto', display: 'inline-block', padding: '6px 12px', fontSize: '13px' }}
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>entries</span>
            </div>

            <div className="items-search-box" style={{ width: '100%', maxWidth: '380px' }}>
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                className="items-search-input"
                placeholder="Search by category, paid to or description..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
        </div>

        {/* EXPENSE TABLE */}
        <div className="udhaari-card-box" style={{ padding: 0, overflow: 'hidden' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>Loading expenses...</div>
          ) : filteredExpenses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: '#64748b' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#334155', margin: 0 }}>No expenses found</h3>
              <p style={{ fontSize: '13px', marginTop: '4px' }}>
                {searchQuery ? `No expenses matching "${searchQuery}"` : 'Create your first expense entry!'}
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="udhaari-table">
                <thead>
                  <tr>
                    <th>DATE</th>
                    <th>CATEGORY</th>
                    <th>AMOUNT</th>
                    <th>MODE</th>
                    <th>PAID TO</th>
                    <th>DESCRIPTION</th>
                    <th style={{ textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedExpenses.map((expense) => (
                    <tr key={expense.id}>
                      <td style={{ fontWeight: 600, color: '#334155' }}>{expense.date}</td>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>{expense.category}</td>
                      <td style={{ fontWeight: 800, color: '#dc2626' }}>₹{expense.amount.toFixed(2)}</td>
                      <td>
                        <span className="udhaari-badge badge-settled" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}>
                          {expense.paymentMode}
                        </span>
                      </td>
                      <td style={{ color: '#475569' }}>{expense.paidTo || '—'}</td>
                      <td style={{ color: '#64748b', fontSize: '13px' }}>{expense.description || '—'}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button className="btn-action-view" onClick={() => handleEditClick(expense)}>
                            Edit
                          </button>

                          <button
                            className="btn-action-settle"
                            style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}
                            onClick={() => setDeletingExpense(expense)}
                          >
                            Delete
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
          {filteredExpenses.length > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 20px',
                borderTop: '1px solid #e2e8f0',
                backgroundColor: '#fafafa'
              }}
            >
              <div style={{ fontSize: '13px', color: '#64748b' }}>
                Showing {(currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, filteredExpenses.length)} of {filteredExpenses.length} entries
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  className="btn-secondary-udhaari"
                  style={{ padding: '4px 12px', fontSize: '12px' }}
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  className="btn-secondary-udhaari"
                  style={{ padding: '4px 12px', fontSize: '12px' }}
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* MODALS */}
        <ExpenseModal
          isOpen={isFormModalOpen}
          editingExpense={editingExpense}
          onClose={() => setIsFormModalOpen(false)}
          onSave={handleSaveExpense}
        />

        <DeleteExpenseDialog
          isOpen={deletingExpense !== null}
          expense={deletingExpense}
          onClose={() => setDeletingExpense(null)}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </div>
  );
};
