import React from 'react';
import { XIcon, ZapIcon, MapPinIcon, UserIcon } from 'lucide-react';
import { MeterReports } from './MeterReports';
import { MeterCommandControl } from './MeterCommandControl';

// Constants
const DEFAULT_USER_EMAIL = 'unknown@motech.ke';
const MODAL_MAX_WIDTH = 'max-w-4xl';
const MODAL_MAX_HEIGHT = 'max-h-[90vh]';
const ICON_SIZE = 'h-6 w-6';
const SMALL_ICON_SIZE = 'h-5 w-5';

// Type Definitions
interface Meter {
  customerName: string;
  accountNo: string;
  meterNo: string;
  status: 'Active' | 'Low Balance' | 'Inactive';
  phoneNumber?: string;
  location: string;
  customerType?: string;
  consumption: number;
  balance: string | number;
  transformer?: string;
  tariffRate?: string | number;
  comments?: string;
  lastReport?: Record<string, any>;
}

interface ViewMeterModalProps {
  isOpen: boolean;
  onClose: () => void;
  meter: Meter;
  type: 'prepaid' | 'postpaid';
  userEmail?: string;
}

// Utility Functions
const formatCurrency = (amount: number | string): string => {
  return `Ksh ${parseFloat(String(amount)).toLocaleString()}`;
};

const getStatusBadgeClasses = (status: string): string => {
  switch (status) {
    case 'Active':
      return 'bg-green-100 text-green-800';
    case 'Low Balance':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-red-100 text-red-800';
  }
};

const getBalanceTextColor = (type: 'prepaid' | 'postpaid', balance: number): string => {
  if (type === 'prepaid') {
    return balance > 50 ? 'text-green-600' : 'text-red-600';
  }
  return 'text-blue-600';
};

// Sub-components
function MeterHeaderCard({ meter, type }: { meter: Meter; type: 'prepaid' | 'postpaid' }) {
  return (
    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
      <div className="flex items-center mb-3">
        <div className="p-2 bg-blue-600 rounded-full mr-3">
          <ZapIcon className={`${ICON_SIZE} text-white`} />
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
  );
}

function CustomerInfoSection({ meter }: { meter: Meter }) {
  return (
    <section>
      <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
        <UserIcon className={`${SMALL_ICON_SIZE} mr-2 text-gray-600`} />
        Customer Information
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
        <div>
          <p className="text-sm text-gray-600">Name</p>
          <p className="font-medium text-gray-900">
            {meter.customerName}
          </p>
        </div>
        {meter.phoneNumber && (
          <div>
            <p className="text-sm text-gray-600">Phone Number</p>
            <p className="font-medium text-gray-900">
              {meter.phoneNumber}
            </p>
          </div>
        )}
        <div>
          <p className="text-sm text-gray-600">Location</p>
          <p className="font-medium text-gray-900 flex items-center">
            <MapPinIcon className="h-4 w-4 mr-1 text-gray-500" />
            {meter.location}
          </p>
        </div>
        {meter.customerType && (
          <div>
            <p className="text-sm text-gray-600">Customer Type</p>
            <p className="font-medium text-gray-900">
              {meter.customerType}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function MeterInfoSection({ meter, type }: { meter: Meter; type: 'prepaid' | 'postpaid' }) {
  const balance = parseFloat(String(meter.balance));

  return (
    <section>
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
          <p className={`font-medium ${getBalanceTextColor(type, balance)}`}>
            {formatCurrency(meter.balance)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Status</p>
          <span
            className={`inline-block px-3 py-1 text-xs rounded-full font-medium ${getStatusBadgeClasses(
              meter.status
            )}`}
          >
            {meter.status}
          </span>
        </div>
        {meter.transformer && (
          <div>
            <p className="text-sm text-gray-600">Transformer</p>
            <p className="font-medium text-gray-900">
              {meter.transformer}
            </p>
          </div>
        )}
        {meter.tariffRate && (
          <div>
            <p className="text-sm text-gray-600">Tariff Rate</p>
            <p className="font-medium text-gray-900">
              {formatCurrency(meter.tariffRate)}/kWh
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function CommentsSection({ comments }: { comments?: string }) {
  if (!comments) return null;

  return (
    <section>
      <h4 className="text-md font-semibold text-gray-800 mb-3">
        Comments
      </h4>
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-gray-700">{comments}</p>
      </div>
    </section>
  );
}

// Main Component
export function ViewMeterModal({
  isOpen,
  onClose,
  meter,
  type,
  userEmail = DEFAULT_USER_EMAIL,
}: ViewMeterModalProps) {
  if (!isOpen || !meter) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="presentation"
    >
      <div
        className={`bg-white rounded-lg p-6 ${MODAL_MAX_WIDTH} w-full mx-4 ${MODAL_MAX_HEIGHT} overflow-y-auto`}
        role="dialog"
        aria-labelledby="meter-modal-title"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 id="meter-modal-title" className="text-xl font-bold">
            Meter Details
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Close meter details modal"
          >
            <XIcon className={ICON_SIZE} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Header Card */}
          <MeterHeaderCard meter={meter} type={type} />

          {/* Remote Control Section */}
          <section>
            <MeterCommandControl
              meterAccountNo={meter.accountNo}
              userEmail={userEmail}
              currentStatus={meter.status}
            />
          </section>

          {/* Customer Information */}
          <CustomerInfoSection meter={meter} />

          {/* Meter Information */}
          <MeterInfoSection meter={meter} type={type} />

          {/* Last Reports Section */}
          <section>
            <MeterReports report={meter.lastReport} meterType={type} />
          </section>

          {/* Additional Information */}
          <CommentsSection comments={meter.comments} />
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
