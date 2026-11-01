import { useState } from 'react';
import {
  AlertTriangleIcon,
  CheckCircleIcon,
  InfoIcon,
  WrenchIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ActivityIcon,
  DownloadIcon,
  PrinterIcon } from
'lucide-react';
import { DiagnosticIssue, exportDiagnosticsReport } from '../utils/aiService';
interface MeterDiagnosticsProps {
  issues: DiagnosticIssue[];
}
export function MeterDiagnostics({ issues }: MeterDiagnosticsProps) {
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);
  const [maintenanceTicket, setMaintenanceTicket] = useState<{
    ticketNumber: string;
    date: string;
    meterId: string;
    customerName: string;
    location: string;
    issue: string;
    severity: string;
    recommendation: string;
    steps: string[];
  } | null>(null);
  const criticalCount = issues.filter((i) => i.severity === 'critical').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;
  const toggleExpand = (id: string) => {
    setExpandedIssue(expandedIssue === id ? null : id);
  };
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangleIcon className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertTriangleIcon className="h-5 w-5 text-yellow-600" />;
      case 'info':
        return <InfoIcon className="h-5 w-5 text-blue-600" />;
      default:
        return <InfoIcon className="h-5 w-5 text-gray-600" />;
    }
  };
  const handleExport = () => {
    exportDiagnosticsReport(issues);
  };
  const generateMaintenanceTicket = (issue: DiagnosticIssue) => {
    setMaintenanceTicket({
      ticketNumber: `MT-${new Date().getFullYear()}-${Math.floor(
        Math.random() * 10000
      ).
      toString().
      padStart(4, '0')}`,
      date: new Date().toLocaleString(),
      meterId: issue.meterId,
      customerName: issue.customerName,
      location: issue.location,
      issue: issue.issue,
      severity: issue.severity,
      recommendation: issue.recommendation,
      steps: issue.steps
    });
  };
  return (
    <div className="space-y-6">
      {/* Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 p-4 rounded-lg border border-green-200 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-green-800">System Health</p>
            <p className="text-2xl font-bold text-green-900">
              {issues.length === 0 ?
              '100%' :
              `${Math.max(0, 100 - issues.length * 2)}%`}
            </p>
          </div>
          <CheckCircleIcon className="h-8 w-8 text-green-500 opacity-50" />
        </div>

        <div className="bg-red-50 p-4 rounded-lg border border-red-200 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-red-800">Critical Issues</p>
            <p className="text-2xl font-bold text-red-900">{criticalCount}</p>
          </div>
          <AlertTriangleIcon className="h-8 w-8 text-red-500 opacity-50" />
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-yellow-800">Warnings</p>
            <p className="text-2xl font-bold text-yellow-900">{warningCount}</p>
          </div>
          <ActivityIcon className="h-8 w-8 text-yellow-500 opacity-50" />
        </div>
      </div>

      {/* Issues List */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">
            Detected Anomalies & Recommendations
          </h3>
          <div className="flex items-center space-x-3">
            <span className="text-xs text-gray-500">
              {issues.length} issues found
            </span>
            {issues.length > 0 &&
            <button
              onClick={handleExport}
              className="flex items-center px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium transition-colors">
              
                <DownloadIcon className="h-4 w-4 mr-1" />
                Export CSV
              </button>
            }
          </div>
        </div>

        {issues.length === 0 ?
        <div className="p-8 text-center">
            <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <h4 className="text-lg font-medium text-gray-900">
              All Systems Operational
            </h4>
            <p className="text-gray-500 mt-1">
              No anomalies detected in the meter network.
            </p>
          </div> :

        <div className="divide-y divide-gray-200">
            {issues.map((issue, index) =>
          <div key={`${issue.meterId}-${index}`} className="group">
                <div
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleExpand(`${issue.meterId}-${index}`)}>
              
                  <div className="flex items-center space-x-4">
                    <div
                  className={`p-2 rounded-full ${issue.severity === 'critical' ? 'bg-red-100' : issue.severity === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'}`}>
                  
                      {getSeverityIcon(issue.severity)}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">
                        {issue.issue}
                      </h4>
                      <p className="text-xs text-gray-500">
                        Meter: {issue.meterId} • {issue.customerName} •{' '}
                        {issue.location}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(issue.severity)}`}>
                  
                      {issue.severity.toUpperCase()}
                    </span>
                    {expandedIssue === `${issue.meterId}-${index}` ?
                <ChevronUpIcon className="h-5 w-5 text-gray-400" /> :

                <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                }
                  </div>
                </div>

                {expandedIssue === `${issue.meterId}-${index}` &&
            <div className="px-4 pb-4 pl-16 bg-gray-50 border-t border-gray-100">
                    <div className="mt-3 bg-white p-4 rounded-md border border-gray-200">
                      <div className="flex items-start mb-3">
                        <WrenchIcon className="h-4 w-4 text-gray-500 mr-2 mt-0.5" />
                        <h5 className="text-sm font-semibold text-gray-900">
                          Troubleshooting Procedure
                        </h5>
                      </div>
                      <p className="text-sm text-gray-700 mb-3 font-medium">
                        Recommendation: {issue.recommendation}
                      </p>
                      <ol className="list-decimal list-inside space-y-1">
                        {issue.steps.map((step, idx) =>
                  <li key={idx} className="text-sm text-gray-600 pl-1">
                            {step}
                          </li>
                  )}
                      </ol>
                      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                        <button
                    onClick={() => generateMaintenanceTicket(issue)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center">
                    
                          <PrinterIcon className="h-3 w-3 mr-1" />
                          Generate Maintenance Ticket
                        </button>
                      </div>
                    </div>
                  </div>
            }
              </div>
          )}
          </div>
        }
      </div>

      {/* Maintenance Ticket Modal */}
      {maintenanceTicket &&
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="maintenance-ticket-printable relative bg-white">
              {/* Watermark */}
              <div className="absolute top-4 left-4 opacity-15 pointer-events-none z-0">
                <img
                src="/image_639ac6c2.png"
                alt="MoTech Watermark"
                className="w-32 h-32 object-contain" />
              
              </div>

              <div className="relative z-10 p-8">
                {/* Header */}
                <div className="flex justify-between items-start border-b border-gray-200 pb-4 mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Maintenance Ticket
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {maintenanceTicket.ticketNumber}
                    </p>
                  </div>
                  <div className="flex space-x-2 print:hidden">
                    <button
                    onClick={() => window.print()}
                    className="p-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                    title="Print Ticket">
                    
                      <PrinterIcon className="h-5 w-5" />
                    </button>
                    <button
                    onClick={() => setMaintenanceTicket(null)}
                    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors">
                    
                      Close
                    </button>
                  </div>
                </div>

                {/* Ticket Details */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 font-medium">
                        Date & Time
                      </p>
                      <p className="text-sm text-gray-900">
                        {maintenanceTicket.date}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">
                        Severity
                      </p>
                      <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${maintenanceTicket.severity === 'critical' ? 'bg-red-100 text-red-800' : maintenanceTicket.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                      
                        {maintenanceTicket.severity.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 font-medium">
                        Meter ID
                      </p>
                      <p className="text-sm text-gray-900">
                        {maintenanceTicket.meterId}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">
                        Customer Name
                      </p>
                      <p className="text-sm text-gray-900">
                        {maintenanceTicket.customerName}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 font-medium">
                      Location
                    </p>
                    <p className="text-sm text-gray-900">
                      {maintenanceTicket.location}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 font-medium mb-2">
                      Issue Description
                    </p>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded border border-gray-200">
                      {maintenanceTicket.issue}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-2">
                      Recommendation
                    </p>
                    <p className="text-sm text-gray-900 bg-blue-50 p-3 rounded border border-blue-200">
                      {maintenanceTicket.recommendation}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-2">
                      Troubleshooting Steps
                    </p>
                    <ol className="list-decimal list-inside space-y-2 bg-gray-50 p-4 rounded border border-gray-200">
                      {maintenanceTicket.steps.map((step, idx) =>
                    <li key={idx} className="text-sm text-gray-700">
                          {step}
                        </li>
                    )}
                    </ol>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 font-medium">
                          Status
                        </p>
                        <p className="text-sm text-gray-900">Open</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">
                          Assigned To
                        </p>
                        <p className="text-sm text-gray-900">
                          MoTech Engineering Team
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-8 pt-4 border-t border-gray-200 text-center">
                  <p className="text-xs text-gray-500">
                    MoTech Electrical and Electronics Engineering Solutions
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    This is an automated maintenance ticket. Please contact
                    support for assistance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    </div>);

}