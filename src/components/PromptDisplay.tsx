import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface PromptDisplayProps {
  prompt: {
    id: string;
    content: string;
    context?: string;
    resultsAchieved?: string;
    createdAt: string;
  };
  showActions?: boolean;
}

export default function PromptDisplay({ prompt, showActions = true }: PromptDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Prompt • {new Date(prompt.createdAt).toLocaleDateString()}
        </div>
        {showActions && (
          <button
            onClick={handleCopy}
            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-green-600">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Copy</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Context */}
      {prompt.context && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Context</h4>
          <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-md p-3">
            {prompt.context}
          </div>
        </div>
      )}

      {/* Prompt Content */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-900">Prompt</h4>
        <div className="text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-md p-4 font-mono whitespace-pre-wrap leading-relaxed">
          {prompt.content}
        </div>
      </div>

      {/* Results Achieved */}
      {prompt.resultsAchieved && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Results Achieved</h4>
          <div className="text-sm text-gray-600 bg-green-50 border border-green-200 rounded-md p-3">
            {prompt.resultsAchieved}
          </div>
        </div>
      )}
    </div>
  );
}