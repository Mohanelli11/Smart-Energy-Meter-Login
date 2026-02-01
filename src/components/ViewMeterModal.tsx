import React from 'react';
import { XIcon, ZapIcon, MapPinIcon, UserIcon, PhoneIcon } from 'lucide-react';
import { MeterReports } from './MeterReports';
interface ViewMeterModalProps {
  isOpen: boolean;
  onClose: () => void;
  meter: any;
  type: 'prepaid' | 'postpaid';
}
export function ViewMeterModal({
  isOpen,
  onClose,
  meter,
  type
}: ViewMeterModalProps) {
  if (!isOpen || !meter) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">Meter Details</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700">

            <XIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center mb-3">
              <div className="p-2 bg-blue-600 rounded-full mr-3">
                <ZapIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-blue-900">
                  {meter.customerName}
                </h4>
                <p className="text-sm text-blue-700">
                  {type === 'prepaid' ? 'Prepaid Meter' : 'Postpaid Meter'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Account Number</p>
                <p className="font-semibold text-gray-900">{meter.accountNo}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Meter Number</p>
                <p className="font-semibold text-gray-900">{meter.meterNo}</p>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div>
            <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
              <UserIcon className="h-5 w-5 mr-2 text-gray-600" />
              Customer Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium text-gray-900">
                  {meter.customerName}
                </p>
              </div>
              {meter.phoneNumber &&
              <div>
                  <p className="text-sm text-gray-600">Phone Number</p>
                  <p className="font-medium text-gray-900">
                    {meter.phoneNumber}
                  </p>
                </div>
              }
              <div>
                <p className="text-sm text-gray-600">Location</p>
                <p className="font-medium text-gray-900 flex items-center">
                  <MapPinIcon className="h-4 w-4 mr-1 text-gray-500" />
                  {meter.location}
                </p>
              </div>
              {meter.customerType &&
              <div>
                  <p className="text-sm text-gray-600">Customer Type</p>
                  <p className="font-medium text-gray-900">
                    {meter.customerType}
                  </p>
                </div>
              }
            </div>
          </div>

          {/* Meter Information */}
          <div>
            <h4 className="text-md font-semibold text-gray-800 mb-3">
              Meter Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Consumption</p>
                <p className="font-medium text-gray-900">
                  {meter.consumption} kWh
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  {type === 'prepaid' ? 'Current Balance' : 'Bill Amount'}
                </p>
                <p
                  className={`font-medium ${type === 'prepaid' ? parseFloat(meter.balance) > 50 ? 'text-green-600' : 'text-red-600' : 'text-blue-600'}`}>

                  Ksh {parseFloat(meter.balance).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <span
                  className={`inline-block px-3 py-1 text-xs rounded-full font-medium ${meter.status === 'Active' ? 'bg-green-100 text-green-800' : meter.status === 'Low Balance' ? 'bg-yellow-100 text-yellow-800' : meter.status === 'Disconnected' ? 'bg-red-100 text-red-800' : meter.status === 'Pending Bill' ? 'bg-yellow-100 text-yellow-800' : meter.status === 'Overdue' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>

                  {meter.status}
                </span>
              </div>
              {meter.transformer &&
              <div>
                  <p className="text-sm text-gray-600">Transformer</p>
                  <p className="font-medium text-gray-900">
                    {meter.transformer}
                  </p>
                </div>
              }
              {meter.tariffRate &&
              <div>
                  <p className="text-sm text-gray-600">Tariff Rate</p>
                  <p className="font-medium text-gray-900">
                    Ksh {meter.tariffRate}/kWh
                  </p>
                </div>
              }
            </div>
          </div>

          {/* Last Reports Section - NEW */}
          <div>
            <MeterReports report={meter.lastReport} meterType={type} />
          </div>

          {/* Additional Information */}
          {meter.comments &&
          <div>
              <h4 className="text-md font-semibold text-gray-800 mb-3">
                Comments
              </h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">{meter.comments}</p>
              </div>
            </div>
          }
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">

            Close
          </button>
        </div>
      </div>
    </div>);

}