import React, { useEffect, useState } from 'react';
import { LoginPage } from './components/LoginPage';
import { Dashboard } from './components/Dashboard';
import { MeterLoginPage } from './components/MeterLoginPage';
import { IndividualMeterView } from './components/IndividualMeterView';
import { getAllMeters } from './utils/meterStorage';
import {
  initializeSecurity,
  getSession,
  clearSession,
  createSession } from
'./utils/security';
import { logSecurityEvent } from './utils/security';
export function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [viewMode, setViewMode] = useState<
    'admin' | 'meter-login' | 'meter-view'>(
    'admin');
  const [currentMeter, setCurrentMeter] = useState(null);
  // User accounts database (in a real app, this would be in a backend)
  // SECURITY NOTE: These hardcoded credentials are for demo purposes only
  // In production, implement proper backend authentication
  const [userAccounts, setUserAccounts] = useState([
  {
    email: 'mahmadstephen19@gmail.com',
    password: '@Testing',
    name: 'Mahmad Stephen',
    role: 'admin'
  },
  {
    email: 'hydroboxkenya@gmail.com',
    password: '@Testing',
    name: 'Hydrobox Kenya',
    role: 'user'
  }]
  );
  // Load all meters from localStorage instead of generating
  const [allMeters, setAllMeters] = useState(() => getAllMeters());
  // Initialize security measures on app load
  useEffect(() => {
    initializeSecurity();
    // Check for existing valid session
    const session = getSession();
    if (session) {
      const account = userAccounts.find((acc) => acc.email === session.email);
      if (account) {
        setUser({
          email: account.email,
          name: account.name,
          role: account.role,
          accountType: 'prepaid' // Default
        });
        setIsLoggedIn(true);
        logSecurityEvent('SESSION_RESTORED', {
          email: session.email
        });
      } else {
        // Invalid session, clear it
        clearSession();
      }
    }
  }, []);
  // Refresh meters from storage when returning to admin view
  useEffect(() => {
    if (viewMode === 'admin') {
      setAllMeters(getAllMeters());
    }
  }, [viewMode]);
  const handleLogin = (userData) => {
    // Find user in accounts
    const account = userAccounts.find(
      (acc) =>
      acc.email.toLowerCase() === userData.email.toLowerCase() &&
      acc.password === userData.password
    );
    if (account) {
      // Create secure session
      createSession(account.email, account.email, account.role);
      setUser({
        email: account.email,
        name: account.name,
        role: account.role,
        accountType: userData.accountType
      });
      setIsLoggedIn(true);
      setViewMode('admin');
      logSecurityEvent('LOGIN_SUCCESS', {
        email: account.email,
        role: account.role
      });
    }
  };
  const handleLogout = () => {
    // Clear session
    clearSession();
    logSecurityEvent('LOGOUT', {
      email: user?.email
    });
    setUser(null);
    setIsLoggedIn(false);
    setViewMode('admin');
    setCurrentMeter(null);
  };
  const handleCreateAccount = (newAccount) => {
    // SECURITY: Validate new account data
    if (!newAccount.email || !newAccount.password || !newAccount.name) {
      alert('All fields are required.');
      logSecurityEvent('ACCOUNT_CREATE_FAILED', {
        reason: 'missing_fields'
      });
      return false;
    }
    // Check if email already exists
    const exists = userAccounts.find(
      (acc) => acc.email.toLowerCase() === newAccount.email.toLowerCase()
    );
    if (exists) {
      alert('An account with this email already exists.');
      logSecurityEvent('ACCOUNT_CREATE_FAILED', {
        email: newAccount.email,
        reason: 'duplicate_email'
      });
      return false;
    }
    // Add new account
    setUserAccounts([...userAccounts, newAccount]);
    logSecurityEvent('ACCOUNT_CREATED', {
      email: newAccount.email,
      role: newAccount.role
    });
    alert(`Account created successfully for ${newAccount.email}`);
    return true;
  };
  const handleMeterLogin = (accountNo: string, password: string) => {
    // SECURITY: Validate inputs
    if (!accountNo || !password) {
      alert('Account number and password are required.');
      return;
    }
    // Find meter by account number
    const meter = allMeters.find((m) => m.accountNo === accountNo);
    if (!meter) {
      alert('Meter not found. Please check the account number.');
      logSecurityEvent('METER_LOGIN_FAILED', {
        accountNo,
        reason: 'meter_not_found'
      });
      return;
    }
    // SECURITY NOTE: In production, implement proper meter authentication
    if (password !== '@Testing') {
      alert('Incorrect password.');
      logSecurityEvent('METER_LOGIN_FAILED', {
        accountNo,
        reason: 'incorrect_password'
      });
      return;
    }
    setCurrentMeter(meter);
    setViewMode('meter-view');
    logSecurityEvent('METER_LOGIN_SUCCESS', {
      accountNo
    });
  };
  const handleMeterLogout = () => {
    logSecurityEvent('METER_LOGOUT', {
      accountNo: currentMeter?.accountNo
    });
    setCurrentMeter(null);
    setViewMode('admin');
  };
  const handleGoToMeterLogin = () => {
    setViewMode('meter-login');
  };
  const handleBackToAdmin = () => {
    setViewMode('admin');
  };
  // Render based on view mode
  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} userAccounts={userAccounts} />;
  }
  if (viewMode === 'meter-login') {
    return (
      <MeterLoginPage
        onMeterLogin={handleMeterLogin}
        onBackToAdmin={handleBackToAdmin} />);


  }
  if (viewMode === 'meter-view' && currentMeter) {
    return (
      <IndividualMeterView meter={currentMeter} onLogout={handleMeterLogout} />);

  }
  return (
    <Dashboard
      user={user}
      onLogout={handleLogout}
      onCreateAccount={handleCreateAccount}
      onMeterLogin={handleGoToMeterLogin} />);


}