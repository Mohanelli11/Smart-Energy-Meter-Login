import React, { useEffect, useState } from 'react';
import { KeyIcon, SendIcon, ClockIcon, CheckCircleIcon, XCircleIcon, AlertCircleIcon } from 'lucide-react';
import { getUserAPIRequests, getUserAPIKeys, createAPIRequest, hasPendingRequest, APIAccessRequest as APIRequest, APIKey } from '../utils/apiKeyStorage';
interface APIAccessRequestProps {
  userId: string;
  userEmail: string;
  userName: string;
}
export function APIAccessRequest({
  userId,
  userEmail,
  userName
}: APIAccessRequestProps) {
  const [requests, setRequests] = useState<APIRequest[]>([]);
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [reason, setReason] = useState('');
  const [hasPending, setHasPending] = useState(false);
  useEffect(() => {
    loadData();
  }, [userId]);
  const loadData = () => {
    setRequests(getUserAPIRequests(userId));
    setApiKeys(getUserAPIKeys(userId));
    setHasPending(hasPendingRequest(userId));
  };
  const handleSubmitRequest = () => {
    if (!reason.trim()) {
      alert('Please provide a reason for API access');
      return;
    }
    createAPIRequest(userId, userEmail, userName, reason.trim());
    setReason('');
    setShowRequestForm(false);
    loadData();
  };
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-600" />;
      case 'approved':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'rejected':
        return <XCircleIcon className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircleIcon className="h-5 w-5 text-gray-600" />;
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  return <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <KeyIcon className="h-7 w-7 text-blue-600 mr-3" />
              API Access
            </h2>
            <p className="text-gray-500 mt-1">
              Request API access to integrate with the Hydrobox platform
            </p>
          </div>
          {apiKeys.length === 0 && !hasPending && <button onClick={() => setShowRequestForm(true)} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <SendIcon className="h-5 w-5 mr-2" />
              Request Access
            </button>}
        </div>
      </div>

      {/* Active API Keys */}
      {apiKeys.length > 0 && <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Your API Keys
          </h3>
          <div className="space-y-4">
            {apiKeys.map(key => <div key={key.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{key.name}</h4>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    Active
                  </span>
                </div>
                <code className="block px-3 py-2 bg-white rounded border border-gray-200 text-sm font-mono mb-2">
                  {key.key}
                </code>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>
                    Created: {new Date(key.createdAt).toLocaleDateString()}
                  </span>
                  {key.lastUsed && <span>
                      Last used: {new Date(key.lastUsed).toLocaleDateString()}
                    </span>}
                </div>
              </div>)}
          </div>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              📚 Check out the{' '}
              <a href="/api/README.md" target="_blank" rel="noopener noreferrer" className="font-medium underline">
                API Documentation
              </a>{' '}
              to learn how to use your API key.
            </p>
          </div>
        </div>}

      {/* Pending Request Notice */}
      {hasPending && apiKeys.length === 0 && <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start">
            <ClockIcon className="h-6 w-6 text-yellow-600 mr-3 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900 mb-1">
                Request Pending
              </h3>
              <p className="text-sm text-yellow-800">
                Your API access request is being reviewed by an administrator.
                You'll be notified once it's approved.
              </p>
            </div>
          </div>
        </div>}

      {/* Request History */}
      {requests.length > 0 && <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Request History
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {requests.map(request => <div key={request.id} className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(request.status)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(request.requestedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="bg-gray-50 p-3 rounded border border-gray-200">
                  <p className="text-sm text-gray-700">
                    <strong>Reason:</strong> {request.reason}
                  </p>
                </div>
                {request.reviewedAt && <p className="text-sm text-gray-500 mt-2">
                    Reviewed:{' '}
                    {new Date(request.reviewedAt).toLocaleDateString()}
                  </p>}
              </div>)}
          </div>
        </div>}

      {/* No Access State */}
      {apiKeys.length === 0 && !hasPending && requests.length === 0 && <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <KeyIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No API Access Yet
          </h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Request API access to start building integrations with the Hydrobox
            SmartMeter platform. An administrator will review your request.
          </p>
          <button onClick={() => setShowRequestForm(true)} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Request API Access
          </button>
        </div>}

      {/* Request Form Modal */}
      {showRequestForm && <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Request API Access
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Why do you need API access?
              </label>
              <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Please describe your use case and what you plan to build..." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" rows={4} maxLength={500} />
              <p className="text-xs text-gray-500 mt-1">
                {reason.length}/500 characters
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                Your request will be reviewed by an administrator. You'll
                receive an API key once approved.
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button onClick={() => {
            setShowRequestForm(false);
            setReason('');
          }} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                Cancel
              </button>
              <button onClick={handleSubmitRequest} disabled={!reason.trim()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
                Submit Request
              </button>
            </div>
          </div>
        </div>}
    </div>;
}