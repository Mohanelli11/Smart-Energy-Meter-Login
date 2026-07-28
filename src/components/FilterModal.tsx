import React, { useState } from 'react';
import { XIcon } from 'lucide-react';
interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
  type: 'prepaid' | 'postpaid' | 'payments';
}
export function FilterModal({
  isOpen,
  onClose,
  onApply,
  type
}: FilterModalProps) {
  const [filters, setFilters] = useState({
    status: '',
    location: '',
    consumptionMin: '',
    consumptionMax: '',
    balanceMin: '',
    balanceMax: '',
    dateFrom: '',
    dateTo: ''
  });
  if (!isOpen) return null;
  const handleApply = () => {
    onApply(filters);
    onClose();
  };
  const handleReset = () => {
    setFilters({
      status: '',
      location: '',
      consumptionMin: '',
      consumptionMax: '',
      balanceMin: '',
      balanceMax: '',
      dateFrom: '',
      dateTo: ''
    });
    onApply({});
    onClose();
  };
  const statusOptions = type === 'prepaid' ? ['Active', 'Low Balance', 'Disconnected'] : type === 'postpaid' ? ['Active', 'Pending Bill', 'Overdue'] : ['Completed', 'Pending', 'Failed'];
  const locations = ['Nairobi West', 'Kasarani', 'Ruiru', 'Thika', 'Juja', 'Kiambu', 'Kikuyu', 'Limuru', 'Kahawa West', 'Zimmerman', 'Roysambu', 'Embakasi', 'Donholm', 'Umoja', 'Kayole', 'Githurai', 'Kahawa Sukari', 'Mwiki', 'Njiru', 'Utawala', 'Mihango', 'Komarock', 'Buruburu', 'Makadara', 'Eastleigh', 'Pangani', 'Parklands', 'Westlands', 'Kilimani', 'Lavington', 'Kileleshwa', 'Hurlingham', 'Ngong', 'Rongai', 'Kitengela'];
  return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">
            Filter{' '}
            {type === 'prepaid' ? 'Prepaid Meters' : type === 'postpaid' ? 'Postpaid Meters' : 'Payments'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select value={filters.status} onChange={(e) => setFilters({
            ...filters,
            status: e.target.value
          })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              
              <option value="">All Statuses</option>
              {statusOptions.map((status) => <option key={status} value={status}>
                  {status}
                </option>)}
            </select>
          </div>

          {type !== 'payments' && <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <select value={filters.location} onChange={(e) => setFilters({
            ...filters,
            location: e.target.value
          })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              
                <option value="">All Locations</option>
                {locations.map((location) => <option key={location} value={location}>
                    {location}
                  </option>)}
              </select>
            </div>}

          {type !== 'payments' && <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Consumption (kWh)
                </label>
                <input type="number" value={filters.consumptionMin} onChange={(e) => setFilters({
              ...filters,
              consumptionMin: e.target.value
            })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" />
              
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Consumption (kWh)
                </label>
                <input type="number" value={filters.consumptionMax} onChange={(e) => setFilters({
              ...filters,
              consumptionMax: e.target.value
            })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="100" />
              
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min {type === 'prepaid' ? 'Balance' : 'Bill'} (Ksh)
                </label>
                <input type="number" value={filters.balanceMin} onChange={(e) => setFilters({
              ...filters,
              balanceMin: e.target.value
            })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" />
              
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max {type === 'prepaid' ? 'Balance' : 'Bill'} (Ksh)
                </label>
                <input type="number" value={filters.balanceMax} onChange={(e) => setFilters({
              ...filters,
              balanceMax: e.target.value
            })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="5000" />
              
              </div>
            </>}

          {type === 'payments' && <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date From
                </label>
                <input type="date" value={filters.dateFrom} onChange={(e) => setFilters({
              ...filters,
              dateFrom: e.target.value
            })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date To
                </label>
                <input type="date" value={filters.dateTo} onChange={(e) => setFilters({
              ...filters,
              dateTo: e.target.value
            })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              
              </div>
            </>}
        </div>

        <div className="flex justify-end space-x-3">
          <button onClick={handleReset} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            
            Reset Filters
          </button>
          <button onClick={handleApply} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            
            Apply Filters
          </button>
        </div>
      </div>
    </div>;
}