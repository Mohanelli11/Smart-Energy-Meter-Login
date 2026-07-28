import React from 'react';
import { SendIcon, MicIcon, MicOffIcon } from 'lucide-react';
import { useChatContext } from '../AIChat';
interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
  onToggleListening: () => void;
  isTyping: boolean;
  isRateLimited: boolean;
}

/**
 * ChatInput Component
 * Handles message input and voice recording controls
 */
export default function ChatInput({
  input,
  setInput,
  onSend,
  onToggleListening,
  isTyping,
  isRateLimited
}: ChatInputProps) {
  const {
    recognitionSupported,
    isListening,
    speechSupported
  } = useChatContext();
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };
  return <div className="p-4 border-t border-gray-200 bg-gray-50">
      <div className="flex items-center space-x-2">
        {recognitionSupported && <button onClick={onToggleListening} disabled={isTyping || isRateLimited} className={`p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isListening ? 'bg-red-600 text-white animate-pulse' : 'bg-white border border-gray-300 text-gray-600'}`} title={isListening ? 'Stop listening' : 'Speak your question'} aria-label={isListening ? 'Stop voice recording' : 'Start voice recording'}>
            {isListening ? <MicOffIcon className="h-5 w-5" /> : <MicIcon className="h-5 w-5" />}
          </button>}
        <input type="text" value={input} onChange={(e) => {
        setInput(e.target.value);
      }} onKeyPress={handleKeyPress} placeholder={isListening ? 'Listening… speak now' : 'Ask about consumption, revenue, diagnostics…'} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" disabled={isTyping || isRateLimited} maxLength={500} autoComplete="off" />

        <button onClick={onSend} disabled={!input.trim() || isTyping || isRateLimited} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors" title="Send message">
          <SendIcon className="h-5 w-5" />
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        🔒 Messages are validated and rate-limited for security
        {recognitionSupported ? ' · 🎙 Tap the mic to ask by voice' : ''}
        {speechSupported ? ' · 🔊 Tap the speaker to hear answers' : ''}
      </p>
    </div>;
}