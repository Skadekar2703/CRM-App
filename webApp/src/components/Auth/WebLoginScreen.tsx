import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import './Auth.css';

interface WebLoginScreenProps {
  onNavigateToSignUp?: () => void;
}

export const WebLoginScreen: React.FC<WebLoginScreenProps> = () => {
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'STAFF'>('ADMIN');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim().toLowerCase();

    if (!cleanUsername) {
      setErrorMessage('Please enter your username.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    let resolvedEmail = `${cleanUsername}@business.crm`;
    let preCheckRole: string | null = null;
    let preCheckStatus: string | null = null;

    // 1. PRE-AUTHENTICATION ROLE & ACCOUNT CHECK VIA USERNAME RPC
    try {
      const { data: rpcData, error: rpcErr } = await supabase.rpc('get_user_email_by_username', {
        p_username: cleanUsername
      });

      if (!rpcErr && rpcData && rpcData.length > 0) {
        resolvedEmail = rpcData[0].email || resolvedEmail;
        preCheckRole = (rpcData[0].role || '').toUpperCase();
        preCheckStatus = rpcData[0].status || 'Active';
      }
    } catch (e) {
      console.log('Username RPC fallback:', e);
    }

    // Check account status
    if (preCheckStatus === 'Disabled') {
      setIsLoading(false);
      setPassword('');
      setErrorMessage('Your account has been disabled. Please contact your CRM Admin.');
      return;
    }

    // Check role mismatch BEFORE calling signInWithPassword
    if (preCheckRole) {
      if (selectedRole === 'ADMIN' && preCheckRole !== 'ADMIN') {
        setIsLoading(false);
        setPassword('');
        setErrorMessage('This account is not an Admin account. Please use Staff Login.');
        return;
      }

      if (selectedRole === 'STAFF' && preCheckRole === 'ADMIN') {
        setIsLoading(false);
        setPassword('');
        setErrorMessage('This account is an Admin account. Please use Admin Login.');
        return;
      }
    }

    // 2. AUTHENTICATE WITH REAL SUPABASE AUTH
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: resolvedEmail,
      password,
    });

    if (error) {
      setIsLoading(false);
      setPassword('');
      const msg = error.message;
      if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) {
        setErrorMessage('Invalid username or password. Please try again.');
      } else {
        setErrorMessage(msg);
      }
      return;
    }

    // 3. POST-AUTHENTICATION DOUBLE-CHECK VERIFICATION AGAINST BUSINESS_MEMBERS TABLE
    const userId = authData.user?.id;
    if (userId) {
      const { data: memberData } = await supabase
        .from('business_members')
        .select('role, status')
        .eq('id', userId)
        .single();

      const realRole = (memberData?.role || 'STAFF').toUpperCase();
      const realStatus = memberData?.status || 'Active';

      if (realStatus === 'Disabled') {
        await supabase.auth.signOut();
        setIsLoading(false);
        setPassword('');
        setErrorMessage('Your account has been disabled. Please contact your CRM Admin.');
        return;
      }

      if (selectedRole === 'ADMIN' && realRole !== 'ADMIN') {
        await supabase.auth.signOut();
        setIsLoading(false);
        setPassword('');
        setErrorMessage('This account is not an Admin account. Please use Staff Login.');
        return;
      }

      if (selectedRole === 'STAFF' && realRole === 'ADMIN') {
        await supabase.auth.signOut();
        setIsLoading(false);
        setPassword('');
        setErrorMessage('This account is an Admin account. Please use Admin Login.');
        return;
      }
    }

    setIsLoading(false);
  };

  const handleForgotPassword = async () => {
    if (selectedRole === 'STAFF') return;
    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) {
      setErrorMessage('Please enter your admin username to request password reset.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const { error } = await supabase.auth.resetPasswordForEmail(`${cleanUsername}@business.crm`, {
      redirectTo: window.location.origin,
    });

    setIsLoading(false);

    if (error) {
      setErrorMessage(error.message);
    } else {
      setSuccessMessage(`Password reset instructions initiated for Admin ${cleanUsername}.`);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card-wrapper">
        <div className="auth-card">
          <div className="crm-logo-circle">CRM</div>

          <h2 className="auth-title">Business Login</h2>
          <p className="auth-subtitle">Sign in to access your business CRM platform.</p>

          {/* ROLE SELECTOR TABS */}
          <div style={{
            display: 'flex',
            width: '100%',
            backgroundColor: 'var(--bg-surface-secondary, #F1F5F9)',
            borderRadius: '10px',
            padding: '4px',
            marginBottom: '20px',
            boxSizing: 'border-box'
          }}>
            <button
              type="button"
              onClick={() => {
                setSelectedRole('ADMIN');
                setErrorMessage(null);
              }}
              style={{
                flex: 1,
                padding: '10px 0',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                backgroundColor: selectedRole === 'ADMIN' ? '#2563EB' : 'transparent',
                color: selectedRole === 'ADMIN' ? '#FFFFFF' : 'var(--text-muted, #64748B)',
                transition: 'all 0.15s ease'
              }}
            >
              ADMIN LOGIN
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedRole('STAFF');
                setErrorMessage(null);
              }}
              style={{
                flex: 1,
                padding: '10px 0',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                backgroundColor: selectedRole === 'STAFF' ? '#2563EB' : 'transparent',
                color: selectedRole === 'STAFF' ? '#FFFFFF' : 'var(--text-muted, #64748B)',
                transition: 'all 0.15s ease'
              }}
            >
              STAFF LOGIN
            </button>
          </div>

          {errorMessage && (
            <div className="alert-banner error">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="alert-banner success">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>{successMessage}</span>
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="login-username">Username</label>
              <div className="input-container">
                <span className="input-icon">
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                <input
                  id="login-username"
                  type="text"
                  className="form-input"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setErrorMessage(null);
                  }}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Password</label>
              <div className="input-container">
                <span className="input-icon">
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMessage(null);
                  }}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a8.959 8.959 0 013.682-.793c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {selectedRole === 'ADMIN' && (
              <div className="form-row-space-between">
                <span></span>
                <button type="button" className="forgot-link" onClick={handleForgotPassword}>
                  Forgot Password?
                </button>
              </div>
            )}

            <button type="submit" className="submit-button" disabled={isLoading} style={{ marginTop: '16px' }}>
              {isLoading ? (
                <>
                  <span className="btn-spinner"></span>
                  <span>Signing in as {selectedRole}...</span>
                </>
              ) : (
                <span>Login as {selectedRole}</span>
              )}
            </button>
          </form>
        </div>
      </div>

      <footer className="auth-footer">
        © 2026 Dashboard System. All rights reserved.
      </footer>
    </div>
  );
};
