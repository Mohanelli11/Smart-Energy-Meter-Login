import React, { useState } from 'react';
interface AddMeterFormProps {
  onMeterAdded: (meter: any) => void;
}
export function AddMeterForm({
  onMeterAdded
}: AddMeterFormProps) {
  const [formData, setFormData] = useState({
    customerName: '',
    phoneNumber: '',
    location: '',
    transformer: '',
    customerType: '',
    meterType: '',
    accountNumber: '',
    meterNumber: '',
    tariffRate: '',
    comments: ''
  });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Determine if prepaid or postpaid based on meterType
    const isPrepaid = formData.meterType.includes('prepaid');
    // Create meter object
    const newMeter = {
      accountNo: formData.accountNumber,
      customerName: formData.customerName,
      meterNo: formData.meterNumber,
      location: formData.location,
      consumption: '0.00',
      balance: isPrepaid ? '0.00' : '0.00',
      status: isPrepaid ? 'Active' as const : 'Active' as const,
      type: isPrepaid ? 'prepaid' : 'postpaid',
      phoneNumber: formData.phoneNumber,
      transformer: formData.transformer,
      customerType: formData.customerType,
      tariffRate: formData.tariffRate,
      comments: formData.comments
    };
    // Call the callback to add meter
    onMeterAdded(newMeter);
    alert(`Meter for ${formData.customerName} (${formData.meterType}) with account number ${formData.accountNumber} has been added successfully!`);
    // Reset form
    setFormData({
      customerName: '',
      phoneNumber: '',
      location: '',
      transformer: '',
      customerType: '',
      meterType: '',
      accountNumber: '',
      meterNumber: '',
      tariffRate: '',
      comments: ''
    });
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };
  return <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-6">Add New Meter</h2>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="customerName">
              Customer Name
            </label>
            <input type="text" id="customerName" value={formData.customerName} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="phoneNumber">
              Phone Number
            </label>
            <input type="tel" id="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="location">
              Location
            </label>
            <input type="text" id="location" value={formData.location} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="transformer">
              Transformer
            </label>
            <select id="transformer" value={formData.transformer} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
              <option value="">Select Transformer</option>
              <option value="TR-001">TR-001 (Nairobi West)</option>
              <option value="TR-002">TR-002 (Kasarani)</option>
              <option value="TR-003">TR-003 (Ruiru)</option>
              <option value="TR-004">TR-004 (Thika)</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="customerType">
              Customer Type
            </label>
            <select id="customerType" value={formData.customerType} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
              <option value="">Select Type</option>
              <option value="tier-zero">Tier Zero (New Connection)</option>
              <option value="existing">Existing Power</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="meterType">
              Meter Type
            </label>
            <select id="meterType" value={formData.meterType} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
              <option value="">Select Meter Type</option>
              <option value="prepaid-single">Prepaid - Single Phase</option>
              <option value="prepaid-three">Prepaid - Three Phase</option>
              <option value="postpaid-single">Postpaid - Single Phase</option>
              <option value="postpaid-three">Postpaid - Three Phase</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="accountNumber">
              Account Number
            </label>
            <input type="text" id="accountNumber" value={formData.accountNumber} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="meterNumber">
              Meter Number
            </label>
            <input type="text" id="meterNumber" value={formData.meterNumber} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="tariffRate">
              Tariff Rate (Ksh/kWh)
            </label>
            <input type="number" step="0.01" id="tariffRate" value={formData.tariffRate} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 mb-2" htmlFor="comments">
            Comments
          </label>
          <textarea id="comments" rows={3} value={formData.comments} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
        </div>
        <div className="flex justify-end space-x-4">
          <button type="reset" onClick={() => setFormData({
          customerName: '',
          phoneNumber: '',
          location: '',
          transformer: '',
          customerType: '',
          meterType: '',
          accountNumber: '',
          meterNumber: '',
          tariffRate: '',
          comments: ''
        })} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            Clear
          </button>
          <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Add Meter
          </button>
        </div>
      </form>
    </div>;
}