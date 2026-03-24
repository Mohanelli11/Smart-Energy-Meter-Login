import React from 'react';
import { XIcon, AlertTriangleIcon } from 'lucide-react';
interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  meterName: string;
  accountNo: string;
}
export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  meterName,
  accountNo
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-full mr-3">
              <AlertTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Confirm Delete</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700">
            
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 mb-2">
            Are you sure you want to delete this meter?
          </p>
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">Customer Name</p>
            <p className="font-semibold text-gray-900">{meterName}</p>
            <p className="text-sm text-gray-600 mt-2">Account Number</p>
            <p className="font-semibold text-gray-900">{accountNo}</p>
          </div>
          <p className="text-red-600 text-sm mt-3 font-medium">
            ⚠️ This action cannot be undone.
          </p>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
            
            Delete Meter
          </button>
        </div>
      </div>
    </div>);

}