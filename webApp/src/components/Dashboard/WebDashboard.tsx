import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
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
import { WebSettingsScreen } from '../Settings/WebSettingsScreen';
import { WebAiFloatingButton } from '../AI/WebAiFloatingButton';
import { WebAiChatModal } from '../AI/WebAiChatModal';
import './WebDashboard.css';

interface WebDashboardProps {
  userEmail: string;
  username?: string;
  onLogout: () => void;
}

export const WebDashboard: React.FC<WebDashboardProps> = ({ userEmail, username, onLogout }) => {
  const [userRole, setUserRole] = useState<'ADMIN' | 'STAFF'>('STAFF');

  const getInitialSection = () => {
    const hash = window.location.hash.replace('#', '').toLowerCase();
    if (hash === 'users' || hash === 'user-management' || hash === 'usermanagement') return 'Users';
    if (hash === 'settings') return 'Settings';
    if (hash === 'reminders') return 'Reminders';
    if (hash === 'notepad' || hash === 'notes') return 'Notepad';
    if (hash === 'areas') return 'Areas';
    if (hash === 'categories' || hash === 'category' || hash === 'customer-categories') return 'Categories';
    if (hash === 'expenses') return 'Expenses';
    if (hash === 'cash book' || hash === 'cash-book' || hash === 'cashbook') return 'Cash Book';
    if (hash === 'cheques') return 'Cheques';
    if (hash === 'profit & loss' || hash === 'profit-and-loss' || hash === 'pnl' || hash === 'profitloss') return 'Profit & Loss';
    if (hash === 'udhaari') return 'Udhaari';
    if (hash === 'customers' || hash === 'customer' || hash === 'customer-management') return 'Customers';
    if (hash === 'dashboard') return 'Dashboard';
    return 'Dashboard';
  };

  const [activeSection, setActiveSectionState] = useState(getInitialSection);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const userDisplayName = username || userEmail.split('@')[0];

  useEffect(() => {
    const handleHashChange = () => {
      setActiveSectionState(getInitialSection());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: member } = await supabase
            .from('business_members')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();
          if (member?.role && String(member.role).toUpperCase() === 'ADMIN') {
            setUserRole('ADMIN');
          } else {
            setUserRole('STAFF');
            // Protect against manual URL entry to Users screen for STAFF
            if (activeSection === 'Users') {
              setActiveSectionState('Dashboard');
              window.location.hash = 'dashboard';
            }
          }
        }
      } catch (e) {
        setUserRole('STAFF');
      }
    };
    fetchUserRole();
  }, [activeSection]);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('crm_theme') === 'dark';
  });

  useEffect(() => {
    const themeStr = isDarkMode ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', themeStr);
    if (isDarkMode) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('crm_theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('crm_theme', 'light');
    }
  }, [isDarkMode]);

  const handleToggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const handleLogoutAction = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      localStorage.removeItem('supabase.auth.token');
      window.location.hash = '';
      onLogout();
    }
  };

  const handleSelectSection = (section: string) => {
    if (section === 'Users' && userRole !== 'ADMIN') {
      setActiveSectionState('Dashboard');
      window.location.hash = 'dashboard';
      return;
    }
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
        userRole={userRole}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
        onLogout={handleLogoutAction}
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

            <button className="logout-link" onClick={handleLogoutAction}>
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
        ) : activeSection === 'Settings' ? (
          <WebSettingsScreen />
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
