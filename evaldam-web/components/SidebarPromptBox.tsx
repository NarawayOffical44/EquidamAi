'use client';

import { useState } from 'react';

interface SidebarPromptBoxProps {
  section: string;
  onContextChange: (context: string) => void;
}

export function SidebarPromptBox({ section, onContextChange }: SidebarPromptBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');

  const handleSubmit = () => {
    onContextChange(input);
    setInput('');
    setIsOpen(false);
  };

  const placeholders: Record<string, string> = {
    'upload': 'Any specific details from pitch deck? E.g., "Closed 3 enterprise deals worth $500k"',
    'company': 'Special market positioning? E.g., "Targeting Fortune 500 enterprise segment"',
    'metrics': 'Revenue assumptions? E.g., "Projected 50% MoM growth in Q2"',
    'team': 'Team achievements? E.g., "CEO previously founded exit worth $100M"',
    'market': 'Market opportunity? E.g., "Serving $50B TAM with zero penetration"',
  };

  return (
    <div className="mt-4 p-3 bg-neutral-800 rounded-lg border border-neutral-700">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left text-sm font-medium text-primary hover:text-primary/80 transition"
      >
        {isOpen ? '✕ Close' : '+ Add Custom Context'}
      </button>

      {isOpen && (
        <div className="mt-3 space-y-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholders[section] || 'Add any custom context for this section...'}
            className="w-full px-3 py-2 bg-neutral-900 border border-neutral-600 rounded text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            rows={3}
          />
          <button
            onClick={handleSubmit}
            className="w-full px-3 py-2 bg-primary text-black text-sm font-medium rounded hover:bg-primary/90 transition"
          >
            Add Context
          </button>
        </div>
      )}
    </div>
  );
}
