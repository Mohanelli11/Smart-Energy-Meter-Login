import React, { useEffect, useState, useRef, createElement } from 'react';
import {
  SendIcon,
  SparklesIcon,
  DownloadIcon,
  Loader2Icon,
  AlertTriangleIcon,
  PrinterIcon,
  Volume2Icon,
  VolumeXIcon,
  MicIcon,
  MicOffIcon } from
'lucide-react';
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
const SUGGESTED_PROMPTS = [
"What's the total consumption across all meters?",
'Show analytics for meter MET-1000-2023',
'Which customers have the highest revenue?',
'Show me meters with critical issues',
"What's the predicted consumption for next week?",
'How many meters are currently offline?',
"What's the average revenue per customer?",
'Generate a maintenance ticket for meters with issues'];

export function AIChat({ meters, transactions }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
  {
    id: '1',
    role: 'assistant',
    content:
    "Hello! I'm your AI assistant for the MoTech Electrical and Electronics Engineering Solutions SmartMeter system. I can help you analyze consumption data, revenue insights, meter diagnostics, and more. You can also use the microphone to ask by voice, or tap the speaker on any answer to have it read aloud. What would you like to know?",
    timestamp: new Date()
  }]
  );
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState('');
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [maintenanceTicket, setMaintenanceTicket] = useState<{
    ticketNumber: string;
    date: string;
    category: string;
    description: string;
    priority: string;
    status: string;
    assignedTo: string;
  } | null>(null);
  // Voice state
  const [isListening, setIsListening] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [speechSupported] = useState(
    () => typeof window !== 'undefined' && 'speechSynthesis' in window
  );
  const [recognitionSupported] = useState(
    () =>
    typeof window !== 'undefined' &&
    Boolean(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    )
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const handleSendRef = useRef<(query?: string) => void>(() => {});
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages, maintenanceTicket]);
  // ---- Text-to-Speech (Read Aloud) ----
  const speak = (text: string, id: string) => {
    if (!speechSupported) return;
    // Toggle off if the same message is already speaking
    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };
  // Stop any speech when component unmounts
  useEffect(() => {
    return () => {
      if (speechSupported) window.speechSynthesis.cancel();
    };
  }, [speechSupported]);
  // ---- Speech-to-Text (Voice Recording) ----
  useEffect(() => {
    if (!recognitionSupported) return;
    const SpeechRecognition =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInput(transcript);
      // When we have a final result, auto-send the decoded query
      const lastResult = event.results[event.results.length - 1];
      if (lastResult && lastResult.isFinal && transcript.trim()) {
        handleSendRef.current(transcript.trim());
        setInput('');
      }
    };
    recognition.onerror = (event: any) => {
      setIsListening(false);
      if (
      event.error === 'not-allowed' ||
      event.error === 'service-not-allowed')
      {
        setError('Microphone access was denied. Please enable it to use voice.');
      }
    };
    recognition.onend = () => {
      setIsListening(false);
    };
    recognitionRef.current = recognition;
    return () => {
      try {
        recognition.stop();
      } catch {

        /* noop */}
    };
  }, [recognitionSupported]);
  const toggleListening = () => {
    if (!recognitionSupported || !recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }
    // Stop any ongoing speech before listening
    if (speechSupported) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
    }
    setError('');
    setInput('');
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch {
      // start() can throw if already started — reset
      setIsListening(false);
    }
  };
  const generateMaintenanceTicket = (prompt: string) => {
    const priorities = ['High', 'Medium', 'Low'];
    const randomPriority =
    priorities[Math.floor(Math.random() * priorities.length)];
    let category = 'General Maintenance';
    if (prompt.toLowerCase().includes('consumption'))
    category = 'Consumption Analysis';else
    if (prompt.toLowerCase().includes('revenue'))
    category = 'Revenue Audit';else
    if (
    prompt.toLowerCase().includes('offline') ||
    prompt.toLowerCase().includes('issue'))

    category = 'Meter Diagnostics';
    setMaintenanceTicket({
      ticketNumber: `MT-${new Date().getFullYear()}-${Math.floor(
        Math.random() * 10000
      ).
      toString().
      padStart(4, '0')}`,
      date: new Date().toLocaleString(),
      category,
      description: `Automated ticket generated from AI analysis request: "${prompt}"`,
      priority: randomPriority,
      status: 'Open',
      assignedTo: 'MoTech Engineering Team'
    });
  };
  const handleSend = async (query?: string) => {
    const messageText = query || input.trim();
    if (!messageText) return;
    setError('');
    setIsRateLimited(false);
    if (query && SUGGESTED_PROMPTS.includes(query)) {
      generateMaintenanceTicket(query);
    }
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
    setMessages((prev) => [...prev, userMessage]);
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
        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error) {
        console.error('AI processing error:', error);
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content:
          'I apologize, but I encountered an error processing your request. Please try again.',
          timestamp: new Date()
        };
        setMessages((prev) => [...prev, errorMessage]);
        logSecurityEvent('CHAT_PROCESSING_ERROR', {
          error: String(error)
        });
      } finally {
        setIsTyping(false);
      }
    }, 800);
  };
  // Keep a ref to the latest handleSend for the speech-recognition callback
  useEffect(() => {
    handleSendRef.current = handleSend;
  });
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
      const conversationText = messages.
      map((msg) => {
        const time = msg.timestamp.toLocaleTimeString();
        const role = msg.role === 'user' ? 'You' : 'AI Assistant';
        return `[${time}] ${role}:\n${msg.content}\n`;
      }).
      join('\n');
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
  return (
    <div className="flex flex-col h-[calc(100vh-300px)] bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
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
          <button
            onClick={() =>
            generateMaintenanceTicket('Manual Ticket Generation')
            }
            disabled={isRateLimited || isTyping}
            className="flex items-center px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-blue-200 bg-white"
            title="Generate Maintenance Ticket">
            
            <PrinterIcon className="h-4 w-4 mr-1" />
            Generate Ticket
          </button>
          <button
            onClick={exportConversation}
            disabled={isRateLimited}
            className="flex items-center px-3 py-1.5 text-sm text-gray-600 hover:bg-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Export Conversation">
            
            <DownloadIcon className="h-4 w-4 mr-1" />
            Export
          </button>
        </div>
      </div>

      {/* Error/Rate Limit Message */}
      {(error || isRateLimited) &&
      <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-start">
            <AlertTriangleIcon className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      }

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) =>
        <div
          key={message.id}
          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          
            <div
            className={`max-w-[80%] rounded-lg px-4 py-3 ${message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
            
              <p className="text-sm whitespace-pre-wrap break-words">
                {message.content}
              </p>
              <div
              className={`flex items-center justify-between mt-1 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
              
                <p className="text-xs">
                  {message.timestamp.toLocaleTimeString()}
                </p>
                {message.role === 'assistant' && speechSupported &&
              <button
                onClick={() => speak(message.content, message.id)}
                className="ml-2 p-1 rounded hover:bg-gray-200 transition-colors text-gray-500"
                title={
                speakingId === message.id ? 'Stop reading' : 'Read aloud'
                }
                aria-label={
                speakingId === message.id ?
                'Stop reading this message' :
                'Read this message aloud'
                }>
                
                    {speakingId === message.id ?
                <VolumeXIcon className="h-4 w-4" /> :

                <Volume2Icon className="h-4 w-4" />
                }
                  </button>
              }
              </div>
            </div>
          </div>
        )}

        {isTyping &&
        <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-3 flex items-center space-x-2">
              <Loader2Icon className="h-4 w-4 text-gray-500 animate-spin" />
              <span className="text-sm text-gray-500">AI is thinking...</span>
            </div>
          </div>
        }

        {maintenanceTicket && !isTyping &&
        <div className="flex justify-start mt-4">
            <div className="maintenance-ticket-printable relative w-full max-w-md bg-white border border-gray-200 shadow-md rounded-lg overflow-hidden">
              {/* Watermark */}
              <div className="absolute top-2 left-2 opacity-15 pointer-events-none z-0">
                <img
                src="/image_639ac6c2.png"
                alt="MoTech Watermark"
                className="w-24 h-24 object-contain" />
              
              </div>

              <div className="relative z-10 p-5">
                <div className="flex justify-between items-start border-b border-gray-100 pb-3 mb-3">
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">
                      Maintenance Ticket
                    </h4>
                    <p className="text-sm text-gray-500">
                      {maintenanceTicket.ticketNumber}
                    </p>
                  </div>
                  <button
                  onClick={() => window.print()}
                  className="p-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors print:hidden"
                  title="Print Ticket">
                  
                    <PrinterIcon className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-gray-500 font-medium">Date:</span>
                    <span className="col-span-2 text-gray-900">
                      {maintenanceTicket.date}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-gray-500 font-medium">Category:</span>
                    <span className="col-span-2 text-gray-900">
                      {maintenanceTicket.category}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-gray-500 font-medium">Priority:</span>
                    <span className="col-span-2">
                      <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${maintenanceTicket.priority === 'High' ? 'bg-red-100 text-red-800' : maintenanceTicket.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                      
                        {maintenanceTicket.priority}
                      </span>
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-gray-500 font-medium">Status:</span>
                    <span className="col-span-2 text-gray-900">
                      {maintenanceTicket.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-gray-500 font-medium">
                      Assigned To:
                    </span>
                    <span className="col-span-2 text-gray-900">
                      {maintenanceTicket.assignedTo}
                    </span>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <span className="block text-gray-500 font-medium mb-1">
                      Description:
                    </span>
                    <p className="text-gray-800 bg-gray-50 p-3 rounded border border-gray-100">
                      {maintenanceTicket.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts */}
      {messages.length === 1 && !isRateLimited &&
      <div className="px-4 pb-3">
          <p className="text-xs text-gray-500 mb-2">Suggested questions:</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_PROMPTS.map((prompt, index) =>
          <button
            key={index}
            onClick={() => handleSend(prompt)}
            disabled={isTyping}
            className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            
                {prompt}
              </button>
          )}
          </div>
        </div>
      }

      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          {recognitionSupported &&
          <button
            onClick={toggleListening}
            disabled={isTyping || isRateLimited}
            className={`p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isListening ? 'bg-red-600 text-white animate-pulse' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'}`}
            title={isListening ? 'Stop listening' : 'Speak your question'}
            aria-label={
            isListening ? 'Stop voice recording' : 'Start voice recording'
            }>
            
              {isListening ?
            <MicOffIcon className="h-5 w-5" /> :

            <MicIcon className="h-5 w-5" />
            }
            </button>
          }
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError('');
              setIsRateLimited(false);
            }}
            onKeyPress={handleKeyPress}
            placeholder={
            isListening ?
            'Listening… speak now' :
            'Ask about consumption, revenue, diagnostics…'
            }
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isTyping || isRateLimited}
            maxLength={500}
            autoComplete="off" />
          
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping || isRateLimited}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            title="Send message">
            
            <SendIcon className="h-5 w-5" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          🔒 Messages are validated and rate-limited for security
          {recognitionSupported ? ' · 🎙 Tap the mic to ask by voice' : ''}
          {speechSupported ? ' · 🔊 Tap the speaker to hear answers' : ''}
        </p>
      </div>
    </div>);

}