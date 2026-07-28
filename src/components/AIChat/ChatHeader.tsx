import React from 'react';
import { SparklesIcon, PrinterIcon, DownloadIcon } from 'lucide-react';
interface ChatHeaderProps {
  isRateLimited: boolean;
  isTyping: boolean;
  onGenerateTicket: () => void;
  onExport: () => void;
}

/**
 * ChatHeader Component
 * Displays header with title and action buttons
 */
export default function ChatHeader({
  isRateLimited,
  isTyping,
  onGenerateTicket,
  onExport
}: ChatHeaderProps) {
  return <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
      <div className="flex items-center">
        <div className="p-2 bg-blue-100 rounded-lg mr-3">
          <SparklesIcon className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">AI Assistant</h3>
          <p className="text-xs text-gray-500">
            Ask by voice or text · answers can be read aloud
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <button onClick={onGenerateTicket} disabled={isRateLimited || isTyping} className="flex items-center px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-blue-200 bg-white" title="Generate Maintenance Ticket">
          <PrinterIcon className="h-4 w-4 mr-1" />
          Generate Ticket
        </button>
        <button onClick={onExport} disabled={isRateLimited} className="flex items-center px-3 py-1.5 text-sm text-gray-600 hover:bg-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Export Conversation">
          <DownloadIcon className="h-4 w-4 mr-1" />
          Export
        </button>
      </div>
    </div>;
}