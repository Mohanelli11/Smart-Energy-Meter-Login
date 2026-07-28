import React, { useEffect, useState } from 'react';
import { KeyIcon, PlusIcon, TrashIcon, CopyIcon, CheckIcon, EyeIcon, EyeOffIcon, AlertTriangleIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from 'lucide-react';
import { getAllAPIKeys, createAPIKey, revokeAPIKey, deleteAPIKey, getPendingAPIRequests, approveAPIRequest, rejectAPIRequest, APIKey, APIAccessRequest } from '../utils/apiKeyStorage';
interface APIManagementProps {
  userEmail: string;
  userId: string;
}
export function APIManagement({
  userEmail,
  userId
}: APIManagementProps) {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [pendingRequests, setPendingRequests] = useState<APIAccessRequest[]>([]);
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'keys' | 'requests'>('keys');
  useEffect(() => {
    loadData();
  }, []);
  const loadData = () => {
    setApiKeys(getAllAPIKeys());
    setPendingRequests(getPendingAPIRequests());
  };
  const handleCreateKey = () => {
    if (!newKeyName.trim()) {
      alert('Please enter a key name');
      return;
    }
    createAPIKey(userId, userEmail, newKeyName.trim(), ['read', 'write']);
    setNewKeyName('');
    setShowNewKeyModal(false);
    loadData();
  };
  const handleRevokeKey = (keyId: string) => {
    if (confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      revokeAPIKey(keyId);
      loadData();
    }
  };
  const handleDeleteKey = (keyId: string) => {
    if (confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      deleteAPIKey(keyId);
      loadData();
    }
  };
  const handleCopyKey = (key: string, keyId: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKeyId(keyId);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };
  const toggleKeyVisibility = (keyId: string) => {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(keyId)) {
      newVisible.delete(keyId);
    } else {
      newVisible.add(keyId);
    }
    setVisibleKeys(newVisible);
  };
  const handleApproveRequest = (request: APIAccessRequest) => {
    const keyName = `${request.userName}'s API Key`;
    const apiKey = approveAPIRequest(request.id, userId, keyName);
    if (apiKey) {
      alert(`API access approved for ${request.userName}. API key created.`);
      loadData();
    }
  };
  const handleRejectRequest = (request: APIAccessRequest) => {
    if (confirm(`Are you sure you want to reject ${request.userName}'s API access request?`)) {
      rejectAPIRequest(request.id, userId);
      loadData();
    }
  };
  const maskApiKey = (key: string) => {
    return key.substring(0, 12) + '•'.repeat(20) + key.substring(key.length - 4);
  };
  return <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <KeyIcon className="h-7 w-7 text-blue-600 mr-3" />
              API Management
            </h2>
            <p className="text-gray-500 mt-1">
              Manage API keys and access requests for the Hydrobox platform
            </p>
          </div>
          <button onClick={() => setShowNewKeyModal(true)} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">

            <PlusIcon className="h-5 w-5 mr-2" />
            Create API Key
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button onClick={() => setActiveTab('keys')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'keys' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>

          API Keys ({apiKeys.length})
        </button>
        <button onClick={() => setActiveTab('requests')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'requests' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>

          Access Requests
          {pendingRequests.length > 0 && <span className="ml-2 bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">
              {pendingRequests.length}
            </span>}
        </button>
      </div>

      {/* API Keys Tab */}
      {activeTab === 'keys' && <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {apiKeys.length === 0 ? <div className="p-12 text-center">
              <KeyIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No API Keys
              </h3>
              <p className="text-gray-500 mb-4">
                Create your first API key to start using the Hydrobox API
              </p>
              <button onClick={() => setShowNewKeyModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">

                Create API Key
              </button>
            </div> : <div className="divide-y divide-gray-200">
              {apiKeys.map((key) => <div key={key.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {key.name}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${key.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>

                          {key.status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 mb-3">
                        <code className="px-3 py-2 bg-gray-50 rounded border border-gray-200 text-sm font-mono">
                          {visibleKeys.has(key.id) ? key.key : maskApiKey(key.key)}
                        </code>
                        <button onClick={() => toggleKeyVisibility(key.id)} className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors" title={visibleKeys.has(key.id) ? 'Hide key' : 'Show key'}>

                          {visibleKeys.has(key.id) ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                        </button>
                        <button onClick={() => handleCopyKey(key.key, key.id)} className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors" title="Copy to clipboard">

                          {copiedKeyId === key.id ? <CheckIcon className="h-4 w-4 text-green-600" /> : <CopyIcon className="h-4 w-4" />}
                        </button>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>
                          Created:{' '}
                          {new Date(key.createdAt).toLocaleDateString()}
                        </span>
                        {key.lastUsed && <span>
                            Last used:{' '}
                            {new Date(key.lastUsed).toLocaleDateString()}
                          </span>}
                        <span>Permissions: {key.permissions.join(', ')}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {key.status === 'active' && <button onClick={() => handleRevokeKey(key.id)} className="px-3 py-1.5 text-sm text-orange-600 hover:bg-orange-50 rounded transition-colors">

                          Revoke
                        </button>}
                      <button onClick={() => handleDeleteKey(key.id)} className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete key">

                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>)}
            </div>}
        </div>}

      {/* Access Requests Tab */}
      {activeTab === 'requests' && <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {pendingRequests.length === 0 ? <div className="p-12 text-center">
              <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Pending Requests
              </h3>
              <p className="text-gray-500">
                All API access requests have been reviewed
              </p>
            </div> : <div className="divide-y divide-gray-200">
              {pendingRequests.map((request) => <div key={request.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {request.userName}
                        </h3>
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                          Pending
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {request.userEmail}
                      </p>
                      <div className="bg-gray-50 p-3 rounded border border-gray-200 mb-3">
                        <p className="text-sm text-gray-700">
                          <strong>Reason:</strong> {request.reason}
                        </p>
                      </div>
                      <p className="text-sm text-gray-500">
                        Requested:{' '}
                        {new Date(request.requestedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button onClick={() => handleApproveRequest(request)} className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">

                        <CheckCircleIcon className="h-4 w-4 mr-2" />
                        Approve
                      </button>
                      <button onClick={() => handleRejectRequest(request)} className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">

                        <XCircleIcon className="h-4 w-4 mr-2" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>)}
            </div>}
        </div>}

      {/* Create API Key Modal */}
      {showNewKeyModal && <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Create New API Key
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Key Name
              </label>
              <input type="text" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} placeholder="e.g., Production API Key" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" maxLength={50} />

            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <div className="flex items-start">
                <AlertTriangleIcon className="h-5 w-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-yellow-800">
                  Make sure to copy your API key now. You won't be able to see
                  it again!
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button onClick={() => {
            setShowNewKeyModal(false);
            setNewKeyName('');
          }} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">

                Cancel
              </button>
              <button onClick={handleCreateKey} disabled={!newKeyName.trim()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">

                Create Key
              </button>
            </div>
          </div>
        </div>}

      {/* API Documentation Link */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">API Documentation</h3>
        <p className="text-sm text-blue-800 mb-3">
          Learn how to integrate with the Hydrobox API and start building
          powerful applications.
        </p>
        <a href="/api/README.md" target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800 font-medium">

          View API Documentation →
        </a>
      </div>
    </div>;
}