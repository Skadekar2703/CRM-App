import React from 'react';
import { SaleTransaction, formatCurrency } from '../../types/sales';
import './Sales.css';

interface WebTransactionModalProps {
  transaction: SaleTransaction | null;
  onClose: () => void;
}

export const WebTransactionModal: React.FC<WebTransactionModalProps> = ({ transaction, onClose }) => {
  if (!transaction) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Invoice {transaction.invoiceNumber}
            </h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>{transaction.saleDate}</span>
          </div>
          <button className="icon-button" onClick={onClose}>✕</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px' }}>
          <div>
            <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 700 }}>CUSTOMER</div>
            <div style={{ fontWeight: 700, color: '#0f172a' }}>{transaction.customerName}</div>
          </div>
          <div>
            <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 700 }}>PAYMENT METHOD</div>
            <div style={{ fontWeight: 700, color: '#0f172a' }}>{transaction.paymentMethod}</div>
          </div>
        </div>

        {/* LINE ITEMS */}
        <div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '8px' }}>ITEMS PURCHASED</div>
          <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                <th style={{ padding: '6px 0' }}>Item</th>
                <th style={{ padding: '6px 0', textAlign: 'center' }}>Qty</th>
                <th style={{ padding: '6px 0', textAlign: 'right' }}>Unit Price</th>
                <th style={{ padding: '6px 0', textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {(transaction.items || []).map((item, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '8px 0', fontWeight: 600, color: '#0f172a' }}>{item.itemName}</td>
                  <td style={{ padding: '8px 0', textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ padding: '8px 0', textAlign: 'right' }}>{formatCurrency(item.unitPrice)}</td>
                  <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 700 }}>{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TOTALS */}
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
            <span>Subtotal</span>
            <span>{formatCurrency(transaction.subtotal)}</span>
          </div>
          {transaction.discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
              <span>Discount</span>
              <span>-{formatCurrency(transaction.discount)}</span>
            </div>
          )}
          {transaction.tax > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
              <span>Tax / GST</span>
              <span>+{formatCurrency(transaction.tax)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 800, color: '#0f172a', paddingTop: '6px', borderTop: '1px solid #f1f5f9' }}>
            <span>Total Paid</span>
            <span>{formatCurrency(transaction.total)}</span>
          </div>
        </div>

        <button className="btn-primary-sm" style={{ width: '100%', justifyContent: 'center', padding: '12px' }} onClick={onClose}>
          Close Receipt
        </button>
      </div>
    </div>
  );
};
