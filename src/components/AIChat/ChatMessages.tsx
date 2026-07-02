import React from 'react';
import { Loader2Icon, Volume2Icon, VolumeXIcon } from 'lucide-react';
import { useChatContext } from '../AIChat';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatMessagesProps {
  messages: Message[];
  messagesEndRef: React.RefObject<HTMLDivElement>;
  isTyping: boolean;
}

/**
 * ChatMessages Component
 * Displays the conversation history with read-aloud buttons
 */
export default function ChatMessages({ messages, messagesEndRef, isTyping }: ChatMessagesProps) {
  const { speakingId, speechSupported, speak } = useChatContext();

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4" role="log" aria-live="polite">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          role="article"
          aria-label={`${message.role === 'user' ? 'You' : 'AI'}: ${message.content}`}
        >
          <div
            className={`max-w-[80%] rounded-lg px-4 py-3 ${
              message.role === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-900'
            }`}
          >
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.content}
            </p>
            <div
              className={`flex items-center justify-between mt-1 ${
                message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
              }`}
            >
              <p className="text-xs">{message.timestamp.toLocaleTimeString()}</p>
              {message.role === 'assistant' && speechSupported && (
                <button
                  onClick={() => speak(message.content, message.id)}
                  className="ml-2 p-1 rounded hover:bg-gray-200 transition-colors text-gray-500"
                  title={
                    speakingId === message.id ? 'Stop reading' : 'Read aloud'
                  }
                  aria-label={
                    speakingId === message.id
                      ? 'Stop reading this message'
                      : 'Read this message aloud'
                  }
                >
                  {speakingId === message.id ? (
                    <VolumeXIcon className="h-4 w-4" />
                  ) : (
                    <Volume2Icon className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      {isTyping && (
        <div className="flex justify-start">
          <div className="bg-gray-100 rounded-lg px-4 py-3 flex items-center space-x-2">
            <Loader2Icon className="h-4 w-4 text-gray-500 animate-spin" />
            <span className="text-sm text-gray-500">AI is thinking...</span>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}