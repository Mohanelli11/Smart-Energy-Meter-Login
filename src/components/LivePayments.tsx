import React, { useEffect, useState } from 'react';
interface Payment {
  transactionId: string;
  accountNo: string;
  amount: string;
  phone: string;
  timestamp: string;
  status: string;
}
export function LivePayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  useEffect(() => {
    const accounts = [
    {
      id: 'MET-1234-2023',
      name: 'Jane Wanjiku'
    },
    {
      id: 'MET-5678-2023',
      name: 'Paul Otieno'
    },
    {
      id: 'MET-9012-2023',
      name: 'Mary Auma'
    },
    {
      id: 'MET-3456-2023',
      name: 'Peter Mwangi'
    }];

    const phones = [
    '254712345678',
    '254723456789',
    '254734567890',
    '254745678901'];

    const interval = setInterval(() => {
      const randomAccount =
      accounts[Math.floor(Math.random() * accounts.length)];
      const randomPhone = phones[Math.floor(Math.random() * phones.length)];
      const randomAmount = Math.floor(Math.random() * 5000) + 500;
      const now = new Date();
      const timeString = now.toLocaleTimeString();
      const dateString = now.toLocaleDateString();
      const newPayment: Payment = {
        transactionId: `MPESA-${Math.floor(Math.random() * 9000) + 1000}`,
        accountNo: randomAccount.id,
        amount: randomAmount.toLocaleString() + '.00',
        phone: randomPhone,
        timestamp: `${dateString}, ${timeString}`,
        status: 'Processed'
      };
      setPayments((prev) => [newPayment, ...prev].slice(0, 10));
    }, 10000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Live Payments</h2>
        <div className="flex items-center">
          <div className="mr-4">
            <span className="inline-block w-3 h-3 bg-green-500 rounded-full animate-pulse mr-2"></span>
            <span className="text-sm text-gray-600">Live</span>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Transaction ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Account No.
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount (Ksh)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Timestamp
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payments.map((payment, index) =>
            <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {payment.transactionId}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {payment.accountNo}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {payment.amount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{payment.phone}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {payment.timestamp}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                    {payment.status}
                  </span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>);

}