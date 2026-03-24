import React from 'react';
import { XIcon, CopyIcon, SendIcon, PrinterIcon } from 'lucide-react';
interface TokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  amount: string;
}
export function TokenModal({
  isOpen,
  onClose,
  token,
  amount
}: TokenModalProps) {
  if (!isOpen) return null;
  const copyToken = () => {
    navigator.clipboard.writeText(token);
    alert('Token copied to clipboard!');
  };
  const sendToken = () => {
    alert('Token sent to customer via SMS!');
  };
  const printToken = () => {
    window.print();
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Prepaid Token</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700">
            
            <XIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="mb-4">
          <p className="text-gray-600">
            Token Amount: <span className="font-medium">{amount}</span>
          </p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-4">
          <p className="text-center text-2xl font-mono tracking-widest">
            {token}
          </p>
        </div>
        <div className="flex justify-between">
          <button
            onClick={copyToken}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
            
            <CopyIcon className="h-4 w-4 mr-2" />
            Copy
          </button>
          <button
            onClick={sendToken}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center">
            
            <SendIcon className="h-4 w-4 mr-2" />
            Send SMS
          </button>
          <button
            onClick={printToken}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center">
            
            <PrinterIcon className="h-4 w-4 mr-2" />
            Print
          </button>
        </div>
      </div>
    </div>);

}