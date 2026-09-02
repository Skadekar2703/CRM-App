import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  SaleTransaction,
  SalesSummaryStats,
  INITIAL_SALES,
  formatCurrency
} from '../../types/sales';
import { WebTransactionModal } from './WebTransactionModal';
import './Sales.css';

export const WebSalesHistoryView: React.FC = () => {
  const [sales, setSales] = useState<SaleTransaction[]>([]);
  const [stats, setStats] = useState<SalesSummaryStats>({
    todaySalesFormatted: '₹5,775',
    todayCount: 2,
    thisWeekSalesFormatted: '₹47,780',
    thisWeekChange: '+8.4%',
    thisMonthSalesFormatted: '₹2,32,780',
    thisMonthChange: '+12.1%'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedTransaction, setSelectedTransaction] = useState<SaleTransaction | null>(null);

  useEffect(() => {
    loadSalesHistory();
  }, []);

  const loadSalesHistory = async () => {
    try {
      const { data: dbSales } = await supabase
        .from('sales')
        .select(`
          *,
          sale_items (*)
        `)
        .order('created_at', { ascending: false });

      if (dbSales && dbSales.length > 0) {
        const mappedSales: SaleTransaction[] = dbSales.map((s: any) => {
          const items = (s.sale_items || []).map((li: any) => ({
            id: li.id,
            itemId: li.item_id || '',
            itemName: li.item_name,
            quantity: Number(li.quantity),
            unitPrice: Number(li.unit_price),
            total: Number(li.total)
          }));

          return {
            id: s.id,
            invoiceNumber: s.invoice_number,
            customerId: s.customer_id || '',
            customerName: s.customer_name,
            saleDate: new Date(s.created_at || s.sale_date).toLocaleString(),
            subtotal: Number(s.subtotal),
            discount: Number(s.discount),
            tax: Number(s.tax),
            total: Number(s.total),
            paymentMethod: s.payment_method,
            status: s.status,
            items
          };
        });

        setSales(mappedSales);

        const todayTotal = mappedSales.filter(s => s.saleDate.includes('Today') || new Date(s.saleDate).toDateString() === new Date().toDateString()).reduce((sum, s) => sum + s.total, 0);
        setStats(prev => ({
          ...prev,
          todaySalesFormatted: formatCurrency(todayTotal),
          todayCount: mappedSales.length
        }));
      } else {
        setSales(INITIAL_SALES);
      }
    } catch {
      setSales(INITIAL_SALES);
    }
  };

  const filteredSales = sales.filter(s => {
    const matchesSearch = s.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPayment = paymentFilter === 'All' || s.paymentMethod === paymentFilter;
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
    return matchesSearch && matchesPayment && matchesStatus;
  });

  return (
    <div className="sales-container">
      {/* SUMMARY STATS CARDS */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-header">
            <span>TODAY'S SALES</span>
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="stat-value">{stats.todaySalesFormatted}</div>
          <div className="stat-sub positive">{stats.todayCount} Completed Transactions</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>THIS WEEK</span>
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="stat-value">{stats.thisWeekSalesFormatted}</div>
          <div className="stat-sub positive">📈 {stats.thisWeekChange} vs last week</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>THIS MONTH</span>
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="stat-value">{stats.thisMonthSalesFormatted}</div>
          <div className="stat-sub positive">📈 {stats.thisMonthChange} target reached</div>
        </div>
      </div>

      {/* RECENT TRANSACTIONS CARD */}
      <div className="card-box">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Recent Transactions
          </h2>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="search-input-wrapper" style={{ width: '220px' }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                className="pos-search-input"
                style={{ padding: '6px 12px 6px 36px', fontSize: '13px' }}
                placeholder="Search invoices..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              className="form-select"
              style={{ width: '110px', padding: '6px 8px', fontSize: '12px' }}
              value={paymentFilter}
              onChange={e => setPaymentFilter(e.target.value)}
            >
              <option value="All">All Modes</option>
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="UPI">UPI</option>
            </select>

            <select
              className="form-select"
              style={{ width: '120px', padding: '6px 8px', fontSize: '12px' }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="Refunded">Refunded</option>
            </select>
          </div>
        </div>

        <table className="debtors-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Date & Time</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Mode</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.map((s) => (
              <tr key={s.id}>
                <td style={{ fontWeight: 700, color: '#0284c7' }}>{s.invoiceNumber}</td>
                <td style={{ color: '#64748b', fontSize: '13px' }}>{s.saleDate}</td>
                <td className="customer-name-td">{s.customerName}</td>
                <td style={{ fontWeight: 800, color: '#0f172a' }}>{formatCurrency(s.total)}</td>
                <td>
                  <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#334155' }}>
                    {s.paymentMethod}
                  </span>
                </td>
                <td>
                  <span className={`badge ${s.status === 'Completed' ? 'overdue' : 'pending'}`} style={{ backgroundColor: s.status === 'Completed' ? '#f0fdf4' : '#fef2f2', color: s.status === 'Completed' ? '#16a34a' : '#dc2626' }}>
                    {s.status}
                  </span>
                </td>
                <td>
                  <button className="view-details-btn" onClick={() => setSelectedTransaction(s)}>
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <WebTransactionModal
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
      />
    </div>
  );
};
