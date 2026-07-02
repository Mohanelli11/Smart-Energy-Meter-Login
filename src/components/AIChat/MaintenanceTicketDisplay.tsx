import React from 'react';
import { PrinterIcon } from 'lucide-react';

interface MaintenanceTicket {
  ticketNumber: string;
  date: string;
  category: string;
  description: string;
  priority: string;
  status: string;
  assignedTo: string;
}

interface MaintenanceTicketDisplayProps {
  ticket: MaintenanceTicket;
}

/**
 * MaintenanceTicketDisplay Component
 * Displays generated maintenance ticket with printable styling
 */
export default function MaintenanceTicketDisplay({ ticket }: MaintenanceTicketDisplayProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex justify-start mt-4 px-4">
      <div className="maintenance-ticket-printable relative w-full max-w-md bg-white border border-gray-200 shadow-md rounded-lg overflow-hidden">
        {/* Watermark */}
        <div className="absolute top-2 left-2 opacity-15 pointer-events-none z-0">
          <img
            src="/image_639ac6c2.png"
            alt="MoTech Watermark"
            className="w-24 h-24 object-contain"
          />
        </div>

        <div className="relative z-10 p-5">
          <div className="flex justify-between items-start border-b border-gray-100 pb-3 mb-3">
            <div>
              <h4 className="font-bold text-gray-900 text-lg">
                Maintenance Ticket
              </h4>
              <p className="text-sm text-gray-500">{ticket.ticketNumber}</p>
            </div>
            <button
              onClick={() => window.print()}
              className="p-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors print:hidden"
              title="Print Ticket"
            >
              <PrinterIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-3 gap-2">
              <span className="text-gray-500 font-medium">Date:</span>
              <span className="col-span-2 text-gray-900">{ticket.date}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-gray-500 font-medium">Category:</span>
              <span className="col-span-2 text-gray-900">{ticket.category}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-gray-500 font-medium">Priority:</span>
              <span className="col-span-2">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    getPriorityColor(ticket.priority)
                  }`}
                >
                  {ticket.priority}
                </span>
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-gray-500 font-medium">Status:</span>
              <span className="col-span-2 text-gray-900">{ticket.status}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-gray-500 font-medium">Assigned To:</span>
              <span className="col-span-2 text-gray-900">{ticket.assignedTo}</span>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100">
              <span className="block text-gray-500 font-medium mb-1">
                Description:
              </span>
              <p className="text-gray-800 bg-gray-50 p-3 rounded border border-gray-100">
                {ticket.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}