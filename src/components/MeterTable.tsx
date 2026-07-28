import React from 'react';
import { EyeIcon, EditIcon, TrashIcon } from 'lucide-react';
interface Meter {
  accountNo: string;
  customerName: string;
  meterNo: string;
  location: string;
  consumption: string;
  balance: string;
  status: 'Active' | 'Low Balance' | 'Disconnected' | 'Pending Bill' | 'Overdue';
}
interface MeterTableProps {
  meters: Meter[];
  type: 'prepaid' | 'postpaid';
  onView?: (meter: Meter) => void;
  onEdit?: (meter: Meter) => void;
  onDelete?: (meter: Meter) => void;
}
export function MeterTable({
  meters,
  type,
  onView,
  onEdit,
  onDelete
}: MeterTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Low Balance':
        return 'bg-yellow-100 text-yellow-800';
      case 'Disconnected':
        return 'bg-red-100 text-red-800';
      case 'Pending Bill':
        return 'bg-yellow-100 text-yellow-800';
      case 'Overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  return <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Account No.
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Customer Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Meter No.
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Location
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Consumption (kWh)
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {type === 'prepaid' ? 'Balance (Ksh)' : 'Bill Amount (Ksh)'}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {meters.map((meter, index) => <tr key={index} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">{meter.accountNo}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                {meter.customerName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">{meter.meterNo}</td>
              <td className="px-6 py-4 whitespace-nowrap">{meter.location}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                {meter.consumption}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">{meter.balance}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(meter.status)}`}>
                
                  {meter.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex space-x-3">
                  <button onClick={() => onView && onView(meter)} className="text-blue-600 hover:text-blue-900 transition-colors" title="View Details">
                  
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  <button onClick={() => onEdit && onEdit(meter)} className="text-yellow-600 hover:text-yellow-900 transition-colors" title="Edit Meter">
                  
                    <EditIcon className="h-4 w-4" />
                  </button>
                  <button onClick={() => onDelete && onDelete(meter)} className="text-red-600 hover:text-red-900 transition-colors" title="Delete Meter">
                  
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>)}
        </tbody>
      </table>
    </div>;
}