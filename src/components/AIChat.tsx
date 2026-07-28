import React, { useEffect, useState, useRef, createContext, useContext } from 'react';
import { SendIcon, SparklesIcon, DownloadIcon, Loader2Icon, AlertTriangleIcon, PrinterIcon, Volume2Icon, VolumeXIcon, MicIcon, MicOffIcon } from 'lucide-react';
import { Meter } from '../utils/meterStorage';
import { processAIQuery } from '../utils/aiService';
import { validateChatMessage, sanitizeHTML } from '../utils/validation';
import { checkChatRateLimit, checkExportRateLimit } from '../utils/rateLimiter';
import { logSecurityEvent } from '../utils/security';
import ChatMessages from './AIChat/ChatMessages';
import ChatInput from './AIChat/ChatInput';
import ChatHeader from './AIChat/ChatHeader';
import MaintenanceTicketDisplay from './AIChat/MaintenanceTicketDisplay';
import SuggestedPrompts from './AIChat/SuggestedPrompts';

/**
 * Constants
 */
const AI_RESPONSE_DELAY_MS = 800;
const SUGGESTED_PROMPTS = ["What's the total consumption across all meters?", 'Show analytics for meter MET-1000-2023', 'Which customers have the highest revenue?', 'Show me meters with critical issues', "What's the predicted consumption for next week?", 'How many meters are currently offline?', "What's the average revenue per customer?", 'Generate a maintenance ticket for meters with issues'];
const SPEECH_ERRORS: Record<string, string> = {
  'not-allowed': 'Microphone access was denied. Please enable it to use voice.',
  'service-not-allowed': 'Speech recognition service is unavailable.',
  'network': 'Network error occurred during speech recognition.',
  'no-speech': 'No speech detected. Please try again.',
  'audio-capture': 'No microphone available.',
  'network-error': 'Network error. Please check your connection.'
};

/**
 * Types
 */
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
interface MaintenanceTicket {
  ticketNumber: string;
  date: string;
  category: string;
  description: string;
  priority: string;
  status: string;
  assignedTo: string;
}
interface AIChatProps {
  meters: Meter[];
  transactions: any[];
  userId: string;
}

/**
 * Chat Context for passing state to subcomponents
 */
const ChatContext = createContext<{
  isTyping: boolean;
  isRateLimited: boolean;
  error: string;
  speakingId: string | null;
  speechSupported: boolean;
  recognitionSupported: boolean;
  isListening: boolean;
  speak: (text: string, id: string) => void;
  handleSend: (query?: string) => void;
}>({
  isTyping: false,
  isRateLimited: false,
  error: '',
  speakingId: null,
  speechSupported: false,
  recognitionSupported: false,
  isListening: false,
  speak: () => {},
  handleSend: () => {}
});
export const useChatContext = () => useContext(ChatContext);

/**
 * Main AIChat Component
 */
