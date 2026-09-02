import React, { useState } from 'react';
import { WebSidebar } from './WebSidebar';
import { WebDashboardView } from './WebDashboardView';
import { WebSalesScreen } from '../Sales/WebSalesScreen';
import { WebAreasScreen } from '../Areas/WebAreasScreen';
import { WebCategoriesScreen } from '../Categories/WebCategoriesScreen';
import { WebTransportsScreen } from '../Transports/WebTransportsScreen';
import { WebItemsScreen } from '../Items/WebItemsScreen';
import { WebUdhaariScreen } from '../Udhaari/WebUdhaariScreen';
import { WebChequesScreen } from '../Cheques/WebChequesScreen';
import { WebCustomersScreen } from '../Customers/WebCustomersScreen';
import { WebSuppliersScreen } from '../Suppliers/WebSuppliersScreen';
import { WebEmployeesScreen } from '../Employees/WebEmployeesScreen';
import { WebDaagScreen } from '../Daag/WebDaagScreen';
import { WebNotepadScreen } from '../Notepad/WebNotepadScreen';
import { WebRemindersScreen } from '../Reminders/WebRemindersScreen';
import { WebExpensesScreen } from '../Expenses/WebExpensesScreen';
import { WebSupplierLedgerScreen } from '../SupplierLedger/WebSupplierLedgerScreen';
import { WebCashBookScreen } from '../CashBook/WebCashBookScreen';
import { WebProfitLossScreen } from '../ProfitLoss/WebProfitLossScreen';
import { WebAgingReportScreen } from '../AgingReport/WebAgingReportScreen';
import { WebUserManagementScreen } from '../Users/WebUserManagementScreen';
import { WebAiFloatingButton } from '../AI/WebAiFloatingButton';
import { WebAiChatModal } from '../AI/WebAiChatModal';
import './WebDashboard.css';

interface WebDashboardProps {
  userEmail: string;
  username?: string;
  onLogout: () => void;
}

export const WebDashboard: React.FC<WebDashboardProps> = ({ userEmail, username, onLogout }) => {
  const getInitialSection = () => {
    const hash = window.location.hash.replace('#', '').toLowerCase();
    if (hash === 'users' || hash === 'user-management' || hash === 'usermanagement') return 'Users';
    if (hash === 'aging report' || hash === 'aging-report' || hash === 'agingreport' || hash === 'aging') return 'Aging Report';
    if (hash === 'profit & loss' || hash === 'profit-and-loss' || hash === 'pnl' || hash === 'profitloss') return 'Profit & Loss';
    if (hash === 'cash book' || hash === 'cash-book' || hash === 'cashbook') return 'Cash Book';
    if (hash === 'supplier ledger' || hash === 'supplier-ledger' || hash === 'supplierledger') return 'Supplier Ledger';
    if (hash === 'expenses') return 'Expenses';
    if (hash === 'reminders') return 'Reminders';
    if (hash === 'notepad' || hash === 'notes') return 'Notepad';
    if (hash === 'daag') return 'Daag';
    if (hash === 'employees') return 'Employees';
    if (hash === 'suppliers') return 'Suppliers';
    if (hash === 'customers') return 'Customers';
    if (hash === 'cheques') return 'Cheques';
    if (hash === 'udhaari') return 'Udhaari';
    if (hash === 'items') return 'Items';
    if (hash === 'transports') return 'Transports';
    if (hash === 'categories') return 'Categories';
    if (hash === 'areas') return 'Areas';
    if (hash === 'sales') return 'Sales';
    if (hash === 'dashboard') return 'Dashboard';
    return 'Dashboard';
  };

  const [activeSection, setActiveSectionState] = useState(getInitialSection);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const userDisplayName = username || userEmail.split('@')[0];

  const handleSelectSection = (section: string) => {
    setActiveSectionState(section);
    window.location.hash = section.toLowerCase();
  };

  return (
    <div className="crm-layout">
      {/* SIDEBAR */}
      <WebSidebar
        activeSection={activeSection}
        onSelectSection={handleSelectSection}
        userDisplayName={userDisplayName}
      />

      {/* MAIN CONTAINER */}
      <div className="crm-main">
        {/* HEADER */}
        <header className="crm-header">
          <h1 className="header-title">
            {activeSection === 'Profile' || activeSection === 'Dashboard' ? 'CRM Dashboard' : `${activeSection} Management`}
          </h1>

          <div className="header-right">
            <button className="icon-button" aria-label="Notifications">
              <span className="notification-badge"></span>
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>

            <div className="header-avatar" title={userEmail}>
              {userDisplayName.charAt(0).toUpperCase()}
            </div>

            <button className="logout-link" onClick={onLogout}>
              Logout
            </button>
          </div>
        </header>

        {/* CONTENT VIEW */}
        {activeSection === 'Profile' || activeSection === 'Dashboard' ? (
          <WebDashboardView onSelectSection={handleSelectSection} />
        ) : activeSection === 'Sales' ? (
          <WebSalesScreen />
        ) : activeSection === 'Areas' ? (
          <WebAreasScreen />
        ) : activeSection === 'Categories' ? (
          <WebCategoriesScreen />
        ) : activeSection === 'Transports' ? (
          <WebTransportsScreen />
        ) : activeSection === 'Items' ? (
          <WebItemsScreen />
        ) : activeSection === 'Udhaari' ? (
          <WebUdhaariScreen />
        ) : activeSection === 'Cheques' ? (
          <WebChequesScreen />
        ) : activeSection === 'Customers' ? (
          <WebCustomersScreen />
        ) : activeSection === 'Suppliers' ? (
          <WebSuppliersScreen />
        ) : activeSection === 'Employees' ? (
          <WebEmployeesScreen />
        ) : activeSection === 'Daag' ? (
          <WebDaagScreen />
        ) : activeSection === 'Notepad' || activeSection === 'Notes' ? (
          <WebNotepadScreen />
        ) : activeSection === 'Reminders' ? (
          <WebRemindersScreen />
        ) : activeSection === 'Expenses' ? (
          <WebExpensesScreen />
        ) : activeSection === 'Supplier Ledger' || activeSection === 'SupplierLedger' ? (
          <WebSupplierLedgerScreen />
        ) : activeSection === 'Cash Book' || activeSection === 'CashBook' ? (
          <WebCashBookScreen />
        ) : activeSection === 'Profit & Loss' || activeSection === 'ProfitAndLoss' || activeSection === 'P&L' ? (
          <WebProfitLossScreen />
        ) : activeSection === 'Aging Report' || activeSection === 'AgingReport' ? (
          <WebAgingReportScreen />
        ) : activeSection === 'Users' || activeSection === 'UserManagement' ? (
          <WebUserManagementScreen />
        ) : (
          <div className="crm-content">
            <div className="card-box" style={{ padding: '40px', textAlign: 'center' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                {activeSection} Module
              </h2>
              <p style={{ color: '#64748b', fontSize: '14px' }}>
                This section is prepared and will be connected to Supabase data endpoints in future steps.
              </p>
            </div>
          </div>
        )}

        {/* GLOBAL FLOATING AI BUTTON & CHAT DRAWER */}
        <WebAiFloatingButton onClick={() => setIsAiModalOpen(true)} />
        <WebAiChatModal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} />
      </div>
    </div>
  );
};
