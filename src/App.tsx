import React, { useState } from 'react';
import { LoginPage } from './components/LoginPage';
import { Dashboard } from './components/Dashboard';
import { MeterLoginPage } from './components/MeterLoginPage';
import { IndividualMeterView } from './components/IndividualMeterView';
export function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [viewMode, setViewMode] = useState<
    'admin' | 'meter-login' | 'meter-view'>(
    'admin');
  const [currentMeter, setCurrentMeter] = useState(null);
  // User accounts database (in a real app, this would be in a backend)
  const [userAccounts, setUserAccounts] = useState([
  {
    email: 'mahmadstephen19@gmail.com',
    password: '@Testing',
    name: 'Mahmad Stephen',
    role: 'admin',
    phoneNumber: '+254700000000'
  },
  {
    email: 'motechkenya@gmail.com',
    password: '@Testing',
    name: 'MoTech Electrical and Electronics Engineering Solutions',
    role: 'user',
    phoneNumber: '+254711111111'
  }]
  );
  // Generate all meters (prepaid + postpaid) for meter login
  const [allMeters] = useState(() => {
    const meters = [];
    // Prepaid meters
    const prepaidNames = [
    'John Mwangi',
    'Sarah Wambui',
    'David Omondi',
    'Grace Njeri',
    'Peter Kamau',
    'Mary Auma',
    'James Otieno',
    'Jane Wanjiku',
    'Paul Kariuki',
    'Lucy Nyambura'];

    const locations = [
    'Nairobi West',
    'Kasarani',
    'Ruiru',
    'Thika',
    'Juja',
    'Kiambu',
    'Kikuyu',
    'Limuru'];

    for (let i = 0; i < 856; i++) {
      const accountNum = 1000 + i;
      const consumption = (Math.random() * 15 + 10).toFixed(2);
      const balance = Math.random() * 200;
      meters.push({
        accountNo: `MET-${accountNum}-2023`,
        customerName: prepaidNames[i % prepaidNames.length],
        meterNo: `ESP-${accountNum}-001`,
        location: locations[i % locations.length],
        consumption: consumption,
        balance: balance.toFixed(2),
        status:
        balance > 50 ?
        'Active' :
        balance > 0 ?
        'Low Balance' :
        'Disconnected',
        type: 'prepaid'
      });
    }
    // Postpaid meters
    const postpaidNames = [
    'James Kamau',
    'Grace Njeri',
    'Michael Otieno',
    'Nancy Wanjiru',
    'David Kipchoge'];

    for (let i = 0; i < 392; i++) {
      const accountNum = 5000 + i;
      const consumption = (Math.random() * 15 + 15).toFixed(2);
      const billAmount = (Math.random() * 1500 + 500).toFixed(2);
      meters.push({
        accountNo: `MET-${accountNum}-2023`,
        customerName: postpaidNames[i % postpaidNames.length],
        meterNo: `ESP-${accountNum}-001`,
        location: locations[i % locations.length],
        consumption: consumption,
        balance: billAmount,
        status: ['Active', 'Pending Bill', 'Overdue'][
        Math.floor(Math.random() * 3)],

        type: 'postpaid'
      });
    }
    return meters;
  });
  const handleLogin = (userData) => {
    // Find user in accounts
    const account = userAccounts.find(
      (acc) =>
      acc.email.toLowerCase() === userData.email.toLowerCase() &&
      acc.password === userData.password
    );
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
  const handlePasswordChange = (phone: string, newPassword: string) => {
    setUserAccounts((prevAccounts) =>
    prevAccounts.map((acc) =>
    acc.phoneNumber === phone ?
    {
      ...acc,
      password: newPassword
    } :
    acc
    )
    );
  };
  const handleCreateAccount = (newAccount) => {
    // Check if email already exists
    const exists = userAccounts.find(
      (acc) => acc.email.toLowerCase() === newAccount.email.toLowerCase()
    );
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
    const meter = allMeters.find((m) => m.accountNo === accountNo);
    if (!meter) {
      alert('Mete r not found. Please check the account number.');
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
    return (
      <LoginPage
        onLogin={handleLogin}
        onPasswordChange={handlePasswordChange}
        userAccounts={userAccounts} />);


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