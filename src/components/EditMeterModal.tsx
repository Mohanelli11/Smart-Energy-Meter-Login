import React, { useEffect, useState } from 'react';
import { XIcon } from 'lucide-react';
interface EditMeterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (meter: any) => void;
  meter: any;
  type: 'prepaid' | 'postpaid';
}
export function EditMeterModal({
  isOpen,
  onClose,
  onSave,
  meter,
  type
}: EditMeterModalProps) {
  const [formData, setFormData] = useState({
    customerName: '',
    phoneNumber: '',
    location: '',
    transformer: '',
    customerType: '',
    consumption: '',
    balance: '',
    status: '',
    tariffRate: '',
    comments: ''
  });
  useEffect(() => {
    if (meter) {
      setFormData({
        customerName: meter.customerName || '',
        phoneNumber: meter.phoneNumber || '',
        location: meter.location || '',
        transformer: meter.transformer || '',
        customerType: meter.customerType || '',
        consumption: meter.consumption || '',
        balance: meter.balance || '',
        status: meter.status || '',
        tariffRate: meter.tariffRate || '',
        comments: meter.comments || ''
      });
    }
  }, [meter]);
  if (!isOpen || !meter) return null;
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedMeter = {
      ...meter,
      ...formData
    };
    onSave(updatedMeter);
    onClose();
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };
  const statusOptions = type === 'prepaid' ? ['Active', 'Low Balance', 'Disconnected'] : ['Active', 'Pending Bill', 'Overdue'];
  return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">Edit Meter - {meter.accountNo}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="customerName">
                
                Customer Name
              </label>
              <input type="text" id="customerName" value={formData.customerName} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="phoneNumber">
                
                Phone Number
              </label>
              <input type="tel" id="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="location">
                
                Location
              </label>
              <input type="text" id="location" value={formData.location} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="transformer">
                
                Transformer
              </label>
              <select id="transformer" value={formData.transformer} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                
                <option value="">Select Transformer</option>
                <option value="TR-001">TR-001 (Nairobi West)</option>
                <option value="TR-002">TR-002 (Kasarani)</option>
                <option value="TR-003">TR-003 (Ruiru)</option>
                <option value="TR-004">TR-004 (Thika)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="customerType">
                
                Customer Type
              </label>
              <select id="customerType" value={formData.customerType} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                
                <option value="">Select Type</option>
                <option value="tier-zero">Tier Zero (New Connection)</option>
                <option value="existing">Existing Power</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="consumption">
                
                Consumption (kWh)
              </label>
              <input type="number" step="0.01" id="consumption" value={formData.consumption} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="balance">
                
                {type === 'prepaid' ? 'Balance (Ksh)' : 'Bill Amount (Ksh)'}
              </label>
              <input type="number" step="0.01" id="balance" value={formData.balance} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="status">
                
                Status
              </label>
              <select id="status" value={formData.status} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                
                <option value="">Select Status</option>
                {statusOptions.map((status) => <option key={status} value={status}>
                    {status}
                  </option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="tariffRate">
                
                Tariff Rate (Ksh/kWh)
              </label>
              <input type="number" step="0.01" id="tariffRate" value={formData.tariffRate} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="comments">
              
              Comments
            </label>
            <textarea id="comments" rows={3} value={formData.comments} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            </textarea>
          </div>

          <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              
              Cancel
            </button>
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>;
}