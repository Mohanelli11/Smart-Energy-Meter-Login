import React, { useEffect, useState } from 'react';
import { PowerIcon, PowerOffIcon, AlertTriangleIcon, ClockIcon, CheckCircleIcon, XCircleIcon, Loader2Icon, ListIcon } from 'lucide-react';
import { Meter } from '../utils/meterStorage';
import { createCommand, getMeterCommands, getActiveMeterCommand, cancelCommand, simulateCommandExecution, getMeterCommandStats, MeterCommand } from '../utils/commandQueue';
interface MeterControlModalProps {
  meter: Meter;
  onClose: () => void;
  userEmail: string;
}
export function MeterControlModal({
  meter,
  onClose,
  userEmail
}: MeterControlModalProps) {
  const [activeCommand, setActiveCommand] = useState<MeterCommand | null>(null);
  const [commandHistory, setCommandHistory] = useState<MeterCommand[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedAction, setSelectedAction] = useState<'connect' | 'disconnect' | null>(null);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'control' | 'history'>('control');
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 2000); // Refresh every 2 seconds
    return () => clearInterval(interval);
  }, [meter.meterNo]);
  const loadData = () => {
    setActiveCommand(getActiveMeterCommand(meter.meterNo));
    setCommandHistory(getMeterCommands(meter.meterNo).slice(-10).reverse());
    setStats(getMeterCommandStats(meter.meterNo));
  };
  const handleActionClick = (action: 'connect' | 'disconnect') => {
    setSelectedAction(action);
    setShowConfirm(true);
  };
  const handleConfirmAction = () => {
    if (!selectedAction) return;
    const result = createCommand(meter.meterNo, meter.meterNo, selectedAction, userEmail, {
      reason: reason.trim() || undefined,
      notes: notes.trim() || undefined
    });
    if ('error' in result) {
      alert(result.error);
    } else {
      // Simulate command execution (in production, this would be handled by the backend)
      simulateCommandExecution(result.id);
      setShowConfirm(false);
      setSelectedAction(null);
      setReason('');
      setNotes('');
      loadData();
    }
  };
  const handleCancelCommand = (commandId: string) => {
    if (confirm('Are you sure you want to cancel this command?')) {
      cancelCommand(commandId);
      loadData();
    }
  };
  const getStatusIcon = (status: MeterCommand['status']) => {
    switch (status) {
      case 'queued':
        return <ClockIcon className="h-5 w-5 text-yellow-600" />;
      case 'executing':
        return <Loader2Icon className="h-5 w-5 text-blue-600 animate-spin" />;
      case 'executed':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-600" />;
      case 'expired':
        return <AlertTriangleIcon className="h-5 w-5 text-gray-600" />;
    }
  };
  const getStatusColor = (status: MeterCommand['status']) => {
    switch (status) {
      case 'queued':
        return 'bg-yellow-100 text-yellow-800';
      case 'executing':
        return 'bg-blue-100 text-blue-800';
      case 'executed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
    }
  };
  return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Remote Meter Control
              </h2>
              <p className="text-gray-500 mt-1">
                {meter.customerName} • {meter.meterNo}
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <XCircleIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          <button onClick={() => setActiveTab('control')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'control' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>
            Control
          </button>
          <button onClick={() => setActiveTab('history')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>
            History ({commandHistory.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'control' && <div className="space-y-6">
              {/* Active Command Warning */}
              {activeCommand && <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertTriangleIcon className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-yellow-900 mb-1">
                        Command In Progress
                      </h3>
                      <p className="text-sm text-yellow-800 mb-2">
                        A {activeCommand.command} command is currently{' '}
                        {activeCommand.status}. Please wait for it to complete
                        before sending another command.
                      </p>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activeCommand.status)}`}>
                          {activeCommand.status}
                        </span>
                        {activeCommand.status === 'queued' && <button onClick={() => handleCancelCommand(activeCommand.id)} className="text-xs text-red-600 hover:text-red-800 font-medium">
                            Cancel Command
                          </button>}
                      </div>
                    </div>
                  </div>
                </div>}

              {/* Control Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => handleActionClick('connect')} disabled={!!activeCommand} className="flex flex-col items-center justify-center p-6 border-2 border-green-200 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white">
                  <PowerIcon className="h-12 w-12 text-green-600 mb-3" />
                  <span className="text-lg font-semibold text-gray-900">
                    Connect
                  </span>
                  <span className="text-sm text-gray-500 mt-1">
                    Turn meter ON
                  </span>
                </button>

                <button onClick={() => handleActionClick('disconnect')} disabled={!!activeCommand} className="flex flex-col items-center justify-center p-6 border-2 border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white">
                  <PowerOffIcon className="h-12 w-12 text-red-600 mb-3" />
                  <span className="text-lg font-semibold text-gray-900">
                    Disconnect
                  </span>
                  <span className="text-sm text-gray-500 mt-1">
                    Turn meter OFF
                  </span>
                </button>
              </div>

              {/* Statistics */}
              {stats && <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Command Statistics
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {stats.executed}
                      </div>
                      <div className="text-xs text-gray-500">Executed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {stats.queued}
                      </div>
                      <div className="text-xs text-gray-500">Queued</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {stats.failed}
                      </div>
                      <div className="text-xs text-gray-500">Failed</div>
                    </div>
                  </div>
                </div>}

              {/* Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">
                  How It Works
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Commands are sent via NBIoT/LoRa network</li>
                  <li>• Only one command can execute at a time</li>
                  <li>• Commands expire after 24 hours if not executed</li>
                  <li>• Successful execution auto-expires queued commands</li>
                </ul>
              </div>
            </div>}

          {activeTab === 'history' && <div className="space-y-3">
              {commandHistory.length === 0 ? <div className="text-center py-12">
                  <ListIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No command history</p>
                </div> : commandHistory.map(cmd => <div key={cmd.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(cmd.status)}
                        <div>
                          <span className="font-medium text-gray-900 capitalize">
                            {cmd.command}
                          </span>
                          <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(cmd.status)}`}>
                            {cmd.status}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(cmd.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {cmd.metadata?.reason && <p className="text-sm text-gray-600 mb-1">
                        <strong>Reason:</strong> {cmd.metadata.reason}
                      </p>}
                    {cmd.error && <p className="text-sm text-red-600">
                        <strong>Error:</strong> {cmd.error}
                      </p>}
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                      <span>
                        Attempts: {cmd.attempts}/{cmd.maxAttempts}
                      </span>
                      {cmd.executedAt && <span>
                          Executed: {new Date(cmd.executedAt).toLocaleString()}
                        </span>}
                    </div>
                  </div>)}
            </div>}
        </div>

        {/* Confirmation Modal */}
        {showConfirm && selectedAction && <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Confirm{' '}
                {selectedAction === 'connect' ? 'Connection' : 'Disconnection'}
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason (Optional)
                </label>
                <input type="text" value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g., Non-payment, Maintenance" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" maxLength={100} />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional notes..." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" rows={3} maxLength={200} />
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  This command will be sent to the meter via NBIoT/LoRa network.
                  It may take a few minutes to execute.
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button onClick={() => {
              setShowConfirm(false);
              setSelectedAction(null);
              setReason('');
              setNotes('');
            }} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  Cancel
                </button>
                <button onClick={handleConfirmAction} className={`px-4 py-2 text-white rounded-lg transition-colors ${selectedAction === 'connect' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                  Confirm{' '}
                  {selectedAction === 'connect' ? 'Connect' : 'Disconnect'}
                </button>
              </div>
            </div>
          </div>}
      </div>
    </div>;
}