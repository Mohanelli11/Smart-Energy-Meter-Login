import React, { useEffect, useState, useRef, createElement } from 'react';
import { SendIcon, SparklesIcon, DownloadIcon, Loader2Icon, AlertTriangleIcon } from 'lucide-react';
import { Meter } from '../utils/meterStorage';
import { processAIQuery } from '../utils/aiService';
import { validateChatMessage, sanitizeHTML } from '../utils/validation';
import { checkChatRateLimit, checkExportRateLimit } from '../utils/rateLimiter';
import { logSecurityEvent } from '../utils/security';
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
interface AIChatProps {
  meters: Meter[];
  transactions: any[];
}
const SUGGESTED_PROMPTS = ["What's the total consumption across all meters?", 'Which customers have the highest revenue?', 'Show me meters with critical issues', "What's the predicted consumption for next week?", 'How many meters are currently offline?', "What's the average revenue per customer?"];
export function AIChat({
  meters,
  transactions
}: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([{
    id: '1',
    role: 'assistant',
    content: "Hello! I'm your AI assistant for the Hydrobox SmartMeter system. I can help you analyze consumption data, revenue insights, meter diagnostics, and more. What would you like to know?",
    timestamp: new Date()
  }]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState('');
  const [isRateLimited, setIsRateLimited] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  const handleSend = async (query?: string) => {
    const messageText = query || input.trim();
    if (!messageText) return;
    setError('');
    setIsRateLimited(false);
    // Validate message
    const validation = validateChatMessage(messageText);
    if (!validation.valid) {
      setError(validation.error!);
      logSecurityEvent('CHAT_VALIDATION_FAILED', {
        reason: validation.error
      });
      return;
    }
    // Check rate limiting (use a generic user ID for now)
    const userId = 'current-user'; // In production, use actual user ID
    const rateLimit = checkChatRateLimit(userId);
    if (!rateLimit.allowed) {
      setIsRateLimited(true);
      setError(rateLimit.error!);
      logSecurityEvent('CHAT_RATE_LIMITED', {
        userId,
        resetIn: rateLimit.resetIn
      });
      return;
    }
    // Sanitize message for display
    const sanitizedMessage = sanitizeHTML(messageText);
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: sanitizedMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    // Log chat interaction
    logSecurityEvent('CHAT_MESSAGE_SENT', {
      messageLength: sanitizedMessage.length,
      remaining: rateLimit.remaining
    });
    // Simulate AI processing
    setTimeout(() => {
      try {
        const response = processAIQuery(sanitizedMessage, meters, transactions);
        const sanitizedResponse = sanitizeHTML(response);
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: sanitizedResponse,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      } catch (error) {
        console.error('AI processing error:', error);
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'I apologize, but I encountered an error processing your request. Please try again.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
        logSecurityEvent('CHAT_PROCESSING_ERROR', {
          error: String(error)
        });
      } finally {
        setIsTyping(false);
      }
    }, 800);
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  const exportConversation = () => {
    // Check export rate limit
    const userId = 'current-user';
    const rateLimit = checkExportRateLimit(userId);
    if (!rateLimit.allowed) {
      setError(rateLimit.error!);
      setIsRateLimited(true);
      logSecurityEvent('EXPORT_RATE_LIMITED', {
        userId,
        resetIn: rateLimit.resetIn
      });
      return;
    }
    try {
      const conversationText = messages.map(msg => {
        const time = msg.timestamp.toLocaleTimeString();
        const role = msg.role === 'user' ? 'You' : 'AI Assistant';
        return `[${time}] ${role}:\n${msg.content}\n`;
      }).join('\n');
      const blob = new Blob([conversationText], {
        type: 'text/plain'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ai-conversation-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      logSecurityEvent('CHAT_EXPORTED', {
        messageCount: messages.length
      });
    } catch (error) {
      console.error('Export error:', error);
      setError('Failed to export conversation. Please try again.');
      logSecurityEvent('EXPORT_FAILED', {
        error: String(error)
      });
    }
  };
  return <div className="flex flex-col h-[calc(100vh-300px)] bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center">
          <div className="p-2 bg-blue-100 rounded-lg mr-3">
            <SparklesIcon className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">AI Assistant</h3>
            <p className="text-xs text-gray-500">
              Ask me anything about your meter data
            </p>
          </div>
        </div>
        <button onClick={exportConversation} disabled={isRateLimited} className="flex items-center px-3 py-1.5 text-sm text-gray-600 hover:bg-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Export Conversation">
          <DownloadIcon className="h-4 w-4 mr-1" />
          Export
        </button>
      </div>

      {/* Error/Rate Limit Message */}
      {(error || isRateLimited) && <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-start">
            <AlertTriangleIcon className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg px-4 py-3 ${message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
              <p className="text-sm whitespace-pre-wrap break-words">
                {message.content}
              </p>
              <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>)}

        {isTyping && <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-3 flex items-center space-x-2">
              <Loader2Icon className="h-4 w-4 text-gray-500 animate-spin" />
              <span className="text-sm text-gray-500">AI is thinking...</span>
            </div>
          </div>}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts */}
      {messages.length === 1 && !isRateLimited && <div className="px-4 pb-3">
          <p className="text-xs text-gray-500 mb-2">Suggested questions:</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_PROMPTS.map((prompt, index) => <button key={index} onClick={() => handleSend(prompt)} disabled={isTyping} className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {prompt}
              </button>)}
          </div>
        </div>}

      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          <input ref={inputRef} type="text" value={input} onChange={e => {
          setInput(e.target.value);
          setError('');
          setIsRateLimited(false);
        }} onKeyPress={handleKeyPress} placeholder="Ask about consumption, revenue, diagnostics..." className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" disabled={isTyping || isRateLimited} maxLength={500} autoComplete="off" />
          <button onClick={() => handleSend()} disabled={!input.trim() || isTyping || isRateLimited} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors" title="Send message">
            <SendIcon className="h-5 w-5" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          🔒 Messages are validated and rate-limited for security
        </p>
      </div>
    </div>;
}