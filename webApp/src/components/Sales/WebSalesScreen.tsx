import React, { useState } from 'react';
import { WebNewSalePosView } from './WebNewSalePosView';
import { WebSalesHistoryView } from './WebSalesHistoryView';
import './Sales.css';

export const WebSalesScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pos' | 'history'>('pos');

  return (
    <div className="crm-content">
      {/* SEGMENTED TAB BAR */}
      <div className="sales-tab-bar">
        <button
          className={`sales-tab-button ${activeTab === 'pos' ? 'active' : ''}`}
          onClick={() => setActiveTab('pos')}
        >
          NEW SALE (POS)
        </button>
        <button
          className={`sales-tab-button ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          SALES HISTORY
        </button>
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'pos' ? (
        <WebNewSalePosView onSaleCompleted={() => {}} />
      ) : (
        <WebSalesHistoryView />
      )}
    </div>
  );
};
