import React from 'react';
import { useChatContext } from '../AIChat';

interface SuggestedPromptsProps {
  prompts: string[];
}

/**
 * SuggestedPrompts Component
 * Displays suggested questions for the user to click
 */
export default function SuggestedPrompts({ prompts }: SuggestedPromptsProps) {
  const { handleSend, isTyping } = useChatContext();

  return (
    <div className="px-4 pb-3">
      <p className="text-xs text-gray-500 mb-2">Suggested questions:</p>
      <div className="flex flex-wrap gap-2">
        {prompts.map((prompt, index) => (
          <button
            key={index}
            onClick={() => handleSend(prompt)}
            disabled={isTyping}
            className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}