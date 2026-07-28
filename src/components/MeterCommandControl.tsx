import React, { useEffect, useState } from 'react';
import { PowerIcon, RefreshCwIcon, ClockIcon, CheckCircleIcon, XCircleIcon, AlertTriangleIcon } from 'lucide-react';
import { queueCommand, getMeterCommands, MeterCommand, processQueue } from '../utils/commandQueue';
interface MeterCommandControlProps {
  meterAccountNo: string;
  userEmail: string;
  currentStatus: 'Active' | 'Disconnected' | string;
}
export function MeterCommandControl({
  meterAccountNo,
  userEmail,
  currentStatus
}: MeterCommandControlProps) {
  const [commands, setCommands] = useState<MeterCommand[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  // Poll for updates
  useEffect(() => {
    const fetchCommands = () => {
      const cmds = getMeterCommands(meterAccountNo);
      setCommands(cmds);
    };
    fetchCommands();
    // Poll every 2 seconds to show progress
    const interval = setInterval(fetchCommands, 2000);
    return () => clearInterval(interval);
  }, [meterAccountNo, refreshKey]);
  const handleCommand = (type: 'SWITCH_ON' | 'SWITCH_OFF') => {
    setLoading(true);
    // Queue the command
    queueCommand(meterAccountNo, type, userEmail);
    // Force refresh
    setRefreshKey((prev) => prev + 1);
    // Reset loading state after a short delay (UI feedback)
    setTimeout(() => setLoading(false), 500);
  };
  // Determine effective status based on queue
  const latestCommand = commands.length > 0 ? commands[0] : null;
  const isPending = latestCommand && (latestCommand.status === 'queued' || latestCommand.status === 'processing');
  return <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
        <h3 className="font-semibold text-gray-900 flex items-center">
          <PowerIcon className="h-5 w-5 mr-2 text-blue-600" />
          Remote Control
        </h3>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs rounded-full font-medium ${currentStatus === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            
            Physical: {currentStatus}
          </span>
        </div>
      </div>

      <div className="p-6">
        {/* Warning about queue rules */}
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-start">
            <AlertTriangleIcon className="h-5 w-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Command Queue Rules:</p>
              <ul className="mt-1 list-disc list-inside text-xs space-y-1">
                <li>Only one command can execute at a time per meter</li>
                <li>Commands are sent via NB-IoT/LoRa to the onsite meter</li>
                <li>
                  When a command completes, the next queued command expires
                </li>
                <li>
                  If not executed by next meter report, the next command will
                  queue
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex justify-center space-x-6 mb-8">
          <button onClick={() => handleCommand('SWITCH_ON')} disabled={loading || isPending} className={`flex flex-col items-center justify-center w-32 h-32 rounded-xl border-2 transition-all ${isPending ? 'opacity-50 cursor-not-allowed border-gray-200 bg-gray-50' : 'border-green-100 bg-green-50 hover:bg-green-100 hover:border-green-300 cursor-pointer'}`}>
            
            <PowerIcon className={`h-10 w-10 mb-2 ${isPending ? 'text-gray-400' : 'text-green-600'}`} />
            
            <span className={`font-bold ${isPending ? 'text-gray-500' : 'text-green-700'}`}>
              
              Switch ON
            </span>
          </button>

          <button onClick={() => handleCommand('SWITCH_OFF')} disabled={loading || isPending} className={`flex flex-col items-center justify-center w-32 h-32 rounded-xl border-2 transition-all ${isPending ? 'opacity-50 cursor-not-allowed border-gray-200 bg-gray-50' : 'border-red-100 bg-red-50 hover:bg-red-100 hover:border-red-300 cursor-pointer'}`}>
            
            <PowerIcon className={`h-10 w-10 mb-2 ${isPending ? 'text-gray-400' : 'text-red-600'}`} />
            
            <span className={`font-bold ${isPending ? 'text-gray-500' : 'text-red-700'}`}>
              
              Switch OFF
            </span>
          </button>
        </div>

        {isPending && <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center animate-pulse">
            <RefreshCwIcon className="h-5 w-5 text-blue-600 animate-spin mr-3" />
            <div>
              <p className="text-sm font-medium text-blue-900">
                Command in progress...
              </p>
              <p className="text-xs text-blue-700">
                {latestCommand?.type === 'SWITCH_ON' ? 'Switching meter ON' : 'Switching meter OFF'}{' '}
                via NB-IoT
              </p>
            </div>
          </div>}

        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Command Queue & History
          </h4>
          <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
            {commands.length === 0 ? <p className="text-sm text-gray-400 italic text-center py-4">
                No recent commands
              </p> : commands.map((cmd) => <div key={cmd.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm">
              
                  <div className="flex items-center">
                    {cmd.status === 'completed' ? <CheckCircleIcon className="h-4 w-4 text-green-500 mr-3" /> : cmd.status === 'failed' ? <XCircleIcon className="h-4 w-4 text-red-500 mr-3" /> : cmd.status === 'expired' ? <AlertTriangleIcon className="h-4 w-4 text-orange-500 mr-3" /> : <ClockIcon className="h-4 w-4 text-blue-500 mr-3" />}
                    <div>
                      <p className="font-medium text-gray-900">
                        {cmd.type === 'SWITCH_ON' ? 'Switch ON' : 'Switch OFF'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(cmd.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${cmd.status === 'completed' ? 'bg-green-100 text-green-800' : cmd.status === 'failed' ? 'bg-red-100 text-red-800' : cmd.status === 'expired' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                
                    {cmd.status}
                  </span>
                </div>)}
          </div>
        </div>
      </div>
    </div>;
}