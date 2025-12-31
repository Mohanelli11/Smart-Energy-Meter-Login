import React, { useEffect, useMemo, useState, createElement } from 'react';
import { MenuIcon, ZapIcon, LayoutDashboardIcon, CoinsIcon, FileTextIcon, CreditCardIcon, PlusCircleIcon, BoltIcon, BarChart3Icon, SettingsIcon, SearchIcon, BellIcon, HelpCircleIcon, LogOutIcon, FilterIcon, DownloadIcon, UserPlusIcon, KeyIcon, BrainCircuitIcon } from 'lucide-react';
import { StatsCard } from './StatsCard';
import { MeterTable } from './MeterTable';
import { AddMeterForm } from './AddMeterForm';
import { LivePayments } from './LivePayments';
import { TokenModal } from './TokenModal';
import { FilterModal } from './FilterModal';
import { ViewMeterModal } from './ViewMeterModal';
import { EditMeterModal } from './EditMeterModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { CreateAccountModal } from './CreateAccountModal';
import { ConsumptionGraph } from './ConsumptionGraph';
import { AIInsights } from './AIInsights'; // Added import
import { savePrepaidMeters, loadPrepaidMeters, savePostpaidMeters, loadPostpaidMeters, generateMeterReport, Meter } from '../utils/meterStorage';
// Generate realistic data
const generatePrepaidMeters = () => {
  const names = ['John Mwangi', 'Sarah Wambui', 'David Omondi', 'Grace Njeri', 'Peter Kamau', 'Mary Auma', 'James Otieno', 'Jane Wanjiku', 'Paul Kariuki', 'Lucy Nyambura', 'Michael Kipchoge', 'Anne Chebet', 'Daniel Mutua', 'Faith Wanjiru', 'Samuel Ochieng', 'Rose Akinyi', 'Joseph Maina', 'Catherine Wairimu', 'Patrick Kimani', 'Elizabeth Moraa', 'Francis Kibet', 'Margaret Njoki', 'Stephen Owino', 'Joyce Wangari', 'Anthony Mwenda', 'Esther Chepkoech', 'Robert Karanja', 'Alice Adhiambo', 'George Njenga', 'Susan Jepkorir', 'Charles Wafula', 'Hannah Mumbi', 'Benjamin Koech', 'Mercy Achieng', 'Isaac Gitau', 'Beatrice Cheptoo', 'Dennis Macharia', 'Lydia Kerubo', 'Victor Onyango', 'Priscilla Wambui', 'Edwin Kiplagat', 'Agnes Wanjiru', 'Kevin Ouma', 'Eunice Chepkemoi', 'Martin Njoroge', 'Christine Nyokabi', 'Simon Tanui', 'Purity Wangui', 'Andrew Kiprono', 'Josephine Muthoni'];
  const locations = ['Nairobi West', 'Kasarani', 'Ruiru', 'Thika', 'Juja', 'Kiambu', 'Kikuyu', 'Limuru', 'Kahawa West', 'Zimmerman', 'Roysambu', 'Embakasi', 'Donholm', 'Umoja', 'Kayole', 'Githurai', 'Kahawa Sukari', 'Mwiki', 'Kasarani', 'Njiru', 'Utawala', 'Mihango', 'Komarock', 'Buruburu', 'Makadara', 'Eastleigh', 'Pangani', 'Parklands', 'Westlands', 'Kilimani', 'Lavington', 'Kileleshwa', 'Hurlingham', 'Ngong', 'Rongai', 'Kitengela'];
  const statuses: Array<'Active' | 'Low Balance' | 'Disconnected'> = ['Active', 'Low Balance', 'Disconnected'];
  const meters = [];
  for (let i = 0; i < 856; i++) {
    const accountNum = 1000 + i;
    const consumption = (Math.random() * 15 + 10).toFixed(2);
    const balance = Math.random() * 200;
    let status: 'Active' | 'Low Balance' | 'Disconnected';
    if (balance > 50) status = 'Active';else if (balance > 0) status = 'Low Balance';else status = 'Disconnected';
    // Generate last report for 80% of meters (simulating GSM connectivity)
    const hasReport = Math.random() > 0.2;
    meters.push({
      accountNo: `MET-${accountNum}-2023`,
      customerName: names[i % names.length],
      meterNo: `ESP-${accountNum}-001`,
      location: locations[i % locations.length],
      consumption: consumption,
      balance: balance.toFixed(2),
      status: status,
      lastReport: hasReport ? generateMeterReport() : undefined
    });
  }
  return meters;
};
const generatePostpaidMeters = () => {
  const names = ['James Kamau', 'Grace Njeri', 'Michael Otieno', 'Nancy Wanjiru', 'David Kipchoge', 'Ruth Akinyi', 'Peter Maina', 'Caroline Chebet', 'John Mutua', 'Esther Wangari', 'Samuel Koech', 'Mary Njoki', 'Patrick Owino', 'Jane Moraa', 'Francis Karanja', 'Lucy Chepkoech', 'Robert Ochieng', 'Anne Wairimu', 'George Kibet', 'Susan Adhiambo', 'Charles Njenga', 'Margaret Jepkorir', 'Stephen Wafula', 'Joyce Mumbi', 'Anthony Kiplagat', 'Alice Achieng', 'Dennis Gitau', 'Lydia Cheptoo', 'Victor Macharia', 'Priscilla Kerubo', 'Edwin Onyango', 'Agnes Nyambura', 'Kevin Tanui', 'Eunice Njoroge', 'Martin Kiprono', 'Christine Nyokabi', 'Simon Ouma', 'Purity Chepkemoi', 'Andrew Mwenda', 'Josephine Wambui'];
  const locations = ['Thika', 'Juja', 'Kiambu', 'Ruiru', 'Kikuyu', 'Limuru', 'Nairobi CBD', 'Industrial Area', 'South B', 'South C', 'Langata', 'Karen', 'Runda', 'Muthaiga', 'Gigiri', 'Ridgeways', 'Spring Valley', 'Loresho', 'Kitisuru', 'Nyari', 'Rosslyn', 'Runda Estate', 'Two Rivers'];
  const statuses: Array<'Active' | 'Pending Bill' | 'Overdue'> = ['Active', 'Pending Bill', 'Overdue'];
  const meters = [];
  for (let i = 0; i < 392; i++) {
    const accountNum = 5000 + i;
    const consumption = (Math.random() * 15 + 15).toFixed(2);
    const billAmount = (Math.random() * 1500 + 500).toFixed(2);
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    // Generate last report for 80% of meters
    const hasReport = Math.random() > 0.2;
    meters.push({
      accountNo: `MET-${accountNum}-2023`,
      customerName: names[i % names.length],
      meterNo: `ESP-${accountNum}-001`,
      location: locations[i % locations.length],
      consumption: consumption,
      balance: billAmount,
      status: status,
      lastReport: hasReport ? generateMeterReport() : undefined
    });
  }
  return meters;
};
const generatePaymentTransactions = () => {
  const names = ['John Mwangi', 'Sarah Wambui', 'David Omondi', 'Grace Njeri', 'James Kamau', 'Mary Auma', 'Peter Kariuki', 'Jane Wanjiku', 'Paul Otieno', 'Lucy Nyambura', 'Michael Kipchoge', 'Anne Chebet', 'Daniel Mutua', 'Faith Wanjiru', 'Samuel Ochieng', 'Rose Akinyi', 'Joseph Maina', 'Catherine Wairimu', 'Patrick Kimani', 'Elizabeth Moraa'];
  const transactions = [];
  const today = new Date();
  for (let i = 0; i < 124; i++) {
    const accountNum = 1000 + Math.floor(Math.random() * 5000);
    const amount = Math.floor(Math.random() * 4000) + 500;
    const units = (amount / 15.5).toFixed(2);
    const isPrepaid = Math.random() > 0.3;
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    const dateStr = date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    transactions.push({
      transactionId: `TXN-${accountNum}-${String(i + 1).padStart(3, '0')}`,
      accountNo: `MET-${accountNum}-2023`,
      customerName: names[i % names.length],
      amount: amount.toLocaleString() + '.00',
      units: isPrepaid ? units : 'N/A',
      tokenCode: isPrepaid ? `${accountNum}-2023-${accountNum}-${String(i + 1).padStart(3, '0')}-${amount}` : 'N/A',
      date: dateStr,
      status: 'Completed'
    });
  }
  return transactions.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateB.getTime() - dateA.getTime();
  });
};
interface DashboardProps {
  user: any;
  onLogout: () => void;
  onCreateAccount: (account: any) => boolean;
  onMeterLogin: () => void;
}
export function Dashboard({
  user,
  onLogout,
  onCreateAccount,
  onMeterLogin
}: DashboardProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [tokenModal, setTokenModal] = useState({
    isOpen: false,
    token: '',
    amount: ''
  });
  // Meter state with localStorage persistence
  const [prepaidMetersState, setPrepaidMetersState] = useState<Meter[]>(() => {
    const stored = loadPrepaidMeters();
    return stored || generatePrepaidMeters();
  });
  const [postpaidMetersState, setPostpaidMetersState] = useState<Meter[]>(() => {
    const stored = loadPostpaidMeters();
    return stored || generatePostpaidMeters();
  });
  // Save to localStorage whenever meters change
  useEffect(() => {
    savePrepaidMeters(prepaidMetersState);
  }, [prepaidMetersState]);
  useEffect(() => {
    savePostpaidMeters(postpaidMetersState);
  }, [postpaidMetersState]);
  const [paymentTransactionsState] = useState(generatePaymentTransactions());
  // Consumption graph data
  const [consumptionGraphData, setConsumptionGraphData] = useState<any[]>([]);
  // Generate consumption graph data from all meters
  useEffect(() => {
    const data = [];
    const allMeters = [...prepaidMetersState, ...postpaidMetersState];
    // Generate last 7 days of data
    for (let day = 6; day >= 0; day--) {
      const date = new Date();
      date.setDate(date.getDate() - day);
      const dateStr = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      // Sum consumption from all meters for this day
      const totalConsumption = allMeters.reduce((sum, meter) => {
        return sum + parseFloat(meter.consumption) * (0.8 + Math.random() * 0.4);
      }, 0);
      data.push({
        time: dateStr,
        consumption: totalConsumption.toFixed(2)
      });
    }
    setConsumptionGraphData(data);
  }, [prepaidMetersState, postpaidMetersState]);
  // Pagination states
  const [prepaidPage, setPrepaidPage] = useState(1);
  const [postpaidPage, setPostpaidPage] = useState(1);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const itemsPerPage = 10;
  // Filter states
  const [filterModal, setFilterModal] = useState({
    isOpen: false,
    type: 'prepaid' as 'prepaid' | 'postpaid' | 'payments'
  });
  const [prepaidFilters, setPrepaidFilters] = useState<any>({});
  const [postpaidFilters, setPostpaidFilters] = useState<any>({});
  const [paymentsFilters, setPaymentsFilters] = useState<any>({});
  // Action modals
  const [viewModal, setViewModal] = useState({
    isOpen: false,
    meter: null,
    type: 'prepaid' as 'prepaid' | 'postpaid'
  });
  const [editModal, setEditModal] = useState({
    isOpen: false,
    meter: null,
    type: 'prepaid' as 'prepaid' | 'postpaid'
  });
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    meter: null,
    type: 'prepaid' as 'prepaid' | 'postpaid'
  });
  const [createAccountModal, setCreateAccountModal] = useState(false);
  // Check if user is admin
  const isAdmin = user?.email === 'mahmadstephen19@gmail.com';
  // Add meter handler
  const handleMeterAdded = (meter: any) => {
    if (meter.type === 'prepaid') {
      setPrepaidMetersState([meter, ...prepaidMetersState]);
    } else {
      setPostpaidMetersState([meter, ...postpaidMetersState]);
    }
  };
  // View meter handler
  const handleViewMeter = (meter: any, type: 'prepaid' | 'postpaid') => {
    setViewModal({
      isOpen: true,
      meter,
      type
    });
  };
  // Edit meter handler
  const handleEditMeter = (meter: any, type: 'prepaid' | 'postpaid') => {
    setEditModal({
      isOpen: true,
      meter,
      type
    });
  };
  // Save edited meter
  const handleSaveEdit = (updatedMeter: any) => {
    if (editModal.type === 'prepaid') {
      setPrepaidMetersState(prepaidMetersState.map(m => m.accountNo === updatedMeter.accountNo ? updatedMeter : m));
    } else {
      setPostpaidMetersState(postpaidMetersState.map(m => m.accountNo === updatedMeter.accountNo ? updatedMeter : m));
    }
  };
  // Delete meter handler
  const handleDeleteMeter = (meter: any, type: 'prepaid' | 'postpaid') => {
    setDeleteModal({
      isOpen: true,
      meter,
      type
    });
  };
  // Confirm delete
  const handleConfirmDelete = () => {
    if (deleteModal.meter) {
      if (deleteModal.type === 'prepaid') {
        setPrepaidMetersState(prepaidMetersState.filter(m => m.accountNo !== deleteModal.meter.accountNo));
      } else {
        setPostpaidMetersState(postpaidMetersState.filter(m => m.accountNo !== deleteModal.meter.accountNo));
      }
    }
  };
  // Apply filters
  const applyFilters = (data: any[], filters: any, type: 'prepaid' | 'postpaid' | 'payments') => {
    let filtered = [...data];
    if (filters.status) {
      filtered = filtered.filter(item => item.status === filters.status);
    }
    if (filters.location) {
      filtered = filtered.filter(item => item.location === filters.location);
    }
    if (filters.consumptionMin) {
      filtered = filtered.filter(item => parseFloat(item.consumption) >= parseFloat(filters.consumptionMin));
    }
    if (filters.consumptionMax) {
      filtered = filtered.filter(item => parseFloat(item.consumption) <= parseFloat(filters.consumptionMax));
    }
    if (filters.balanceMin) {
      filtered = filtered.filter(item => parseFloat(item.balance) >= parseFloat(filters.balanceMin));
    }
    if (filters.balanceMax) {
      filtered = filtered.filter(item => parseFloat(item.balance) <= parseFloat(filters.balanceMax));
    }
    if (filters.dateFrom && type === 'payments') {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= fromDate;
      });
    }
    if (filters.dateTo && type === 'payments') {
      const toDate = new Date(filters.dateTo);
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate <= toDate;
      });
    }
    return filtered;
  };
  const filteredPrepaidMeters = useMemo(() => applyFilters(prepaidMetersState, prepaidFilters, 'prepaid'), [prepaidMetersState, prepaidFilters]);
  const filteredPostpaidMeters = useMemo(() => applyFilters(postpaidMetersState, postpaidFilters, 'postpaid'), [postpaidMetersState, postpaidFilters]);
  const filteredPaymentTransactions = useMemo(() => applyFilters(paymentTransactionsState, paymentsFilters, 'payments'), [paymentTransactionsState, paymentsFilters]);
  // Export to Excel (CSV format)
  const exportToExcel = (data: any[], filename: string, type: 'prepaid' | 'postpaid' | 'payments') => {
    let csv = '';
    if (type === 'prepaid' || type === 'postpaid') {
      csv = 'Account No.,Customer Name,Meter No.,Location,Consumption (kWh),';
      csv += type === 'prepaid' ? 'Balance (Ksh),Status\n' : 'Bill Amount (Ksh),Status\n';
      data.forEach(item => {
        csv += `${item.accountNo},${item.customerName},${item.meterNo},${item.location},${item.consumption},${item.balance},${item.status}\n`;
      });
    } else {
      csv = 'Transaction ID,Account No.,Customer,Amount (Ksh),Units (kWh),Token Code,Date,Status\n';
      data.forEach(item => {
        csv += `${item.transactionId},${item.accountNo},${item.customerName},${item.amount},${item.units},${item.tokenCode},${item.date},${item.status}\n`;
      });
    }
    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;'
    });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  // Paginated data
  const getPaginatedData = (data: any[], currentPage: number) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };
  const prepaidMeters = getPaginatedData(filteredPrepaidMeters, prepaidPage);
  const postpaidMeters = getPaginatedData(filteredPostpaidMeters, postpaidPage);
  const paymentTransactions = getPaginatedData(filteredPaymentTransactions, paymentsPage);
  // Pagination helpers
  const getTotalPages = (totalItems: number) => Math.ceil(totalItems / itemsPerPage);
  const renderPagination = (currentPage: number, totalItems: number, setPage: (page: number) => void) => {
    const totalPages = getTotalPages(totalItems);
    const pages = [];
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push('...');
    if (totalPages > 1) pages.push(totalPages);
    return <div className="mt-4 flex justify-between items-center">
        <div className="text-sm text-gray-500">
          Showing{' '}
          <span className="font-medium">
            {(currentPage - 1) * itemsPerPage + 1}
          </span>{' '}
          to{' '}
          <span className="font-medium">
            {Math.min(currentPage * itemsPerPage, totalItems)}
          </span>{' '}
          of <span className="font-medium">{totalItems}</span> results
        </div>
        <div className="flex space-x-2">
          <button onClick={() => setPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className={`px-3 py-1 border rounded-md ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            «
          </button>
          {pages.map((page, index) => <button key={index} onClick={() => typeof page === 'number' && setPage(page)} disabled={page === '...'} className={`px-3 py-1 border rounded-md ${page === currentPage ? 'bg-blue-600 text-white' : page === '...' ? 'cursor-default' : 'hover:bg-gray-100'}`}>
              {page}
            </button>)}
          <button onClick={() => setPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className={`px-3 py-1 border rounded-md ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            »
          </button>
        </div>
      </div>;
  };
  const showToken = (token: string, amount: string) => {
    setTokenModal({
      isOpen: true,
      token,
      amount
    });
  };
  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <StatsCard title="Total Meters" value={(prepaidMetersState.length + postpaidMetersState.length).toLocaleString()} icon={<ZapIcon className="h-6 w-6" />} iconBgColor="bg-blue-100" iconColor="text-blue-600" trend={{
              value: '12%',
              isPositive: true,
              label: 'from last month'
            }} />
              <StatsCard title="Prepaid Meters" value={prepaidMetersState.length.toLocaleString()} icon={<CoinsIcon className="h-6 w-6" />} iconBgColor="bg-green-100" iconColor="text-green-600" trend={{
              value: '8%',
              isPositive: true,
              label: 'from last month'
            }} />
              <StatsCard title="Postpaid Meters" value={postpaidMetersState.length.toLocaleString()} icon={<FileTextIcon className="h-6 w-6" />} iconBgColor="bg-purple-100" iconColor="text-purple-600" trend={{
              value: '3%',
              isPositive: false,
              label: 'from last month'
            }} />
              <StatsCard title="Today's Revenue" value="Ksh 248,750" icon={<CreditCardIcon className="h-6 w-6" />} iconBgColor="bg-yellow-100" iconColor="text-yellow-600" trend={{
              value: '15%',
              isPositive: true,
              label: 'from yesterday'
            }} />
            </div>

            {/* Consumption Graph Overview */}
            <div className="mb-6">
              <ConsumptionGraph data={consumptionGraphData} title="Total Network Consumption (Last 7 Days)" height={350} />
              <div className="mt-2 text-sm text-gray-600 text-center">
                Data collected from{' '}
                {prepaidMetersState.length + postpaidMetersState.length} meters
                via NB-IoT system
              </div>
            </div>

            {/* Meter Login Card */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="text-white">
                  <h3 className="text-xl font-bold mb-2">
                    Access Individual Meter
                  </h3>
                  <p className="text-blue-100">
                    Login to view detailed meter readings and consumption data
                  </p>
                </div>
                <button onClick={onMeterLogin} className="px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 font-semibold flex items-center">
                  <KeyIcon className="h-5 w-5 mr-2" />
                  Meter Login
                </button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <h3 className="text-lg font-semibold mb-4">
                Recent Transactions
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center">
                    <div className="p-2 rounded-full bg-green-100 text-green-600 mr-3">
                      <CoinsIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">Prepaid Top-up</p>
                      <p className="text-sm text-gray-500">
                        A/C: MET-7845-2023
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">Ksh 1,500</p>
                    <p className="text-sm text-gray-500">11 Jul 2025</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center">
                    <div className="p-2 rounded-full bg-blue-100 text-blue-600 mr-3">
                      <FileTextIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">Postpaid Bill Payment</p>
                      <p className="text-sm text-gray-500">
                        A/C: MET-9213-2023
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-blue-600">Ksh 3,200</p>
                    <p className="text-sm text-gray-500">11 Jul 2025</p>
                  </div>
                </div>
              </div>
            </div>
          </div>;
      case 'ai-insights':
        // New Case
        return <AIInsights meters={[...prepaidMetersState, ...postpaidMetersState]} transactions={paymentTransactionsState} />;
      case 'prepaid':
        return <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Prepaid Meters</h2>
              <div className="flex space-x-3">
                <button onClick={() => setActiveSection('add-meter')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
                  <PlusCircleIcon className="h-4 w-4 mr-2" />
                  Add Meter
                </button>
                <button onClick={() => setFilterModal({
                isOpen: true,
                type: 'prepaid'
              })} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center">
                  <FilterIcon className="h-4 w-4 mr-2" />
                  Filter
                </button>
                <button onClick={() => exportToExcel(filteredPrepaidMeters, 'prepaid_meters', 'prepaid')} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center">
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  Export
                </button>
              </div>
            </div>
            <MeterTable meters={prepaidMeters} type="prepaid" onView={meter => handleViewMeter(meter, 'prepaid')} onEdit={meter => handleEditMeter(meter, 'prepaid')} onDelete={meter => handleDeleteMeter(meter, 'prepaid')} />
            {renderPagination(prepaidPage, filteredPrepaidMeters.length, setPrepaidPage)}
          </div>;
      case 'postpaid':
        return <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Postpaid Meters</h2>
              <div className="flex space-x-3">
                <button onClick={() => setActiveSection('add-meter')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
                  <PlusCircleIcon className="h-4 w-4 mr-2" />
                  Add Meter
                </button>
                <button onClick={() => setFilterModal({
                isOpen: true,
                type: 'postpaid'
              })} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center">
                  <FilterIcon className="h-4 w-4 mr-2" />
                  Filter
                </button>
                <button onClick={() => exportToExcel(filteredPostpaidMeters, 'postpaid_meters', 'postpaid')} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center">
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  Export
                </button>
              </div>
            </div>
            <MeterTable meters={postpaidMeters} type="postpaid" onView={meter => handleViewMeter(meter, 'postpaid')} onEdit={meter => handleEditMeter(meter, 'postpaid')} onDelete={meter => handleDeleteMeter(meter, 'postpaid')} />
            {renderPagination(postpaidPage, filteredPostpaidMeters.length, setPostpaidPage)}
          </div>;
      case 'payments':
        return <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Payment Transactions</h2>
              <div className="flex space-x-3">
                <button onClick={() => setFilterModal({
                isOpen: true,
                type: 'payments'
              })} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center">
                  <FilterIcon className="h-4 w-4 mr-2" />
                  Filter
                </button>
                <button onClick={() => exportToExcel(filteredPaymentTransactions, 'payment_transactions', 'payments')} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center">
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  Export
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Transaction ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Account No.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Amount (Ksh)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Units (kWh)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Token Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paymentTransactions.map((transaction, index) => <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {transaction.transactionId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {transaction.accountNo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {transaction.customerName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {transaction.amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {transaction.units}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {transaction.tokenCode !== 'N/A' ? <button onClick={() => showToken(transaction.tokenCode, `Ksh ${transaction.amount}`)} className="text-blue-600 hover:text-blue-900">
                            Show Token
                          </button> : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {transaction.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                          {transaction.status}
                        </span>
                      </td>
                    </tr>)}
                </tbody>
              </table>
            </div>
            {renderPagination(paymentsPage, filteredPaymentTransactions.length, setPaymentsPage)}
          </div>;
      case 'add-meter':
        return <AddMeterForm onMeterAdded={handleMeterAdded} />;
      case 'live-payments':
        return <LivePayments />;
      case 'reports':
        return <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Reports</h2>
            <p className="text-gray-600">
              Reports and analytics will appear here.
            </p>
          </div>;
      case 'settings':
        return <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-6">Settings</h2>

            {/* User Management Section - Only for Admin */}
            {isAdmin && <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">User Management</h3>
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
                  <p className="text-sm text-blue-800 mb-3">
                    As an administrator, you can create new user accounts for
                    the system.
                  </p>
                  <button onClick={() => setCreateAccountModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
                    <UserPlusIcon className="h-4 w-4 mr-2" />
                    Create New Account
                  </button>
                </div>
              </div>}

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">
                Account Information
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium text-gray-900">{user?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{user?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Role</p>
                    <p className="font-medium text-gray-900">
                      {isAdmin ? 'Administrator' : 'User'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">System Preferences</h3>
              <p className="text-gray-600">
                System preferences and configurations will appear here.
              </p>
            </div>
          </div>;
      default:
        return null;
    }
  };
  return <div className="flex h-screen overflow-hidden bg-gray-100">
      <div className={`bg-blue-800 text-white flex-shrink-0 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <div className="p-4 flex items-center justify-between border-b border-blue-700">
          <div className="flex items-center">
            <ZapIcon className="text-yellow-400 h-6 w-6" />
            {!sidebarCollapsed && <span className="ml-3 text-xl font-bold">
                Hydrobox SmartMeter
              </span>}
          </div>
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="text-white focus:outline-none">
            <MenuIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto">
          <nav className="p-2">
            <button onClick={() => setActiveSection('dashboard')} className={`w-full flex items-center p-3 rounded mb-2 hover:bg-blue-700 ${activeSection === 'dashboard' ? 'bg-blue-700' : ''} ${sidebarCollapsed ? 'justify-center' : ''}`}>
              <LayoutDashboardIcon className="h-5 w-5" />
              {!sidebarCollapsed && <span className="ml-3">Dashboard</span>}
            </button>
            <button onClick={() => setActiveSection('ai-insights')} className={`w-full flex items-center p-3 rounded mb-2 hover:bg-blue-700 ${activeSection === 'ai-insights' ? 'bg-blue-700' : ''} ${sidebarCollapsed ? 'justify-center' : ''}`}>
              <BrainCircuitIcon className="h-5 w-5" />
              {!sidebarCollapsed && <span className="ml-3">AI Insights</span>}
            </button>
            <button onClick={() => setActiveSection('prepaid')} className={`w-full flex items-center p-3 rounded mb-2 hover:bg-blue-700 ${activeSection === 'prepaid' ? 'bg-blue-700' : ''} ${sidebarCollapsed ? 'justify-center' : ''}`}>
              <CoinsIcon className="h-5 w-5" />
              {!sidebarCollapsed && <span className="ml-3">Prepaid Meters</span>}
            </button>
            <button onClick={() => setActiveSection('postpaid')} className={`w-full flex items-center p-3 rounded mb-2 hover:bg-blue-700 ${activeSection === 'postpaid' ? 'bg-blue-700' : ''} ${sidebarCollapsed ? 'justify-center' : ''}`}>
              <FileTextIcon className="h-5 w-5" />
              {!sidebarCollapsed && <span className="ml-3">Postpaid Meters</span>}
            </button>
            <button onClick={() => setActiveSection('payments')} className={`w-full flex items-center p-3 rounded mb-2 hover:bg-blue-700 ${activeSection === 'payments' ? 'bg-blue-700' : ''} ${sidebarCollapsed ? 'justify-center' : ''}`}>
              <CreditCardIcon className="h-5 w-5" />
              {!sidebarCollapsed && <span className="ml-3">Payments</span>}
            </button>
            <button onClick={() => setActiveSection('add-meter')} className={`w-full flex items-center p-3 rounded mb-2 hover:bg-blue-700 ${activeSection === 'add-meter' ? 'bg-blue-700' : ''} ${sidebarCollapsed ? 'justify-center' : ''}`}>
              <PlusCircleIcon className="h-5 w-5" />
              {!sidebarCollapsed && <span className="ml-3">Add Meter</span>}
            </button>
            <button onClick={() => setActiveSection('live-payments')} className={`w-full flex items-center p-3 rounded mb-2 hover:bg-blue-700 ${activeSection === 'live-payments' ? 'bg-blue-700' : ''} ${sidebarCollapsed ? 'justify-center' : ''}`}>
              <BoltIcon className="h-5 w-5 animate-pulse" />
              {!sidebarCollapsed && <span className="ml-3">Live Payments</span>}
            </button>
            <button onClick={() => setActiveSection('reports')} className={`w-full flex items-center p-3 rounded mb-2 hover:bg-blue-700 ${activeSection === 'reports' ? 'bg-blue-700' : ''} ${sidebarCollapsed ? 'justify-center' : ''}`}>
              <BarChart3Icon className="h-5 w-5" />
              {!sidebarCollapsed && <span className="ml-3">Reports</span>}
            </button>
            <button onClick={() => setActiveSection('settings')} className={`w-full flex items-center p-3 rounded mb-2 hover:bg-blue-700 ${activeSection === 'settings' ? 'bg-blue-700' : ''} ${sidebarCollapsed ? 'justify-center' : ''}`}>
              <SettingsIcon className="h-5 w-5" />
              {!sidebarCollapsed && <span className="ml-3">Settings</span>}
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-blue-700">
          {!sidebarCollapsed && <div className="flex items-center">
              <img src="https://via.placeholder.com/40" alt="User" className="rounded-full w-10 h-10" />
              <div className="ml-3">
                <div className="font-medium">{user?.name || 'Admin User'}</div>
                <div className="text-xs text-blue-200">{user?.email}</div>
              </div>
            </div>}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            {activeSection === 'ai-insights' ? 'AI Insights' : activeSection.charAt(0).toUpperCase() + activeSection.slice(1).replace('-', ' ')}
          </h1>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input type="text" placeholder="Search..." className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            </div>
            <button className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200">
              <BellIcon className="h-5 w-5" />
            </button>
            <button className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200">
              <HelpCircleIcon className="h-5 w-5" />
            </button>
            <button onClick={onLogout} className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <LogOutIcon className="h-4 w-4 mr-1" />
              Logout
            </button>
          </div>
        </header>

        <main className="p-6">{renderSection()}</main>
      </div>

      <TokenModal isOpen={tokenModal.isOpen} onClose={() => setTokenModal({
      isOpen: false,
      token: '',
      amount: ''
    })} token={tokenModal.token} amount={tokenModal.amount} />

      <FilterModal isOpen={filterModal.isOpen} onClose={() => setFilterModal({
      ...filterModal,
      isOpen: false
    })} onApply={filters => {
      if (filterModal.type === 'prepaid') {
        setPrepaidFilters(filters);
        setPrepaidPage(1);
      } else if (filterModal.type === 'postpaid') {
        setPostpaidFilters(filters);
        setPostpaidPage(1);
      } else {
        setPaymentsFilters(filters);
        setPaymentsPage(1);
      }
    }} type={filterModal.type} />

      <ViewMeterModal isOpen={viewModal.isOpen} onClose={() => setViewModal({
      isOpen: false,
      meter: null,
      type: 'prepaid'
    })} meter={viewModal.meter} type={viewModal.type} />

      <EditMeterModal isOpen={editModal.isOpen} onClose={() => setEditModal({
      isOpen: false,
      meter: null,
      type: 'prepaid'
    })} onSave={handleSaveEdit} meter={editModal.meter} type={editModal.type} />

      <DeleteConfirmModal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({
      isOpen: false,
      meter: null,
      type: 'prepaid'
    })} onConfirm={handleConfirmDelete} meterName={deleteModal.meter?.customerName || ''} accountNo={deleteModal.meter?.accountNo || ''} />

      <CreateAccountModal isOpen={createAccountModal} onClose={() => setCreateAccountModal(false)} onCreateAccount={onCreateAccount} isAdmin={isAdmin} />
    </div>;
}