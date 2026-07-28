import React, { useEffect, useState } from 'react';
import {
  BrainCircuitIcon,
  TrendingUpIcon,
  DollarSignIcon,
  ActivityIcon,
  RefreshCwIcon,
  MessageSquareIcon } from
'lucide-react';
import { ConsumptionPrediction } from './ConsumptionPrediction';
import { RevenueAnalytics } from './RevenueAnalytics';
import { MeterDiagnostics } from './MeterDiagnostics';
import { AIChat } from './AIChat';
import {
  analyzeConsumption,
  analyzeRevenue,
  runDiagnostics,
  AIAnalysisResult } from
'../utils/aiService';
import { Meter } from '../utils/meterStorage';
interface AIInsightsProps {
  meters: Meter[];
  transactions: any[];
}
export function AIInsights({ meters, transactions }: AIInsightsProps) {
  const [activeTab, setActiveTab] = useState<
    'consumption' | 'revenue' | 'diagnostics' | 'chat'>(
    'chat');
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(
    null
  );
  useEffect(() => {
    // Simulate AI processing time
    const timer = setTimeout(() => {
      const consumptionTrends = analyzeConsumption(meters);
      const revenueInsights = analyzeRevenue(meters, transactions);
      const diagnostics = runDiagnostics(meters);
      setAnalysisResult({
        consumptionTrends,
        revenueInsights,
        diagnostics,
        lastUpdated: new Date().toLocaleTimeString()
      });
      setIsAnalyzing(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [meters, transactions]);
  const refreshAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      const consumptionTrends = analyzeConsumption(meters);
      const revenueInsights = analyzeRevenue(meters, transactions);
      const diagnostics = runDiagnostics(meters);
      setAnalysisResult({
        consumptionTrends,
        revenueInsights,
        diagnostics,
        lastUpdated: new Date().toLocaleTimeString()
      });
      setIsAnalyzing(false);
    }, 1000);
  };
  if (isAnalyzing || !analysisResult) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="relative">
          <BrainCircuitIcon className="h-16 w-16 text-blue-500 animate-pulse" />
          <div className="absolute top-0 right-0 h-4 w-4 bg-green-500 rounded-full animate-ping"></div>
        </div>
        <h2 className="mt-4 text-xl font-bold text-gray-900">
          AI Model Processing
        </h2>
        <p className="text-gray-500 mt-2">
          Analyzing {meters.length} meters and consumption patterns...
        </p>
        <div className="mt-6 w-64 bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full animate-[width_2s_ease-in-out_infinite]"
            style={{
              width: '75%'
            }}>
          </div>
        </div>
      </div>);

  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <BrainCircuitIcon className="h-8 w-8 text-blue-600 mr-3" />
            AI & ML Analytics Engine
          </h1>
          <p className="text-gray-500 mt-1">
            Predictive analysis, revenue forecasting, and intelligent
            diagnostics
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-500">
            Last updated: {analysisResult.lastUpdated}
          </span>
          <button
            onClick={refreshAnalysis}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            title="Refresh Analysis">
            
            <RefreshCwIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'chat' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'}`}>
          
          <MessageSquareIcon className="h-4 w-4 mr-2" />
          AI Assistant
        </button>
        <button
          onClick={() => setActiveTab('consumption')}
          className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'consumption' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'}`}>
          
          <TrendingUpIcon className="h-4 w-4 mr-2" />
          Consumption & Trends
        </button>
        <button
          onClick={() => setActiveTab('revenue')}
          className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'revenue' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'}`}>
          
          <DollarSignIcon className="h-4 w-4 mr-2" />
          Revenue Analytics
        </button>
        <button
          onClick={() => setActiveTab('diagnostics')}
          className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'diagnostics' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'}`}>
          
          <ActivityIcon className="h-4 w-4 mr-2" />
          Meter Diagnostics
          {analysisResult.diagnostics.length > 0 &&
          <span className="ml-2 bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full text-xs">
              {analysisResult.diagnostics.length}
            </span>
          }
        </button>
      </div>

      {/* Content Area */}
      <div className="min-h-[500px]">
        {activeTab === 'chat' &&
        <AIChat meters={meters} transactions={transactions} />
        }
        {activeTab === 'consumption' &&
        <ConsumptionPrediction data={analysisResult.consumptionTrends} />
        }
        {activeTab === 'revenue' &&
        <RevenueAnalytics data={analysisResult.revenueInsights} />
        }
        {activeTab === 'diagnostics' &&
        <MeterDiagnostics issues={analysisResult.diagnostics} />
        }
      </div>
    </div>);

}