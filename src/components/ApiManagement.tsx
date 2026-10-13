import { useEffect, useState } from 'react';
import { ADMIN_ROLES, hasRole, type Role } from '../features/authentication/types';
import {
  ShieldIcon,
  KeyIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CopyIcon,
  ServerIcon,
  AlertCircleIcon } from
'lucide-react';
import {
  getApiRequests,
  createApiRequest,
  updateApiRequestStatus,
  getApiRequestByUser,
  ApiRequest } from
'../utils/apiAccessStorage';
interface ApiManagementProps {
  user: {
    email: string;
    name: string;
    role: Role;
  };
}
export function ApiManagement({ user }: ApiManagementProps) {
  // Authorisation comes from the server-assigned role, never from a hardcoded email
  const isAdmin = hasRole(user.role, ADMIN_ROLES);
  const [requests, setRequests] = useState<ApiRequest[]>([]);
  const [userRequest, setUserRequest] = useState<ApiRequest | undefined>(
    undefined
  );
  const [copied, setCopied] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  useEffect(() => {
    if (isAdmin) {
      setRequests(getApiRequests());
    } else {
      setUserRequest(getApiRequestByUser(user.email));
    }
  }, [isAdmin, user.email, refreshTrigger]);
  const handleRequestAccess = () => {
    createApiRequest({
      email: user.email,
      name: user.name
    });
    setRefreshTrigger((prev) => prev + 1);
  };
  const handleAction = (requestId: string, action: 'approved' | 'rejected') => {
    updateApiRequestStatus(requestId, action);
    setRefreshTrigger((prev) => prev + 1);
  };
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  // Admin View
  if (isAdmin) {
    const pendingRequests = requests.filter((r) => r.status === 'pending');
    const historyRequests = requests.
    filter((r) => r.status !== 'pending').
    sort(
      (a, b) =>
      new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()
    );
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-purple-100 rounded-lg mr-3">
              <ShieldIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                API Access Management
              </h2>
              <p className="text-gray-500 text-sm">
                Manage developer access to the MoTech Electrical and Electronics
                Engineering Solutions Meter API
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
            <div className="flex">
              <ServerIcon className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-blue-900">
                  API Endpoint Information
                </h4>
                <p className="text-sm text-blue-800 mt-1">
                  Base URL:{' '}
                  <code className="bg-blue-100 px-1 py-0.5 rounded">
                    https://api.motech.ke/v1
                  </code>
                </p>
                <p className="text-xs text-blue-700 mt-2">
                  Documentation available at /docs
                </p>
              </div>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <ClockIcon className="h-4 w-4 mr-2 text-yellow-500" />
            Pending Requests ({pendingRequests.length})
          </h3>

          {pendingRequests.length === 0 ?
          <p className="text-gray-500 italic mb-8">No pending requests.</p> :

          <div className="space-y-4 mb-8">
              {pendingRequests.map((req) =>
            <div
              key={req.id}
              className="border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white hover:bg-gray-50 transition-colors">
              
                  <div>
                    <p className="font-semibold text-gray-900">{req.name}</p>
                    <p className="text-sm text-gray-600">{req.email}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Requested:{' '}
                      {new Date(req.requestDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2 mt-3 sm:mt-0">
                    <button
                  onClick={() => handleAction(req.id, 'approved')}
                  className="flex items-center px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors">
                  
                      <CheckCircleIcon className="h-4 w-4 mr-1.5" />
                      Approve
                    </button>
                    <button
                  onClick={() => handleAction(req.id, 'rejected')}
                  className="flex items-center px-3 py-1.5 bg-red-100 text-red-700 text-sm rounded-md hover:bg-red-200 transition-colors">
                  
                      <XCircleIcon className="h-4 w-4 mr-1.5" />
                      Reject
                    </button>
                  </div>
                </div>
            )}
            </div>
          }

          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Access History
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    API Key
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {historyRequests.map((req) =>
                <tr key={req.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {req.name}
                      </div>
                      <div className="text-sm text-gray-500">{req.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(req.requestDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${req.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {req.apiKey ?
                    <span className="text-gray-600">
                          {req.apiKey.substring(0, 12)}...
                        </span> :

                    '-'
                    }
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>);

  }
  // User View
  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center mb-6">
          <div className="p-3 bg-blue-100 rounded-full mr-4">
            <KeyIcon className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">API Access</h2>
            <p className="text-gray-600">
              Integrate MoTech Electrical and Electronics Engineering Solutions
              data into your own applications
            </p>
          </div>
        </div>

        {!userRequest ?
        <div className="text-center py-8">
            <ServerIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Active API Access
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              You currently don't have access to the developer API. Request
              access to generate an API key and start building.
            </p>
            <button
            onClick={handleRequestAccess}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
            
              Request API Access
            </button>
          </div> :

        <div className="space-y-6">
            <div
            className={`p-4 rounded-lg border ${userRequest.status === 'approved' ? 'bg-green-50 border-green-200' : userRequest.status === 'rejected' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
            
              <div className="flex items-start">
                {userRequest.status === 'approved' ?
              <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5 mr-3" /> :
              userRequest.status === 'rejected' ?
              <XCircleIcon className="h-5 w-5 text-red-600 mt-0.5 mr-3" /> :

              <ClockIcon className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
              }
                <div>
                  <h4
                  className={`text-sm font-bold ${userRequest.status === 'approved' ? 'text-green-800' : userRequest.status === 'rejected' ? 'text-red-800' : 'text-yellow-800'}`}>
                  
                    Request Status:{' '}
                    {userRequest.status.charAt(0).toUpperCase() +
                  userRequest.status.slice(1)}
                  </h4>
                  <p
                  className={`text-sm mt-1 ${userRequest.status === 'approved' ? 'text-green-700' : userRequest.status === 'rejected' ? 'text-red-700' : 'text-yellow-700'}`}>
                  
                    {userRequest.status === 'approved' ?
                  'Your API access has been granted. Use the key below to authenticate your requests.' :
                  userRequest.status === 'rejected' ?
                  'Your request for API access was declined. Please contact support for more information.' :
                  'Your request is currently under review by an administrator. You will be notified once a decision is made.'}
                  </p>
                </div>
              </div>
            </div>

            {userRequest.status === 'approved' && userRequest.apiKey &&
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your API Key
                </label>
                <div className="flex items-center">
                  <code className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-3 font-mono text-sm text-gray-800 break-all">
                    {userRequest.apiKey}
                  </code>
                  <button
                onClick={() => copyToClipboard(userRequest.apiKey!)}
                className="ml-3 p-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-gray-300 transition-colors"
                title="Copy to clipboard">
                
                    {copied ?
                <CheckCircleIcon className="h-5 w-5 text-green-600" /> :

                <CopyIcon className="h-5 w-5" />
                }
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2 flex items-center">
                  <AlertCircleIcon className="h-3 w-3 mr-1" />
                  Keep this key secret. Do not share it in client-side code.
                </p>
              </div>
          }

            {userRequest.status === 'approved' &&
          <div className="mt-8">
                <h4 className="font-semibold text-gray-900 mb-4">
                  Quick Start
                </h4>
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-gray-300 text-sm font-mono">
                    {`curl -X GET https://api.motech.ke/v1/meters \\
  -H "Authorization: Bearer ${userRequest.apiKey}" \\
  -H "Content-Type: application/json"`}
                  </pre>
                </div>
              </div>
          }
          </div>
        }
      </div>
    </div>);

}