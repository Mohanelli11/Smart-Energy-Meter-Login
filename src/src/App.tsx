import React, { useEffect, useState } from 'react';
import { LoginPage } from './components/LoginPage';
import { Dashboard } from './components/Dashboard';
import { MeterLoginPage } from './components/MeterLoginPage';
import { IndividualMeterView } from './components/IndividualMeterView';
import { getAllMeters } from './utils/meterStorage';
export function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [viewMode, setViewMode] = useState<'admin' | 'meter-login' | 'meter-view'>('admin');
  const [currentMeter, setCurrentMeter] = useState(null);
  // User accounts database (in a real app, this would be in a backend)
  const [userAccounts, setUserAccounts] = useState([{
    email: 'mahmadstephen19@gmail.com',
    password: '@Testing',
    name: 'Mahmad Stephen',
    role: 'admin'
  }, {
    email: 'hydroboxkenya@gmail.com',
    password: '@Testing',
    name: 'Hydrobox Kenya',
    role: 'user'
  }]);
  // Load all meters from localStorage instead of generating
  const [allMeters, setAllMeters] = useState(() => getAllMeters());
  // Refresh meters from storage when returning to admin view
  useEffect(() => {
    if (viewMode === 'admin') {
      setAllMeters(getAllMeters());
    }
  }, [viewMode]);
  const handleLogin = userData => {
    // Find user in accounts
    const account = userAccounts.find(acc => acc.email.toLowerCase() === userData.email.toLowerCase() && acc.password === userData.password);
    if (account) {
      setUser({
        email: account.email,
        name: account.name,
        role: account.role,
        accountType: userData.accountType
      });
      setIsLoggedIn(true);
      setViewMode('admin');
    }
  };
  const handleLogout = () => {
    setUser(null);
    setIsLoggedIn(false);
    setViewMode('admin');
    setCurrentMeter(null);
  };
  const handleCreateAccount = newAccount => {
    // Check if email already exists
    const exists = userAccounts.find(acc => acc.email.toLowerCase() === newAccount.email.toLowerCase());
    if (exists) {
      alert('An account with this email already exists.');
      return false;
    }
    // Add new account
    setUserAccounts([...userAccounts, newAccount]);
    alert(`Account created successfully for ${newAccount.email}`);
    return true;
  };
  const handleMeterLogin = (accountNo: string, password: string) => {
    // Find meter by account number
    const meter = allMeters.find(m => m.accountNo === accountNo);
    if (!meter) {
      alert('Meter not found. Please check the account number.');
      return;
    }
    if (password !== '@Testing') {
      alert('Incorrect password.');
      return;
    }
    setCurrentMeter(meter);
    setViewMode('meter-view');
  };
  const handleMeterLogout = () => {
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
    return <MeterLoginPage onMeterLogin={handleMeterLogin} onBackToAdmin={handleBackToAdmin} />;
  }
  if (viewMode === 'meter-view' && currentMeter) {
    return <IndividualMeterView meter={currentMeter} onLogout={handleMeterLogout} />;
  }
  return <Dashboard user={user} onLogout={handleLogout} onCreateAccount={handleCreateAccount} onMeterLogin={handleGoToMeterLogin} />;
}