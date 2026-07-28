import React from 'react';
import { WifiOffIcon, RefreshCwIcon } from 'lucide-react';
export function OfflineGate() {
  return <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900 px-6">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-6 animate-pulse">
          <WifiOffIcon className="h-10 w-10 text-red-400" />
        </div>

        <h1 className="text-3xl font-bold text-white mb-3">
          No Internet Connection
        </h1>

        <p className="text-blue-100/80 mb-2 leading-relaxed">
          MoTech SmartMeter requires an active internet connection to securely
          access the platform.
        </p>
        <p className="text-blue-100/60 text-sm mb-8">
          Please check your network and try again.
        </p>

        <button onClick={() => window.location.reload()} className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors shadow-lg shadow-blue-600/30">
          
          <RefreshCwIcon className="h-4 w-4 mr-2" />
          Retry Connection
        </button>

        <div className="mt-10 flex items-center justify-center space-x-2 text-xs text-blue-200/50">
          <span className="inline-block w-2 h-2 rounded-full bg-red-400 animate-pulse" />
          <span>Offline · Reconnecting will resume your session</span>
        </div>
      </div>

      <footer className="absolute bottom-4 left-0 right-0 text-center text-xs text-blue-200/40">
        &copy; {new Date().getFullYear()} MoTech Electrical and Electronics
        Engineering Solutions
      </footer>
    </div>;
}