export function AIChat({
  meters,
  transactions,
  userId
}: AIChatProps) {
  // Message state
  const [messages, setMessages] = useState<Message[]>([{
    id: '1',
    role: 'assistant',
    content: `Hello! I'm your AI assistant for the MoTech Electrical and Electronics Engineering Solutions SmartMeter system. I can help you analyze consumption data, revenue insights, meter diagnostics, and more.`,
    timestamp: new Date()
  }]);

  // UI state
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState('');
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [maintenanceTicket, setMaintenanceTicket] = useState<MaintenanceTicket | null>(null);

  // Voice state
  const [isListening, setIsListening] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [speechSupported] = useState(() => typeof window !== 'undefined' && 'speechSynthesis' in window);
  const [recognitionSupported] = useState(() => typeof window !== 'undefined' && Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition));

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const handleSendRef = useRef<(query?: string) => void>(() => {});

  /**
   * Auto-scroll to latest message
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages, maintenanceTicket]);

  /**
   * Text-to-Speech Handler
   */
  const speak = (text: string, id: string) => {
    if (!speechSupported) return;

    // Cancel all speech immediately to prevent queuing
    window.speechSynthesis.cancel();

    // Toggle off if same message
    if (speakingId === id) {
      setSpeakingId(null);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (speechSupported) window.speechSynthesis.cancel();
    };
  }, [speechSupported]);

  /**
   * Speech Recognition Setup
   */
  useEffect(() => {
    if (!recognitionSupported) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
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

      // Auto-send on final result
      const lastResult = event.results[event.results.length - 1];
      if (lastResult && lastResult.isFinal && transcript.trim()) {
        handleSendRef.current(transcript.trim());
        setInput('');
      }
    };
    recognition.onerror = (event: any) => {
      setIsListening(false);
      const errorMsg = SPEECH_ERRORS[event.error] || 'Speech recognition error.';
      setError(errorMsg);
      logSecurityEvent('SPEECH_RECOGNITION_ERROR', {
        error: event.error
      });
    };
    recognition.onend = () => {
      setIsListening(false);
    };
    recognitionRef.current = recognition;
    return () => {
      try {
        recognition.stop();
      } catch {

        // Ignore stop errors
      }};
  }, [recognitionSupported]);

  /**
   * Toggle voice listening
   */
  const toggleListening = () => {
    if (!recognitionSupported || !recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    // Prevent double-start
    if (isListening) {
      setError('Voice recognition already active.');
      return;
    }

    // Stop any ongoing speech
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
      setIsListening(false);
      logSecurityEvent('SPEECH_RECOGNITION_START_ERROR', {});
    }
  };

  /**
   * Generate maintenance ticket
   */
  const generateMaintenanceTicket = (prompt: string) => {
    const priorities = ['High', 'Medium', 'Low'];
    const randomPriority = priorities[Math.floor(Math.random() * priorities.length)];
    let category = 'General Maintenance';
    const lowerPrompt = prompt.toLowerCase();
    if (lowerPrompt.includes('consumption')) {
      category = 'Consumption Analysis';
    } else if (lowerPrompt.includes('revenue')) {
      category = 'Revenue Audit';
    } else if (lowerPrompt.includes('offline') || lowerPrompt.includes('issue')) {
      category = 'Meter Diagnostics';
    }
    setMaintenanceTicket({
      ticketNumber: `MT-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      date: new Date().toLocaleString(),
      category,
      description: `Automated ticket generated from AI analysis request: "${prompt}"`,
      priority: randomPriority,
      status: 'Open',
      assignedTo: 'MoTech Engineering Team'
    });
  };

  /**
   * Main message send handler
   */
  const handleSend = async (query?: string) => {
    const messageText = query || input.trim();
    if (!messageText) return;

    // Clear previous errors
    setError('');
    setIsRateLimited(false);

    // Generate ticket for suggested prompts
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

    // Check rate limiting
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

    // Sanitize message
    const sanitizedMessage = sanitizeHTML(messageText);

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: sanitizedMessage,
      timestamp: new Date()
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Log interaction
    logSecurityEvent('CHAT_MESSAGE_SENT', {
      messageLength: sanitizedMessage.length,
      remaining: rateLimit.remaining
    });

    // Simulate AI processing with delay
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
          content: 'I apologize, but I encountered an error processing your request. Please try again.',
          timestamp: new Date()
        };
        setMessages((prev) => [...prev, errorMessage]);
        logSecurityEvent('CHAT_PROCESSING_ERROR', {
          error: String(error)
        });
      } finally {
        setIsTyping(false);
      }
    }, AI_RESPONSE_DELAY_MS);
  };

  // Keep ref updated
  useEffect(() => {
    handleSendRef.current = handleSend;
  }, [handleSend]);

  /**
   * Export conversation
   */
  const exportConversation = () => {
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
      const conversationText = messages.map((msg) => {
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
  return <ChatContext.Provider value={{
    isTyping,
    isRateLimited,
    error,
    speakingId,
    speechSupported,
    recognitionSupported,
    isListening,
    speak,
    handleSend
  }}>
      <div className="flex flex-col h-[calc(100vh-300px)] bg-white rounded-lg border border-gray-200 shadow-sm">
        {/* Header */}
        <ChatHeader isRateLimited={isRateLimited} isTyping={isTyping} onGenerateTicket={() => generateMaintenanceTicket('Manual Ticket Generation')} onExport={exportConversation} />

        {/* Error Message */}
        {(error || isRateLimited) && <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-start">
              <AlertTriangleIcon className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>}

        {/* Messages */}
        <ChatMessages messages={messages} messagesEndRef={messagesEndRef} isTyping={isTyping} />

        {/* Maintenance Ticket */}
        {maintenanceTicket && !isTyping && <MaintenanceTicketDisplay ticket={maintenanceTicket} />}

        {/* Suggested Prompts */}
        {messages.length === 1 && !isRateLimited && <SuggestedPrompts prompts={SUGGESTED_PROMPTS} />}

        {/* Input */}
        <ChatInput input={input} setInput={setInput} onSend={handleSend} onToggleListening={toggleListening} isTyping={isTyping} isRateLimited={isRateLimited} />
      </div>
    </ChatContext.Provider>;
}